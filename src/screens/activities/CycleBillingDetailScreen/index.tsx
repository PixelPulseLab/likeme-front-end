import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ScreenWithHeader } from '@/components/ui/layout';
import { SecondaryButton } from '@/components/ui/buttons';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { formatPrice } from '@/utils';
import { formatOrderDisplayId } from '@/utils/marketplace/orderDisplayId';
import { formatSubscriptionManageDate } from '@/utils/subscription/subscriptionManageDisplay';
import {
  cycleBillingCardLabel,
  cycleBillingKindLabel,
  cycleBillingStatusPresentation,
} from '@/utils/payment/cycleBillingHistoryDisplay';
import type { RootStackParamList } from '@/types/navigation';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'CycleBillingDetail'>;

const CycleBillingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'CycleBillingDetail', screenClass: 'CycleBillingDetailScreen' });
  const { t } = useTranslation();
  const cycleBilling = route.params?.cycleBilling;
  const kindLabel = cycleBilling ? cycleBillingKindLabel(cycleBilling.billingType) : null;
  const statusPresentation = cycleBilling ? cycleBillingStatusPresentation(cycleBilling.status) : null;
  const cardLabel = cycleBilling ? cycleBillingCardLabel(cycleBilling) : null;
  const amountLabel = cycleBilling ? formatPrice(cycleBilling.amountCents / 100) : '';

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ onBackPress: () => navigation.goBack() }}
      contentContainerStyle={styles.container}
    >
      {!cycleBilling || !kindLabel || !statusPresentation ? (
        <View style={styles.footer}>
          <SecondaryButton label={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>{t(kindLabel.labelKey, { defaultValue: kindLabel.labelDefault })}</Text>
              <View style={styles.titleUnderline} />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t('activities.orderNumber', { defaultValue: 'Número do pedido' })}
              </Text>
              <Text style={styles.summaryValue}>{formatOrderDisplayId(cycleBilling.id)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t('activities.cycleBillingProgram', { defaultValue: 'Programa' })}
              </Text>
              <Text style={styles.summaryValue}>{cycleBilling.productName}</Text>
            </View>
            {cycleBilling.cycleNumber != null ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('activities.cycleBillingCycle', { defaultValue: 'Ciclo' })}</Text>
                <Text style={styles.summaryValue}>{String(cycleBilling.cycleNumber)}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t('activities.subscriptionLifecycleDate', { defaultValue: 'Data' })}
              </Text>
              <Text style={styles.summaryValue}>{formatSubscriptionManageDate(cycleBilling.occurredAt)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.total')}</Text>
              <Text style={styles.summaryValue}>{amountLabel}</Text>
            </View>
            {cycleBilling.installments != null ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t('activities.cycleBillingInstallments', { defaultValue: 'Parcelas' })}
                </Text>
                <Text style={styles.summaryValue}>{`${cycleBilling.installments}x`}</Text>
              </View>
            ) : null}
            {cardLabel ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('activities.cycleBillingCard', { defaultValue: 'Cartão' })}</Text>
                <Text style={styles.summaryValue}>{cardLabel}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('activities.cycleBillingStatus', { defaultValue: 'Status' })}</Text>
              <Text style={styles.summaryValue}>
                {t(statusPresentation.deliveryLabelKey, { defaultValue: statusPresentation.deliveryLabelDefault })}
              </Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <SecondaryButton label={t('common.back')} onPress={() => navigation.goBack()} size='large' />
          </View>
        </>
      )}
    </ScreenWithHeader>
  );
};

export default CycleBillingDetailScreen;
