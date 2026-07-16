import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground, Icon, ScreenWithHeader } from '@/components/ui/layout';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { ModalBase } from '@/components/ui/modals/shared';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import { AuthService, userService } from '@/services';
import {
  ACCOUNT_CLOSURE_REASON_OPTIONS,
  ACCOUNT_DELETION_CONFIRMATION_WORD,
  type AccountClosureReason,
} from '@/constants/account/accountClosureReason';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS, SPACING } from '@/constants';
import { logger } from '@/utils/logger';
import { rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'DeleteAccount'>;
type DeleteAccountStep = 'overview' | 'reason';

const REMOVED_DATA_ITEMS = [
  {
    key: 'profile.deleteAccountFlow.removedItemBasicInfo',
    defaultValue: 'Informações básicas',
  },
  {
    key: 'profile.deleteAccountFlow.removedItemLogin',
    defaultValue: 'Login e senha',
  },
  {
    key: 'profile.deleteAccountFlow.removedItemHealth',
    defaultValue: 'Dados de saúde e preferências',
  },
  {
    key: 'profile.deleteAccountFlow.removedItemSocial',
    defaultValue: 'Logins sociais vinculados',
  },
  {
    key: 'profile.deleteAccountFlow.removedItemSubscriptions',
    defaultValue: 'Histórico de assinaturas',
  },
] as const;

const DeleteAccountScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'DeleteAccount', screenClass: 'DeleteAccountScreen' });
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;

  const [step, setStep] = useState<DeleteAccountStep>('overview');
  const [selectedReason, setSelectedReason] = useState<AccountClosureReason | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const canConfirmDeletion = useMemo(
    () => confirmationText.trim() === ACCOUNT_DELETION_CONFIRMATION_WORD,
    [confirmationText],
  );

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const runDeleteAccount = useCallback(async () => {
    setDeletingAccount(true);
    try {
      await userService.deleteMyAccount(selectedReason ?? undefined);
      await AuthService.logout();
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'Unauthenticated' as never, params: { skipAutoLogin: true } }],
      });
    } catch (error) {
      logger.error('[DeleteAccount] Falha ao excluir conta', { cause: error });
      const message = error instanceof Error ? error.message : t('profile.deleteAccountError');
      Alert.alert(t('profile.deleteAccountConfirmTitle'), message);
    } finally {
      setDeletingAccount(false);
      setConfirmModalVisible(false);
      setConfirmationText('');
    }
  }, [rootNavigation, selectedReason, t]);

  const handleOpenConfirmModal = useCallback(() => {
    setConfirmationText('');
    setConfirmModalVisible(true);
  }, []);

  const handleCloseConfirmModal = useCallback(() => {
    if (deletingAccount) return;
    setConfirmModalVisible(false);
    setConfirmationText('');
  }, [deletingAccount]);

  const renderOverviewStep = () => (
    <>
      <Text style={styles.title}>
        {t('profile.deleteAccountFlow.step1Title', { defaultValue: 'Encerrar a conta' })}
      </Text>
      <View style={styles.overviewBody}>
        <Text style={styles.description}>
          {t('profile.deleteAccountFlow.step1Description', {
            defaultValue:
              'Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos dos nossos servidores.',
          })}
        </Text>
        <View style={styles.removedList}>
          {REMOVED_DATA_ITEMS.map((item, index) => (
            <View key={item.key} style={styles.removedItemBlock}>
              <View style={styles.removedItemRow}>
                <View style={styles.removedItemLeft}>
                  <Icon name='check' size={20} color={COLORS.TEXT} />
                  <Text style={styles.removedItemLabel}>{t(item.key, { defaultValue: item.defaultValue })}</Text>
                </View>
                <Text style={styles.removedItemStatus}>
                  {t('profile.deleteAccountFlow.willBeRemoved', { defaultValue: 'Será removido' })}
                </Text>
              </View>
              {index < REMOVED_DATA_ITEMS.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            label={t('profile.deleteAccountFlow.continueButton', {
              defaultValue: 'Continuar com a exclusão',
            })}
            onPress={() => setStep('reason')}
            size='large'
          />
        </View>
      </View>
    </>
  );

  const renderReasonStep = () => (
    <>
      <Text style={styles.title}>{t('profile.deleteAccountFlow.step2Title')}</Text>
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>{t('profile.deleteAccountFlow.step2Disclaimer')}</Text>
        <Text style={styles.recoveryText}>{t('profile.deleteAccountFlow.step2RecoveryNotice')}</Text>
      </View>
      <Text style={styles.reasonTitle}>{t('profile.deleteAccountFlow.reasonSurveyTitle')}</Text>
      <View style={styles.reasonList}>
        {ACCOUNT_CLOSURE_REASON_OPTIONS.map((option) => {
          const selected = selectedReason === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
              onPress={() => setSelectedReason(selected ? null : option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.reasonRadio}>{selected ? <View style={styles.reasonRadioInner} /> : null}</View>
              <Text style={styles.reasonLabel}>{t(option.labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label={t('profile.deleteAccountFlow.advanceButton')}
          onPress={handleOpenConfirmModal}
          size='large'
        />
        <SecondaryButton label={t('profile.deleteAccountFlow.cancelButton')} onPress={handleCancel} />
      </View>
    </>
  );

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: step === 'reason' ? () => setStep('overview') : handleCancel,
        showBackButton: true,
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
          { paddingBottom: SPACING.GAP_20 + Math.max(insets.bottom, SPACING.MD) },
        ]}
      >
        {step === 'overview' ? renderOverviewStep() : renderReasonStep()}
      </ScrollView>

      <ModalBase
        visible={confirmModalVisible}
        onClose={handleCloseConfirmModal}
        title={t('profile.deleteAccountFlow.confirmModalTitle')}
        footer={
          <View style={[styles.actions, { padding: SPACING.MD }]}>
            <PrimaryButton
              label={t('profile.deleteAccountFlow.confirmDeleteButton')}
              onPress={() => void runDeleteAccount()}
              disabled={!canConfirmDeletion}
              loading={deletingAccount}
              solidDisabled={!canConfirmDeletion}
              size='large'
            />
            <SecondaryButton
              label={t('profile.deleteAccountFlow.cancelButton')}
              onPress={handleCloseConfirmModal}
              disabled={deletingAccount}
            />
          </View>
        }
      >
        <Text style={styles.modalInstruction}>{t('profile.deleteAccountFlow.confirmModalInstruction')}</Text>
        <TextInput
          value={confirmationText}
          onChangeText={setConfirmationText}
          placeholder={t('profile.deleteAccountFlow.confirmModalPlaceholder')}
          autoCapitalize='characters'
          autoCorrect={false}
          editable={!deletingAccount}
          style={styles.confirmInput}
        />
      </ModalBase>
    </ScreenWithHeader>
  );
};

export default DeleteAccountScreen;
