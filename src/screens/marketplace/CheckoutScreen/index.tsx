import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { SecondaryButton } from '@/components/ui/buttons';
import { Stepper } from '@/components/ui/tabs';
import { storageService, orderService, userService } from '@/services';
import { isHttpRequestTimeoutError } from '@/utils/network/isHttpRequestTimeoutError';
import { getShippingQuote } from '@/services/shipping/shippingService';
import { formatZipCodeDisplay } from '@/services/address/cepService';
import { formatPrice, formatAddress, formatBillingAddress } from '@/utils';
import { catalogTypeTranslatedBadgeLabels, PRODUCT_CATALOG_TYPE } from '@/types/product';
import { isProtocolCartItem, cartProtocolProductIdsWithActiveAccess } from '@/utils/profile/protocolProduct';
import { useTranslation, usePayment, useCheckoutVoucher, useCartShippingPolicy, useMenuItems } from '@/hooks';
import { useFloatingMenuActions } from '@/contexts/FloatingMenuContext';
import { checkoutDisplayAmounts } from '@/utils/marketplace/checkoutDisplayAmounts';
import { logger } from '@/utils/logger';
import { navigateToActivitiesOrders } from '@/utils/navigation/activitiesNavigation';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';
import { styles } from './styles';
import AddressForm, { AddressData, EMPTY_ADDRESS, isAddressFilled } from './address/AddressForm';
import PaymentForm from './payment/PaymentForm';
import CheckoutVoucherSection from './voucher/CheckoutVoucherSection';
import { ProductRowCard } from '@/components/ui/cards';
import OrderSummary from './order/OrderSummary';
import OrderScreen, { type OrderScreenStatus } from './order/OrderScreen';
import type { CreateOrderData } from '@/types/order';
import { useAnalyticsScreen } from '@/analytics';
import { useCart } from '@/hooks';

const noop = (): void => undefined;

type PaymentMethod = 'credit_card' | 'pix';
type CheckoutStep = 'address' | 'payment' | 'order';

const PAYMENT_METHOD: PaymentMethod = 'credit_card';

type Props = {
  navigation: any;
  route?: any;
};

const CheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'Checkout', screenClass: 'CheckoutScreen' });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  const { setMenu, clearMenu } = useFloatingMenuActions();
  const { cartItems, loadCartItems, increaseQuantity, decreaseQuantity, removeItem, subtotal } = useCart({
    onEmpty: () => navigation.navigate('Cart'),
  });

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [addressData, setAddressData] = useState<AddressData>(EMPTY_ADDRESS);
  const [billingAddressData, setBillingAddressData] = useState<AddressData>(EMPTY_ADDRESS);
  const [deliverySameAsBilling, setDeliverySameAsBilling] = useState(true);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [addressLoadError, setAddressLoadError] = useState<string | null>(null);
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null);
  const payment = usePayment();
  const checkoutSubmitInFlightRef = useRef(false);
  const checkoutSubmitCompletedRef = useRef(false);
  const checkoutSubmitBlockedRef = useRef(false);
  const [checkoutSubmitCompleted, setCheckoutSubmitCompleted] = useState(false);
  const [checkoutSubmitBlocked, setCheckoutSubmitBlocked] = useState(false);
  const [ownedProtocolCheckoutBlocked, setOwnedProtocolCheckoutBlocked] = useState(false);
  const [isOrderSubmitLocked, setIsOrderSubmitLocked] = useState(false);
  const checkoutVoucher = useCheckoutVoucher();
  const [shipping, setShipping] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderCompletionStatus, setOrderCompletionStatus] = useState<OrderScreenStatus>('success');

  const { shippingRequired, isResolving: shippingPolicyLoading } = useCartShippingPolicy(cartItems);
  const isShippingDisabled = shippingRequired === false;
  const effectiveShipping = isShippingDisabled ? 0 : shipping;
  const productIds = useMemo(() => cartItems.map((item) => item.id).filter(Boolean), [cartItems]);
  const cartHasProgram = useMemo(() => cartItems.some((item) => isProtocolCartItem(item)), [cartItems]);

  const effectiveDeliveryAddress = deliverySameAsBilling ? billingAddressData : addressData;
  const deliveryZipCode = (effectiveDeliveryAddress.zipCode || '').replace(/\D/g, '');
  const fallbackZipCode = (addressData.zipCode || '').replace(/\D/g, '');
  const zipCodeForShipping = deliveryZipCode.length === 8 ? deliveryZipCode : fallbackZipCode;

  useEffect(() => {
    loadCartItems();
    loadUserAddress();
  }, []);

  useEffect(() => {
    if (!cartHasProgram) {
      setOwnedProtocolCheckoutBlocked(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const ownedProductIds = await cartProtocolProductIdsWithActiveAccess(cartItems);
        if (!cancelled) {
          setOwnedProtocolCheckoutBlocked(ownedProductIds.length > 0);
        }
      } catch (error) {
        logger.error('[CheckoutScreen] Falha ao verificar protocolos ativos no carrinho', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartItems, cartHasProgram]);

  useEffect(() => {
    if (currentStep === 'order') {
      setMenu(menuItems, 'marketplace');
      return () => clearMenu();
    }
    clearMenu();
  }, [currentStep, menuItems, setMenu, clearMenu]);

  useEffect(() => {
    return () => clearMenu();
  }, [clearMenu]);

  const loadUserAddress = async () => {
    try {
      setAddressLoadError(null);
      const address = await userService.getShippingAddress();
      if (address) {
        setAddressData(address);
      } else {
        const cartZip = route?.params?.zipCode;
        const digits = (cartZip || '').replace(/\D/g, '');
        if (digits.length === 8) {
          setAddressData({ ...EMPTY_ADDRESS, zipCode: formatZipCodeDisplay(cartZip!) });
        }
      }
    } catch (error) {
      logger.error('[CheckoutScreen] Erro ao carregar endereço do usuário', error);
      setAddressLoadError(t('checkout.addressLoadError'));
    } finally {
      setAddressLoaded(true);
    }
  };

  useEffect(() => {
    if (isShippingDisabled) {
      setShipping(0);
      setShippingLoading(false);
      return;
    }
    if (zipCodeForShipping.length !== 8) {
      setShipping(0);
      return;
    }
    let cancelled = false;
    setShippingLoading(true);
    getShippingQuote(zipCodeForShipping, productIds)
      .then((res) => {
        if (!cancelled) setShipping(res.requiresShipping === false ? 0 : res.minValue);
      })
      .catch(() => {
        if (!cancelled) setShipping(0);
      })
      .then(() => {
        if (!cancelled) setShippingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zipCodeForShipping, currentStep, isShippingDisabled, productIds]);

  const checkoutAmountsRef = useRef({ subtotal, shipping: effectiveShipping });

  useEffect(() => {
    if (!checkoutVoucher.appliedPreview) {
      checkoutAmountsRef.current = { subtotal, shipping: effectiveShipping };
      return;
    }

    const previous = checkoutAmountsRef.current;
    if (previous.subtotal === subtotal && previous.shipping === effectiveShipping) {
      return;
    }

    checkoutAmountsRef.current = { subtotal, shipping: effectiveShipping };
    void checkoutVoucher.syncAppliedWithAmounts(
      { subtotal, shippingCost: effectiveShipping },
      t('checkout.invalidCoupon', { defaultValue: 'Cupom inválido' }),
    );
  }, [subtotal, effectiveShipping, checkoutVoucher.appliedPreview?.code, t]);

  useEffect(() => {
    if (currentStep !== 'payment') payment.setPaymentError(null);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'payment' && !isAddressFilled(billingAddressData) && addressData.addressLine1?.trim()) {
      setBillingAddressData(addressData);
    }
  }, [currentStep]);

  const isAddressValid = isAddressFilled(addressData);

  const canProceedFromAddress = isAddressValid && (deliverySameAsBilling || isAddressFilled(billingAddressData));

  const isShippingBlocking = !isShippingDisabled && (shipping === 0 || shippingLoading || shippingPolicyLoading);
  const isPaymentSubmitBlocked = checkoutSubmitCompleted || isOrderSubmitLocked || checkoutSubmitBlocked;
  const isContinueDisabled =
    (currentStep === 'address' && (!canProceedFromAddress || isShippingBlocking)) ||
    (currentStep === 'payment' &&
      (isShippingBlocking || payment.isProcessing || isPaymentSubmitBlocked || ownedProtocolCheckoutBlocked));
  const isContinueLoading = currentStep === 'payment' && payment.isProcessing;

  const handleContinue = async () => {
    if (currentStep === 'address' && !canProceedFromAddress) {
      return;
    }
    if (currentStep === 'address') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      if (isPaymentSubmitBlocked || checkoutSubmitInFlightRef.current || payment.isProcessing) {
        return;
      }
      checkoutSubmitInFlightRef.current = true;
      setIsOrderSubmitLocked(true);
      payment.setIsProcessing(true);
      await handleCompleteOrder();
    }
  };

  const releaseCheckoutSubmitLock = () => {
    checkoutSubmitInFlightRef.current = false;
    setIsOrderSubmitLocked(false);
    payment.setIsProcessing(false);
  };

  const blockCheckoutSubmitPermanently = () => {
    checkoutSubmitBlockedRef.current = true;
    setCheckoutSubmitBlocked(true);
    checkoutSubmitInFlightRef.current = true;
    setIsOrderSubmitLocked(true);
    payment.setIsProcessing(false);
  };

  const handleCompleteOrder = async () => {
    if (checkoutSubmitCompleted || checkoutSubmitBlockedRef.current) {
      return;
    }

    if (!checkoutSubmitInFlightRef.current) {
      checkoutSubmitInFlightRef.current = true;
      setIsOrderSubmitLocked(true);
      payment.setIsProcessing(true);
    }

    try {
      if (cartItems.length === 0) {
        Alert.alert(t('errors.error'), t('checkout.orderError'));
        releaseCheckoutSubmitLock();
        return;
      }

      if (cartHasProgram) {
        const ownedProductIds = await cartProtocolProductIdsWithActiveAccess(cartItems);
        if (ownedProductIds.length > 0) {
          setOwnedProtocolCheckoutBlocked(true);
          Alert.alert(t('errors.error'), t('marketplace.programAlreadySubscribed'));
          releaseCheckoutSubmitLock();
          return;
        }
      }

      if (!isShippingDisabled && (shipping === 0 || shippingLoading)) {
        Alert.alert(t('errors.error'), t('checkout.shippingRequired'));
        releaseCheckoutSubmitLock();
        return;
      }

      if (PAYMENT_METHOD === 'credit_card') {
        const errors = payment.validatePaymentFields(t);
        if (errors) {
          payment.setPaymentFieldErrors(errors);
          payment.setPaymentError(null);
          releaseCheckoutSubmitLock();
          return;
        }
      }

      const orderItems = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        discount: 0,
      }));

      logger.debug('Produtos do carrinho que serão enviados para o backend:', {
        totalItems: cartItems.length,
        items: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
      });

      const billingAddressObj = formatBillingAddress(billingAddressData);

      const shippingAddressData = deliverySameAsBilling ? billingAddressData : addressData;
      if (!isAddressFilled(billingAddressData)) {
        Alert.alert(t('errors.error'), t('checkout.orderError'));
        releaseCheckoutSubmitLock();
        return;
      }

      const shippingAddressFormatted = formatAddress(shippingAddressData);
      const cardDataObj = payment.getCardData();

      const orderData: CreateOrderData = {
        items: orderItems,
        status: 'pending',
        shippingCost: effectiveShipping,
        tax: 0,
        shippingAddress: shippingAddressFormatted,
        billingAddress: billingAddressObj,
        paymentMethod: PAYMENT_METHOD,
      };

      if (PAYMENT_METHOD === 'credit_card') {
        if (!cardDataObj) {
          Alert.alert(t('errors.error'), t('checkout.orderError'));
          releaseCheckoutSubmitLock();
          return;
        }
        orderData.cardData = cardDataObj;
      }

      if (cartHasProgram) {
        orderData.billingPeriod = 'MONTHLY';
      }

      const appliedVoucher = checkoutVoucher.appliedPreview;
      if (appliedVoucher) {
        orderData.voucherCode = appliedVoucher.code;
        orderData.shippingCost = isShippingDisabled ? 0 : appliedVoucher.shippingCost;
      }

      logger.debug('Dados do pedido completos:', orderData);

      const orderResponse = await orderService.createOrder(orderData);

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Falha ao criar pedido');
      }

      const orderPaymentStatus = orderResponse.data.paymentStatus;

      if (orderPaymentStatus === 'failed') {
        throw new Error(
          t('checkout.paymentDeclined', {
            defaultValue: 'Pagamento recusado. Verifique os dados do cartão e tente novamente.',
          }),
        );
      }

      if (orderPaymentStatus === 'pending') {
        logger.warn('[CheckoutScreen] Pedido criado com pagamento pendente', {
          orderId: orderResponse.data.id,
        });
      }

      checkoutSubmitCompletedRef.current = true;
      setCheckoutSubmitCompleted(true);

      setOrderId(orderResponse.data.id);
      setOrderCompletionStatus(orderPaymentStatus === 'pending' ? 'pending' : 'success');
      await storageService.clearCart();
      checkoutVoucher.removeCoupon();
      setCurrentStep('order');
    } catch (error: unknown) {
      if (isHttpRequestTimeoutError(error)) {
        logger.warn('[CheckoutScreen] Criação do pedido excedeu API_HTTP_REQUEST_TIMEOUT_MS');
        const timeoutMessage = t('checkout.orderTimeout', {
          defaultValue: 'A requisição demorou demais. Confira seus pedidos antes de tentar novamente.',
        });
        payment.setPaymentError(timeoutMessage);
        Alert.alert(t('errors.error'), timeoutMessage);
        blockCheckoutSubmitPermanently();
        return;
      }

      logger.error('[CheckoutScreen] Erro ao concluir pedido', error);

      const serverMessage = error instanceof Error && error.message.trim() ? error.message.trim() : null;

      const isDuplicateEnrollmentError =
        serverMessage &&
        (serverMessage.includes('já possui uma assinatura') || serverMessage.includes('Consulte seus pedidos'));

      const isPaymentError =
        serverMessage &&
        (serverMessage.includes('Pagamento') ||
          serverMessage.includes('recusado') ||
          serverMessage.includes('cartão') ||
          serverMessage.includes('CPF') ||
          serverMessage.includes('Pagarme'));

      const userMessage = isPaymentError ? serverMessage : t('checkout.orderError');

      payment.setPaymentError(userMessage);
      Alert.alert(t('errors.error'), userMessage);

      if (isDuplicateEnrollmentError) {
        releaseCheckoutSubmitLock();
        return;
      }

      if (isPaymentError && serverMessage?.includes('recusado')) {
        releaseCheckoutSubmitLock();
        return;
      }

      releaseCheckoutSubmitLock();
    } finally {
      if (checkoutSubmitCompletedRef.current) {
        setIsOrderSubmitLocked(true);
        payment.setIsProcessing(false);
      }
    }
  };

  const handleViewOrdersPress = () => {
    navigateToActivitiesOrders(navigation);
  };

  const handleProductPress = (itemId: string) => {
    navigateToProductDetailsScreen(navigation, { productId: itemId });
  };

  const handleSaveAddress = async (address: AddressData) => {
    try {
      setAddressSaveError(null);
      await userService.saveShippingAddress(address);
      setAddressData(address);
    } catch (error: any) {
      const message = (error?.message && String(error.message).trim()) || t('checkout.addressSaveError');
      setAddressSaveError(message);
      throw error;
    }
  };

  const handleSaveBillingAddress = (address: AddressData) => {
    setBillingAddressData(address);
    setDeliverySameAsBilling(false);
  };

  const handleDeliverySameAsBillingChange = (value: boolean) => {
    setDeliverySameAsBilling(value);
    if (value) {
      setBillingAddressData(addressData);
    } else {
      setBillingAddressData(EMPTY_ADDRESS);
    }
  };

  const handleApplyCoupon = () => {
    void checkoutVoucher.applyCoupon(
      { subtotal, shippingCost: effectiveShipping },
      t('checkout.invalidCoupon', { defaultValue: 'Cupom inválido' }),
    );
  };

  const summaryAmounts = useMemo(
    () =>
      checkoutDisplayAmounts({
        subtotal,
        shipping: effectiveShipping,
        showShipping: !isShippingDisabled,
        appliedVoucher: checkoutVoucher.appliedPreview,
      }),
    [subtotal, effectiveShipping, isShippingDisabled, checkoutVoucher.appliedPreview],
  );

  const stepperSteps = useMemo(
    () => [
      { id: 'address', label: t('checkout.address') },
      { id: 'payment', label: t('checkout.payment') },
      { id: 'order', label: t('checkout.order') },
    ],
    [t],
  );

  const orderSummary = (
    <OrderSummary
      subtotal={subtotal}
      shipping={summaryAmounts.shipping}
      voucherDiscount={summaryAmounts.voucherDiscount}
      total={summaryAmounts.total}
      formatPrice={formatPrice}
      shippingLoading={!isShippingDisabled && (shippingLoading || shippingPolicyLoading)}
      showShipping={!isShippingDisabled}
    />
  );

  const isOrderStep = currentStep === 'order';

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: () => navigation.goBack() }}
      contentContainerStyle={[styles.container, isOrderStep && styles.contentFloatingMenuReserve]}
      contentBackgroundColor='transparent'
    >
      <View pointerEvents='none' style={styles.backgroundLayer}>
        <GradientBackground />
      </View>
      <KeyboardAvoidingView
        style={styles.scrollView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isOrderStep && styles.scrollContentOrderStep]}
          keyboardShouldPersistTaps='handled'
        >
          <View style={isOrderStep ? styles.orderStepStepperPadding : undefined}>
            <Stepper
              steps={stepperSteps}
              currentStepId={currentStep}
              onStepPress={(stepId) => setCurrentStep(stepId as CheckoutStep)}
            />
          </View>

          {ownedProtocolCheckoutBlocked ? (
            <Text style={styles.protocolBlockedMessage}>{t('marketplace.programAlreadySubscribed')}</Text>
          ) : null}

          {currentStep === 'address' && (
            <>
              <AddressForm
                addressData={addressData}
                onSaveAddress={handleSaveAddress}
                startWithEditOpen={addressLoaded && !addressData.addressLine1?.trim()}
                addressLoadError={addressLoadError}
                addressSaveError={addressSaveError}
              />

              <Text style={styles.deliveriesTitle}>{t('checkout.yourDeliveries')}</Text>
              <View style={styles.cartItemsList} testID='cart-items-list'>
                {cartItems.map((item) => {
                  const isProgram = isProtocolCartItem(item);
                  return (
                    <ProductRowCard
                      key={item.id}
                      image={item.image}
                      title={item.title}
                      price={item.price}
                      onPress={noop}
                      badges={catalogTypeTranslatedBadgeLabels(item.type, t)}
                      subtitle={
                        item.subtitle
                          ? item.date
                            ? `${item.subtitle} · ${t('cart.date')}: ${item.date}`
                            : item.subtitle
                          : item.date
                          ? `${t('cart.date')}: ${item.date}`
                          : undefined
                      }
                      quantity={item.quantity}
                      showDelete={true}
                      onRemove={() => removeItem(item.id)}
                      onIncreaseQuantity={isProgram ? undefined : () => increaseQuantity(item.id)}
                      onDecreaseQuantity={isProgram ? undefined : () => decreaseQuantity(item.id)}
                    />
                  );
                })}
              </View>

              <CheckoutVoucherSection
                couponCode={checkoutVoucher.couponCode}
                couponError={checkoutVoucher.couponError}
                appliedCouponCode={checkoutVoucher.appliedPreview?.code ?? null}
                couponApplying={checkoutVoucher.isValidating}
                applyDisabled={isShippingBlocking}
                onCouponCodeChange={checkoutVoucher.onCouponCodeChange}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={checkoutVoucher.removeCoupon}
              />

              {orderSummary}
            </>
          )}

          {currentStep === 'payment' && (
            <>
              <PaymentForm
                cardholderName={payment.cardholderName}
                cardNumber={payment.cardNumber}
                expiryDate={payment.expiryDate}
                cvv={payment.cvv}
                cpf={payment.cpf}
                paymentFieldErrors={payment.paymentFieldErrors}
                billingAddressData={billingAddressData}
                deliverySameAsBilling={deliverySameAsBilling}
                onCardholderNameChange={payment.onCardholderNameChange}
                onCardNumberChange={payment.onCardNumberChange}
                onExpiryDateChange={payment.onExpiryDateChange}
                onCvvChange={payment.onCvvChange}
                onCpfChange={payment.onCpfChange}
                onSaveBillingAddress={handleSaveBillingAddress}
                onDeliverySameAsBillingChange={handleDeliverySameAsBillingChange}
              />

              <CheckoutVoucherSection
                couponCode={checkoutVoucher.couponCode}
                couponError={checkoutVoucher.couponError}
                appliedCouponCode={checkoutVoucher.appliedPreview?.code ?? null}
                couponApplying={checkoutVoucher.isValidating}
                applyDisabled={isShippingBlocking}
                onCouponCodeChange={checkoutVoucher.onCouponCodeChange}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={checkoutVoucher.removeCoupon}
              />

              {orderSummary}
            </>
          )}

          {currentStep === 'order' && (
            <OrderScreen status={orderCompletionStatus} onViewOrdersPress={handleViewOrdersPress} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {currentStep !== 'order' && (
        <View style={styles.buttonContainer}>
          <SecondaryButton
            testID='button-continue'
            label={t('common.continue')}
            onPress={handleContinue}
            size='large'
            loading={isContinueLoading}
            disabled={isContinueDisabled}
          />
        </View>
      )}
    </ScreenWithHeader>
  );
};

export default CheckoutScreen;
