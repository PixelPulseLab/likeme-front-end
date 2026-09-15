import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { PrimaryButton, SecondaryButton, TextInput } from '@/components/ui';
import { KeyboardAwareScreen, ScreenWithHeader } from '@/components/ui/layout';
import { COLORS, SPACING } from '@/constants';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { invitationCodeValidationI18nKey } from '@/constants/invitation/invitationCodeValidation';
import { useAuthLogin } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen, logButtonClick, logFormSubmit, logNavigation } from '@/analytics';
import { useOnboardingRedirect } from '@/hooks/auth/useOnboardingRedirect';
import { invitationService } from '@/services/invitation/invitationService';
import type { RootStackParamList } from '@/types/navigation';
import { logger } from '@/utils/logger';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'InvitationCode'>;

const InvitationCodeScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InvitationCode', screenClass: 'InvitationCodeScreen' });
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [code, setCode] = useState(typeof route.params?.code === 'string' ? route.params.code : '');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);
  const canGoBack = typeof navigation.canGoBack === 'function' && navigation.canGoBack();
  const { handleLogin, isLoading: isLoginLoading } = useAuthLogin(navigation);
  const isBusy = isValidating || isLoginLoading;
  useOnboardingRedirect(navigation);

  useEffect(() => {
    const next = route.params?.code;
    if (typeof next === 'string' && next.length > 0) {
      setCode(next);
    }
  }, [route.params?.code]);

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (fieldError) {
      setFieldError(undefined);
    }
  };

  const handleEnter = async () => {
    if (isBusy) {
      return;
    }

    const trimmed = code.trim();
    if (!trimmed) {
      setFieldError(t('invitation.codeRequired'));
      logFormSubmit({
        screen_name: 'invitation_code',
        form_name: 'invitation_code',
        success: false,
        error_type: 'validation_empty_code',
      });
      return;
    }

    setFieldError(undefined);
    setIsValidating(true);
    try {
      const context = await invitationService.validateCode(trimmed);
      logFormSubmit({
        screen_name: 'invitation_code',
        form_name: 'invitation_code',
        success: true,
      });
      logNavigation({
        source_screen: 'invitation_code',
        destination_screen: 'invitation_context',
        action_name: 'enter',
      });
      navigation.navigate('InvitationContext', context);
    } catch (error) {
      logger.error('[InvitationCodeScreen] Falha ao validar código de convite', error);
      setFieldError(t(invitationCodeValidationI18nKey(error)));
      logFormSubmit({
        screen_name: 'invitation_code',
        form_name: 'invitation_code',
        success: false,
        error_type: invitationCodeValidationI18nKey(error),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleInterestAreas = async () => {
    if (isBusy) {
      return;
    }
    logButtonClick({
      screen_name: 'invitation_code',
      button_label: 'interest_areas',
      action_name: 'interest_areas',
    });
    logNavigation({
      source_screen: 'invitation_code',
      destination_screen: 'wall',
      action_name: 'interest_areas',
    });
    await handleLogin({ discardPendingInvitation: true });
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: canGoBack,
        onBackPress: canGoBack ? () => navigation.goBack() : undefined,
        onLogoPress: () => undefined,
        backgroundColor: COLORS.BACKGROUND,
      }}
      contentContainerStyle={styles.container}
    >
      <KeyboardAwareScreen
        scrollContentContainerStyle={[
          styles.scrollContent,
          bottomInset > 0 ? { paddingBottom: SPACING.XL + bottomInset } : null,
        ]}
      >
        <Text style={styles.headline}>{t('invitation.headline')}</Text>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t('invitation.invitedTitle')}</Text>
          <Text style={styles.blockBody}>
            {t('invitation.invitedBodyPrefix')}
            <Text style={styles.blockBodyEmphasis}>{t('invitation.invitedBodyEmphasis')}</Text>
            {t('invitation.invitedBodySuffix')}
          </Text>
          <TextInput
            value={code}
            onChangeText={handleCodeChange}
            placeholder={t('invitation.codePlaceholder')}
            errorText={fieldError}
            autoCapitalize='characters'
            autoCorrect={false}
            autoComplete='off'
            returnKeyType='done'
            editable={!isBusy}
            onSubmitEditing={() => {
              void handleEnter();
            }}
            testID={E2E_TEST_IDS.INVITATION_CODE_INPUT}
          />
          <PrimaryButton
            label={t('invitation.enter')}
            onPress={() => {
              void handleEnter();
            }}
            loading={isValidating}
            disabled={isBusy}
            size='large'
            style={styles.enterButton}
            testID={E2E_TEST_IDS.INVITATION_CODE_ENTER}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t('invitation.notInvitedTitle')}</Text>
          <Text style={styles.blockBody}>
            {t('invitation.notInvitedBodyPrefix')}
            <Text style={styles.blockBodyEmphasis}>{t('invitation.notInvitedBodyEmphasis')}</Text>
            {t('invitation.notInvitedBodySuffix')}
          </Text>
          <SecondaryButton
            label={t('invitation.interestAreas')}
            onPress={() => {
              void handleInterestAreas();
            }}
            loading={isLoginLoading}
            disabled={isBusy}
            size='large'
            testID={E2E_TEST_IDS.INVITATION_CODE_INTERESTS}
          />
        </View>
      </KeyboardAwareScreen>
    </ScreenWithHeader>
  );
};

export default InvitationCodeScreen;
