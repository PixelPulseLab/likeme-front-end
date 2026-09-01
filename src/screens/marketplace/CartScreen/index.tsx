import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, FlatList, type ListRenderItem, TouchableOpacity, TextInput, Linking } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import type { RootStackParamList } from '@/types/navigation';
import { formatPrice } from '@/utils';
import { navigateToMarketplace } from '@/utils/navigation/marketplaceNavigation';
import { catalogTypeTranslatedBadgeLabels } from '@/types/product';
import { isProtocolCartItem } from '@/utils/profile/protocolProduct';
import { Alert } from 'react-native';
import { SecondaryButton } from '@/components/ui/buttons';
import { ProductRowCard } from '@/components/ui/cards';
import { useMenuItems, useTranslation, useCart, useFormattedInput, useCartShippingPolicy } from '@/hooks';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { useAnalyticsScreen } from '@/analytics';
import { isValidZipCodeFormat, formatZipCodeDisplay } from '@/services/address/cepService';
import { getShippingQuote } from '@/services/shipping/shippingService';
import { styles } from './styles';
import type { CartItem } from '@/types/cart';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';

type CartScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Cart'>;
  route?: any;
};

const CORREIOS_CEP_URL = 'https://buscacepinter.correios.com.br/app/endereco/index.php';

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Cart', screenClass: 'CartScreen' });
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'marketplace');
  const { cartItems, loading, loadAndValidateCartItems, increaseQuantity, decreaseQuantity, removeItem, subtotal } =
    useCart();

  const [zipCode, setZipCode] = useState('');
  const [shipping, setShipping] = useState(0.0);
  const [shippingLoading, setShippingLoading] = useState(false);

  const { shippingRequired, isResolving: shippingPolicyLoading } = useCartShippingPolicy(cartItems);
  const effectiveShipping = shippingRequired === false ? 0 : shipping;
  const productIds = useMemo(() => cartItems.map((item) => item.id).filter(Boolean), [cartItems]);

  const handleZipCodeChange = useFormattedInput({ type: 'zipCode', onChangeText: setZipCode });

  const loadCartRef = useRef(() => {
    loadAndValidateCartItems((removedNames) => {
      if (removedNames.length > 0) {
        Alert.alert(t('cart.cartUpdated'), `${t('cart.productsRemoved')}\n\n${removedNames.join('\n')}`);
      }
    });
  });
  loadCartRef.current = () => {
    loadAndValidateCartItems((removedNames) => {
      if (removedNames.length > 0) {
        Alert.alert(t('cart.cartUpdated'), `${t('cart.productsRemoved')}\n\n${removedNames.join('\n')}`);
      }
    });
  };

  useEffect(() => {
    loadCartRef.current();

    const unsubscribe = navigation.addListener('focus', () => {
      loadCartRef.current();
    });

    return unsubscribe;
  }, [navigation]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleApplyShipping = async () => {
    const trimmed = zipCode.trim();
    if (!trimmed) {
      Alert.alert(t('errors.error'), t('cart.invalidZipCode'));
      return;
    }
    if (!isValidZipCodeFormat(trimmed)) {
      Alert.alert(t('errors.error'), t('cart.invalidZipCode'));
      return;
    }
    setShippingLoading(true);
    try {
      const result = await getShippingQuote(trimmed, productIds);
      setZipCode(formatZipCodeDisplay(trimmed));
      setShipping(result.minValue);
    } catch (err: any) {
      const status = err?.status;
      const isUnavailable = status === 502 || status === 504 || status === 503;
      const message = isUnavailable ? t('cart.shippingUnavailable') : err?.message || t('cart.invalidZipCode');
      Alert.alert(t('errors.error'), message);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleBuy = () => {
    const zipParam =
      shippingRequired !== false && zipCode.trim().replace(/\D/g, '').length === 8
        ? { zipCode: formatZipCodeDisplay(zipCode.trim()) }
        : undefined;
    navigation.navigate('Checkout', zipParam);
  };

  const calculateTotal = () => subtotal + effectiveShipping;

  const noop = useCallback((): void => undefined, []);

  const renderCartItem = useCallback<ListRenderItem<CartItem>>(
    ({ item }) => {
      const isProgram = isProtocolCartItem(item);
      return (
        <View style={styles.cartItemWrapper}>
          <ProductRowCard
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
            deleteButtonTestID={`delete-item-${item.id}`}
            increaseQuantityTestID={`increase-quantity-${item.id}`}
            decreaseQuantityTestID={`decrease-quantity-${item.id}`}
          />
        </View>
      );
    },
    [t, noop, removeItem, increaseQuantity, decreaseQuantity],
  );

  const cartItemKeyExtractor = useCallback((item: CartItem) => item.id, []);
  const renderBackground = () => (
    <View pointerEvents='none' style={styles.backgroundLayer}>
      <GradientBackground />
    </View>
  );

  const renderWarningBanner = () => (
    <View style={styles.warningBanner}>
      <Text style={styles.warningText}>{t('cart.warningMessage')}</Text>
    </View>
  );

  const renderShippingSection = () => (
    <View style={styles.shippingSection}>
      <Text style={styles.shippingTitle}>{t('cart.calculateShipping')}</Text>
      <View style={styles.shippingInputRow}>
        <TextInput
          style={styles.zipCodeInput}
          value={zipCode}
          onChangeText={handleZipCodeChange}
          placeholder={t('cart.zipCodePlaceholder')}
          placeholderTextColor='#6e6a6a'
          keyboardType='numeric'
        />
        <TouchableOpacity
          style={[styles.applyButton, shippingLoading && { opacity: 0.6 }]}
          onPress={handleApplyShipping}
          activeOpacity={0.8}
          disabled={shippingLoading}
        >
          <Text style={styles.applyButtonText}>{shippingLoading ? t('common.loading') : t('common.apply')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.dontKnowZipButton}
        activeOpacity={0.7}
        onPress={() =>
          Linking.openURL(CORREIOS_CEP_URL).catch(() =>
            Alert.alert(t('errors.error'), t('cart.dontKnowZipCodeOpenError')),
          )
        }
      >
        <Text style={styles.dontKnowZipText}>{t('cart.dontKnowZipCode')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrderSummary = () => {
    const total = calculateTotal();

    return (
      <View style={styles.orderSummary}>
        <View style={styles.separator} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('cart.subtotal')}</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        {shippingRequired !== false && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('cart.shipping')}</Text>
            <Text style={styles.summaryValue}>
              {shippingPolicyLoading ? t('common.loading') : formatPrice(effectiveShipping)}
            </Text>
          </View>
        )}
        <View style={styles.separator} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.total')}</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>
    );
  };

  const hasItems = cartItems.length > 0;

  const listHeader = (
    <>
      <Text style={styles.screenTitle}>{t('cart.screenTitle')}</Text>
      {renderWarningBanner()}
      {hasItems ? <Text style={styles.productsTitle}>{t('cart.yourProducts')}</Text> : null}
    </>
  );

  const listFooter = hasItems ? (
    <>
      {shippingRequired !== false && renderShippingSection()}
      {renderOrderSummary()}
      <View style={styles.buyButtonContainer}>
        <SecondaryButton
          label={t('cart.finalizePurchase')}
          onPress={handleBuy}
          style={styles.buyButton}
          size='large'
          testID={E2E_TEST_IDS.CART_CHECKOUT}
        />
      </View>
    </>
  ) : null;

  const listEmpty = loading ? (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{t('cart.loadingCart')}</Text>
    </View>
  ) : (
    <View style={styles.emptyCartContainer}>
      <Text style={styles.emptyCartText}>{t('cart.emptyCart')}</Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => navigateToMarketplace(navigation)} activeOpacity={0.8}>
        <Text style={styles.shopButtonText}>{t('cart.startShopping')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBackPress,
        showCartButton: false,
        showMenuWithAvatar: false,
      }}
      contentContainerStyle={[styles.container, styles.contentFloatingMenuReserve]}
      contentBackgroundColor='transparent'
    >
      {renderBackground()}
      <FlatList
        testID={E2E_TEST_IDS.CART_SCREEN}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        data={cartItems}
        keyExtractor={cartItemKeyExtractor}
        renderItem={renderCartItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />
    </ScreenWithHeader>
  );
};

export default CartScreen;
