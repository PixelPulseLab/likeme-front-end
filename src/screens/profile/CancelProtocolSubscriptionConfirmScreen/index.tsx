import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { PrimaryButton } from '@/components/ui/buttons';
import Badge from '@/components/ui/badge';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS, SPACING } from '@/constants';
import { formatSubscriptionManageDate } from '@/utils/subscription/subscriptionManageDisplay';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'CancelProtocolSubscriptionConfirm'>;

const CancelProtocolSubscriptionConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({
    screenName: 'CancelProtocolSubscriptionConfirm',
    screenClass: 'CancelProtocolSubscriptionConfirmScreen',
  });
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { programName, accessValidUntil } = route.params;
  const accessUntilLabel = formatSubscriptionManageDate(accessValidUntil);

  const handleBackToList = useCallback(() => {
    navigation.navigate('SubscriptionList');
  }, [navigation]);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBackToList,
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
        <View style={styles.hero}>
          <Icon name='check-circle' size={68} color={COLORS.TEXT} />
          <Text style={styles.heroTitle}>
            {t('profile.subscriptionCancelConfirm.title', { defaultValue: 'Assinatura cancelada' })}
          </Text>
          <Text style={styles.heroDescription}>
            {t('profile.subscriptionCancelConfirm.description', {
              defaultValue:
                'Sua solicitação foi registrada com sucesso. Você vai receber um e-mail de confirmação em instantes.',
            })}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t('profile.subscriptionCancelConfirm.summaryTitle', {
              defaultValue: 'Resumo do cancelamento',
            })}
          </Text>
          <View style={styles.fieldList}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t('profile.subscriptionCancelConfirm.programLabel', { defaultValue: 'Programa' })}
              </Text>
              <Text style={styles.fieldValue}>{programName}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t('profile.subscriptionManage.status', { defaultValue: 'Status' })}
              </Text>
              <Badge
                label={t('profile.subscriptionCancelConfirm.statusCanceled', { defaultValue: 'Cancelado' })}
                color='orange'
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t('profile.subscriptionCancel.accessUntil', { defaultValue: 'Acesso disponível até' })}
              </Text>
              <Text style={styles.fieldValue}>
                {t('profile.subscriptionCancelConfirm.accessUntilValue', {
                  defaultValue: `Até ${accessUntilLabel}`,
                  date: accessUntilLabel,
                })}
              </Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t('profile.subscriptionCancelConfirm.newCharges', { defaultValue: 'Novas cobranças' })}
              </Text>
              <Text style={styles.fieldValue}>
                {t('profile.subscriptionManage.noUpcomingCharge', { defaultValue: 'Nenhuma' })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            {t('profile.subscriptionCancelConfirm.noticePrefix', {
              defaultValue: 'Você continuará aproveitando o programa até ',
            })}
            <Text style={styles.noticeTextBold}>{accessUntilLabel}</Text>
            {t('profile.subscriptionCancelConfirm.noticeSuffix', {
              defaultValue: '. Após essa data, o acesso será removido automaticamente.',
            })}
          </Text>
        </View>

        <View style={styles.emailCard}>
          <Icon name='mail-outline' size={32} color={COLORS.TEXT} />
          <View style={styles.emailTexts}>
            <Text style={styles.emailTitle}>
              {t('profile.subscriptionCancelConfirm.emailTitle', {
                defaultValue: 'E-mail de confirmação enviado',
              })}
            </Text>
            <Text style={styles.emailSubtitle}>
              {t('profile.subscriptionCancelConfirm.emailSubtitle', {
                defaultValue: 'Verifique sua caixa de entrada',
              })}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label={t('profile.subscriptionCancelConfirm.backButton', {
            defaultValue: 'Voltar aos Meus Protocolos e Serviços',
          })}
          onPress={handleBackToList}
          size='large'
        />
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default CancelProtocolSubscriptionConfirmScreen;
