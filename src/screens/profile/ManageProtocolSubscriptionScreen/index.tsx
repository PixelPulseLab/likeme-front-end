import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWithHeader } from '@/components/ui/layout';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import Badge from '@/components/ui/badge';
import { useTranslation } from '@/hooks/i18n';
import { usePayment } from '@/hooks/marketplace/usePayment';
import { useAnalyticsScreen } from '@/analytics';
import { DEFAULT_SUBSCRIPTION_BENEFIT_KEYS } from '@/constants/subscription/subscriptionCancelReason';
import { subscriptionService, type SubscriptionManageResult } from '@/services/payment/subscriptionService';
import type { RootStackParamList } from '@/types/navigation';
import { BOTTOM_DOCK_BAR_HEIGHT, COLORS, SPACING } from '@/constants';
import { formatBillingAddress } from '@/utils/formatters/addressFormatter';
import { logger } from '@/utils/logger';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';
import {
  formatSubscriptionManageDate,
  formatSubscriptionManagePrice,
  subscriptionAccessUntilIso,
  subscriptionIsCancelingPresentation,
  subscriptionIsCanceledPresentation,
  subscriptionManageStatusLabel,
} from '@/utils/subscription/subscriptionManageDisplay';
import PaymentForm from '@/screens/marketplace/CheckoutScreen/payment/PaymentForm';
import {
  EMPTY_ADDRESS,
  isAddressFilled,
  type AddressData,
} from '@/screens/marketplace/CheckoutScreen/address/AddressForm';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'ManageProtocolSubscription'>;

const ManageProtocolSubscriptionScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({
    screenName: 'ManageProtocolSubscription',
    screenClass: 'ManageProtocolSubscriptionScreen',
  });
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { subscriptionId, programName, focusUpdatePayment } = route.params;
  const payment = usePayment();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsetY = useRef(0);
  const updatePaymentSectionY = useRef(0);

  const [manage, setManage] = useState<SubscriptionManageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showUpdatePayment, setShowUpdatePayment] = useState(Boolean(focusUpdatePayment));
  const [billingAddressData, setBillingAddressData] = useState<AddressData>(EMPTY_ADDRESS);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const loadManage = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await subscriptionService.getManageSubscription(subscriptionId);
      if (!response.success || !response.data) {
        setManage(null);
        setLoadError(true);
        return;
      }
      setManage(response.data);
    } catch (error) {
      logger.error('[ManageProtocolSubscription] Falha ao carregar gestão', {
        subscriptionId,
        cause: error,
      });
      setManage(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    void loadManage();
  }, [loadManage]);

  useEffect(() => {
    if (focusUpdatePayment && manage?.canUpdatePaymentMethod) {
      setShowUpdatePayment(true);
    }
  }, [focusUpdatePayment, manage?.canUpdatePaymentMethod]);

  useEffect(() => {
    if (!showUpdatePayment || loading || !manage?.canUpdatePaymentMethod) {
      return;
    }
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(updatePaymentSectionY.current - SPACING.MD, 0), animated: true });
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [showUpdatePayment, loading, manage?.canUpdatePaymentMethod]);

  const handleCancelPress = useCallback(() => {
    if (!manage?.canCancel) {
      Alert.alert(
        t('profile.subscriptionManage.cancelUnavailableTitle', { defaultValue: 'Cancelamento indisponível' }),
        t('profile.subscriptionManage.cancelUnavailableMessage', {
          defaultValue: 'Esta assinatura não pode ser cancelada no momento.',
        }),
      );
      return;
    }
    navigation.navigate('CancelProtocolSubscription', {
      subscriptionId,
      programName: programName || t('profile.subscriptionManage.programFallback', { defaultValue: 'Programa' }),
      lastBillingAt: manage.lastBillingAt,
      accessValidUntil: manage.accessValidUntil,
      nextBillingAt: manage.nextBillingAt,
    });
  }, [manage, navigation, programName, subscriptionId, t]);

  const handleReactivatePress = useCallback(async () => {
    if (!manage) {
      return;
    }

    const isFullyCanceled = subscriptionIsCanceledPresentation({
      status: manage.status,
      cancelAtPeriodEnd: manage.cancelAtPeriodEnd,
    });

    if (isFullyCanceled) {
      navigateToProductDetailsScreen(navigation, { productId: manage.productId });
      return;
    }

    if (!manage.canReactivate) {
      return;
    }
    setReactivating(true);
    try {
      const response = await subscriptionService.reactivateSubscription(subscriptionId);
      if (!response.success) {
        throw new Error(
          t('profile.subscriptionManage.reactivateError', {
            defaultValue: 'Não foi possível reativar a assinatura. Tente novamente.',
          }),
        );
      }
      await loadManage();
    } catch (error) {
      logger.error('[ManageProtocolSubscription] Falha ao reativar assinatura', {
        subscriptionId,
        cause: error,
      });
      const message =
        error instanceof Error
          ? error.message
          : t('profile.subscriptionManage.reactivateError', {
              defaultValue: 'Não foi possível reativar a assinatura. Tente novamente.',
            });
      Alert.alert(t('common.error', { defaultValue: 'Erro' }), message);
    } finally {
      setReactivating(false);
    }
  }, [loadManage, manage, navigation, subscriptionId, t]);

  const handleUpdatePaymentPress = useCallback(() => {
    setShowUpdatePayment(true);
  }, []);

  const handleSubmitUpdatePayment = useCallback(async () => {
    const fieldErrors = payment.validatePaymentFields((key) => t(key));
    if (fieldErrors) {
      payment.setPaymentFieldErrors(fieldErrors);
      return;
    }
    if (!isAddressFilled(billingAddressData)) {
      Alert.alert(
        t('common.error', { defaultValue: 'Erro' }),
        t('profile.subscriptionManage.updatePaymentAddressRequired', {
          defaultValue: 'Preencha o endereço de cobrança para continuar.',
        }),
      );
      return;
    }

    const cardDataObj = payment.getCardData();
    if (!cardDataObj) {
      Alert.alert(
        t('common.error', { defaultValue: 'Erro' }),
        t('profile.subscriptionManage.updatePaymentCardInvalid', {
          defaultValue: 'Verifique os dados do cartão e tente novamente.',
        }),
      );
      return;
    }

    const phoneDigits = billingAddressData.phone.replace(/\D/g, '');
    const phone = phoneDigits.length >= 10 ? phoneDigits : undefined;

    setUpdatingPayment(true);
    try {
      const response = await subscriptionService.updateSubscriptionPaymentMethod(subscriptionId, {
        cardData: {
          ...cardDataObj,
          ...(phone ? { phone } : {}),
        },
        billingAddress: formatBillingAddress(billingAddressData),
      });
      if (!response.success) {
        throw new Error(
          t('profile.subscriptionManage.updatePaymentError', {
            defaultValue: 'Não foi possível atualizar a forma de pagamento. Tente novamente.',
          }),
        );
      }
      Alert.alert(
        t('profile.subscriptionManage.updatePaymentSuccessTitle', { defaultValue: 'Cartão atualizado' }),
        t('profile.subscriptionManage.updatePaymentSuccessMessage', {
          defaultValue: 'Sua forma de pagamento foi atualizada. Vamos tentar a cobrança novamente.',
        }),
      );
      setShowUpdatePayment(false);
      setBillingAddressData(EMPTY_ADDRESS);
      await loadManage();
    } catch (error) {
      logger.error('[ManageProtocolSubscription] Falha ao atualizar forma de pagamento', {
        subscriptionId,
        cause: error,
      });
      const message =
        error instanceof Error
          ? error.message
          : t('profile.subscriptionManage.updatePaymentError', {
              defaultValue: 'Não foi possível atualizar a forma de pagamento. Tente novamente.',
            });
      Alert.alert(t('common.error', { defaultValue: 'Erro' }), message);
    } finally {
      setUpdatingPayment(false);
    }
  }, [billingAddressData, loadManage, payment, subscriptionId, t]);

  const statusPresentation = manage ? subscriptionManageStatusLabel(manage.status, manage.cancelAtPeriodEnd) : null;

  const isCancelingPresentation = manage
    ? subscriptionIsCancelingPresentation({
        status: manage.status,
        cancelAtPeriodEnd: manage.cancelAtPeriodEnd,
      })
    : false;

  const isCanceledPresentation = manage
    ? subscriptionIsCanceledPresentation({
        status: manage.status,
        cancelAtPeriodEnd: manage.cancelAtPeriodEnd,
      })
    : false;

  const showReducedSubscriptionFields = isCancelingPresentation || isCanceledPresentation;
  const showRepurchaseReactivate = isCanceledPresentation;
  const canShowUpdatePayment = Boolean(manage?.canUpdatePaymentMethod);

  const benefits =
    manage?.benefits && manage.benefits.length > 0
      ? manage.benefits
      : DEFAULT_SUBSCRIPTION_BENEFIT_KEYS.map((item) => t(item.key, { defaultValue: item.defaultValue }));

  const reactivateDeadline = formatSubscriptionManageDate(
    subscriptionAccessUntilIso(manage?.accessValidUntil, manage?.nextBillingAt),
  );
  const scrollBottomPadding = BOTTOM_DOCK_BAR_HEIGHT + Math.max(insets.bottom, SPACING.MD) + SPACING.MD;

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: () => navigation.goBack(),
        backgroundColor: COLORS.SECONDARY.LIGHT,
      }}
      contentBackgroundColor={COLORS.BACKGROUND}
      contentContainerStyle={styles.container}
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.TEXT} />
        </View>
      ) : loadError || !manage ? (
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>
            {t('profile.subscriptionManage.loadError', {
              defaultValue: 'Não foi possível carregar os dados da assinatura.',
            })}
          </Text>
          <SecondaryButton
            label={t('common.retry', { defaultValue: 'Tentar novamente' })}
            onPress={() => void loadManage()}
            size='large'
            style={{ marginTop: SPACING.MD, alignSelf: 'stretch', marginHorizontal: SPACING.MD }}
          />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
          keyboardShouldPersistTaps='handled'
        >
          <Text style={styles.title}>
            {t('profile.subscriptionManage.title', { defaultValue: 'Sobre o programa' })}
          </Text>
          <View
            style={styles.section}
            onLayout={(event) => {
              sectionOffsetY.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t('profile.subscriptionManage.mySubscription', { defaultValue: 'Minha assinatura' })}
              </Text>
              {showReducedSubscriptionFields ? (
                <View style={styles.fieldList}>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.lastBillingAt', {
                        defaultValue: 'Última cobrança realizada',
                      })}
                    </Text>
                    <Text style={styles.fieldValue}>{formatSubscriptionManageDate(manage.lastBillingAt)}</Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.accessEndsAt', { defaultValue: 'Acesso encerra em' })}
                    </Text>
                    <Text style={styles.fieldValue}>
                      {formatSubscriptionManageDate(
                        subscriptionAccessUntilIso(manage.accessValidUntil, manage.nextBillingAt),
                      )}
                    </Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.status', { defaultValue: 'Status' })}
                    </Text>
                    {statusPresentation ? (
                      <Badge label={statusPresentation.label} color={statusPresentation.badgeColor} />
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={styles.fieldList}>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.startedAt', { defaultValue: 'Início da assinatura' })}
                    </Text>
                    <Text style={styles.fieldValue}>{formatSubscriptionManageDate(manage.startedAt)}</Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.lastBillingAt', {
                        defaultValue: 'Última cobrança realizada',
                      })}
                    </Text>
                    <Text style={styles.fieldValue}>{formatSubscriptionManageDate(manage.lastBillingAt)}</Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.nextBillingAt', { defaultValue: 'Próxima cobrança' })}
                    </Text>
                    <Text style={styles.fieldValue}>{formatSubscriptionManageDate(manage.nextBillingAt)}</Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.price', { defaultValue: 'Valor' })}
                    </Text>
                    <Text style={styles.fieldValue}>
                      {formatSubscriptionManagePrice(manage.priceCents, manage.billingPeriod)}
                    </Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      {t('profile.subscriptionManage.status', { defaultValue: 'Status' })}
                    </Text>
                    {statusPresentation ? (
                      <Badge label={statusPresentation.label} color={statusPresentation.badgeColor} />
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            {!showReducedSubscriptionFields ? (
              <View style={[styles.card, styles.benefitsCard]}>
                <Text style={styles.cardTitle}>
                  {t('profile.subscriptionManage.includedTitle', {
                    defaultValue: 'Incluso na sua assinatura:',
                  })}
                </Text>
                <View style={styles.benefitList}>
                  {benefits.map((benefit) => (
                    <View key={benefit} style={styles.benefitRow}>
                      <Text style={styles.benefitBullet}>{'\u2022'}</Text>
                      <Text style={styles.benefitItem}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {canShowUpdatePayment ? (
              <View
                style={styles.actions}
                onLayout={(event) => {
                  updatePaymentSectionY.current = sectionOffsetY.current + event.nativeEvent.layout.y;
                }}
              >
                {!showUpdatePayment ? (
                  <PrimaryButton
                    label={t('profile.subscriptionManage.updatePaymentButton', {
                      defaultValue: 'Atualizar forma de pagamento',
                    })}
                    onPress={handleUpdatePaymentPress}
                    size='large'
                  />
                ) : (
                  <View style={styles.updatePaymentCard}>
                    <Text style={styles.cardTitle}>
                      {t('profile.subscriptionManage.updatePaymentTitle', {
                        defaultValue: 'Atualizar forma de pagamento',
                      })}
                    </Text>
                    <Text style={styles.updatePaymentHint}>
                      {t('profile.subscriptionManage.updatePaymentHint', {
                        defaultValue: 'Informe um novo cartão e o endereço de cobrança para restabelecer a assinatura.',
                      })}
                    </Text>
                    <PaymentForm
                      cardholderName={payment.cardholderName}
                      cardNumber={payment.cardNumber}
                      expiryDate={payment.expiryDate}
                      cvv={payment.cvv}
                      cpf={payment.cpf}
                      paymentFieldErrors={payment.paymentFieldErrors}
                      billingAddressData={billingAddressData}
                      onCardholderNameChange={payment.onCardholderNameChange}
                      onCardNumberChange={payment.onCardNumberChange}
                      onExpiryDateChange={payment.onExpiryDateChange}
                      onCvvChange={payment.onCvvChange}
                      onCpfChange={payment.onCpfChange}
                      onSaveBillingAddress={setBillingAddressData}
                    />
                    <PrimaryButton
                      label={t('profile.subscriptionManage.updatePaymentSubmit', {
                        defaultValue: 'Salvar novo cartão',
                      })}
                      onPress={() => void handleSubmitUpdatePayment()}
                      size='large'
                      loading={updatingPayment}
                      disabled={updatingPayment}
                    />
                  </View>
                )}
              </View>
            ) : null}

            {manage.canCancel ? (
              <View style={styles.actions}>
                <SecondaryButton
                  label={t('profile.subscriptionManage.cancelButton', {
                    defaultValue: 'Cancelar assinatura',
                  })}
                  onPress={handleCancelPress}
                  size='large'
                  style={styles.cancelButton}
                />
              </View>
            ) : null}

            {manage.canReactivate || showRepurchaseReactivate ? (
              <View style={styles.actions}>
                <PrimaryButton
                  label={t('profile.subscriptionManage.reactivateButton', {
                    defaultValue: 'Reativar assinatura',
                  })}
                  onPress={() => void handleReactivatePress()}
                  size='large'
                  loading={reactivating}
                  disabled={reactivating}
                />
                {manage.canReactivate ? (
                  <Text style={styles.reactivateHint}>
                    {t('profile.subscriptionManage.reactivateHint', {
                      defaultValue: `Mudou de ideia? Reative antes de ${reactivateDeadline}.`,
                      date: reactivateDeadline,
                    })}
                  </Text>
                ) : (
                  <Text style={styles.reactivateHint}>
                    {t('profile.subscriptionManage.repurchaseHint', {
                      defaultValue: 'Para voltar a ter acesso, adquira o protocolo novamente.',
                    })}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </ScreenWithHeader>
  );
};

export default ManageProtocolSubscriptionScreen;
