import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import {
  SUBSCRIPTION_CANCEL_REASON_OPTIONS,
  SUBSCRIPTION_CANCEL_REASON_UNSPECIFIED,
  type SubscriptionCancelReason,
} from '@/constants/subscription/subscriptionCancelReason';
import { subscriptionService } from '@/services/payment/subscriptionService';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS, SPACING } from '@/constants';
import { logger } from '@/utils/logger';
import { formatSubscriptionManageDate } from '@/utils/subscription/subscriptionManageDisplay';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'CancelProtocolSubscription'>;

const CancelProtocolSubscriptionScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({
    screenName: 'CancelProtocolSubscription',
    screenClass: 'CancelProtocolSubscriptionScreen',
  });
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { subscriptionId, programName, lastBillingAt, accessValidUntil } = route.params;

  const [selectedReason, setSelectedReason] = useState<SubscriptionCancelReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const accessUntilLabel = formatSubscriptionManageDate(accessValidUntil);

  const consequenceItems = useMemo(
    () => [
      {
        positive: true,
        text: t('profile.subscriptionCancel.consequenceKeepAccess', {
          defaultValue: `Você continua com acesso completo até ${accessUntilLabel}`,
          date: accessUntilLabel,
        }),
      },
      {
        positive: true,
        text: t('profile.subscriptionCancel.consequenceNoCharges', {
          defaultValue: 'Nenhuma nova cobrança será realizada',
        }),
      },
      {
        positive: false,
        text: t('profile.subscriptionCancel.consequenceLoseAccess', {
          defaultValue: `Após ${accessUntilLabel} seu acesso ao protocolo será removido`,
          date: accessUntilLabel,
        }),
      },
      {
        positive: false,
        text: t('profile.subscriptionCancel.consequenceLoseSessions', {
          defaultValue: 'Você não terá mais acesso as sessões e ao material de apoio.',
        }),
      },
    ],
    [accessUntilLabel, t],
  );

  const handleKeepPlan = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirmCancel = useCallback(async () => {
    const selectedOption = SUBSCRIPTION_CANCEL_REASON_OPTIONS.find((option) => option.id === selectedReason);
    const reasonText = selectedOption
      ? t(selectedOption.labelKey, { defaultValue: selectedOption.labelDefault })
      : SUBSCRIPTION_CANCEL_REASON_UNSPECIFIED;

    setSubmitting(true);
    try {
      const response = await subscriptionService.scheduleSubscriptionCancel(subscriptionId, reasonText);
      if (!response.success || !response.data) {
        throw new Error(
          t('profile.subscriptionCancel.submitError', {
            defaultValue: 'Não foi possível cancelar a assinatura. Tente novamente.',
          }),
        );
      }
      navigation.replace('CancelProtocolSubscriptionConfirm', {
        programName,
        accessValidUntil: response.data.accessValidUntil,
      });
    } catch (error) {
      logger.error('[CancelProtocolSubscription] Falha ao agendar cancelamento', {
        subscriptionId,
        cause: error,
      });
      const message =
        error instanceof Error
          ? error.message
          : t('profile.subscriptionCancel.submitError', {
              defaultValue: 'Não foi possível cancelar a assinatura. Tente novamente.',
            });
      Alert.alert(t('common.error', { defaultValue: 'Erro' }), message);
    } finally {
      setSubmitting(false);
    }
  }, [navigation, programName, selectedReason, subscriptionId, t]);

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
      <GradientBackground colors={['#958AAA', '#D8E4D6', '#F4F3EC']} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SPACING.XXL + Math.max(insets.bottom, SPACING.MD) },
        ]}
      >
        <Text style={styles.title}>
          {t('profile.subscriptionCancel.title', { defaultValue: 'Cancelar o programa' })}
        </Text>

        <View style={styles.reasonSection}>
          <View style={styles.reasonTitleRow}>
            <Text style={styles.reasonTitle}>
              {t('profile.subscriptionCancel.reasonSurveyTitle', {
                defaultValue: 'Por que está cancelando?',
              })}
            </Text>
            <Text style={styles.reasonOptional}>
              {t('profile.subscriptionCancel.reasonSurveyOptional', { defaultValue: '(opcional)' })}
            </Text>
          </View>
          <View style={styles.reasonList}>
            {SUBSCRIPTION_CANCEL_REASON_OPTIONS.map((option) => {
              const selected = selectedReason === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                  onPress={() => setSelectedReason(selected ? null : option.id)}
                  activeOpacity={0.7}
                  accessibilityRole='radio'
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.reasonRadio, selected && styles.reasonRadioSelected]}>
                    {selected ? <View style={styles.reasonRadioInner} /> : null}
                  </View>
                  <Text style={styles.reasonLabel}>{t(option.labelKey, { defaultValue: option.labelDefault })}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('profile.subscriptionCancel.consequencesTitle', {
              defaultValue: 'O que acontece após o cancelamento:',
            })}
          </Text>
          <View style={styles.consequenceList}>
            {consequenceItems.map((item, index) => (
              <React.Fragment key={item.text}>
                <View style={styles.consequenceRow}>
                  <Icon
                    name={item.positive ? 'check-circle' : 'cancel'}
                    size={24}
                    color={item.positive ? '#29CC6A' : COLORS.ERROR}
                  />
                  <Text style={styles.consequenceText}>{item.text}</Text>
                </View>
                {index < consequenceItems.length - 1 ? <View style={styles.separator} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldList}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t('profile.subscriptionManage.lastBillingAt', {
                  defaultValue: 'Última cobrança realizada',
                })}
              </Text>
              <Text style={styles.fieldValue}>{formatSubscriptionManageDate(lastBillingAt)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t('profile.subscriptionCancel.accessUntil', { defaultValue: 'Acesso disponível até' })}
              </Text>
              <Text style={styles.fieldValue}>{accessUntilLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton
            label={t('profile.subscriptionCancel.keepPlanButton', { defaultValue: 'Manter o plano' })}
            onPress={handleKeepPlan}
            size='large'
            style={styles.actionPrimary}
            disabled={submitting}
          />
          <SecondaryButton
            label={t('profile.subscriptionCancel.confirmCancelButton', {
              defaultValue: 'Cancelar mesmo assim',
            })}
            onPress={() => void handleConfirmCancel()}
            size='large'
            style={styles.actionSecondary}
            disabled={submitting}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default CancelProtocolSubscriptionScreen;
