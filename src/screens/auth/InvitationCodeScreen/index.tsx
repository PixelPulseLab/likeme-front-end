import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { PrimaryButton, SecondaryButton, TextInput } from '@/components/ui';
import { KeyboardAwareScreen } from '@/components/ui/layout';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { invitationCodeValidationI18nKey } from '@/constants/invitation/invitationCodeValidation';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen, logButtonClick, logFormSubmit, logNavigation } from '@/analytics';
import { invitationService } from '@/services/invitation/invitationService';
import type { RootStackParamList } from '@/types/navigation';
import { logger } from '@/utils/logger';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'InvitationCode'>;

const InvitationCodeScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InvitationCode', screenClass: 'InvitationCodeScreen' });
  const { t } = useTranslation();
  const [code, setCode] = useState(typeof route.params?.code === 'string' ? route.params.code : '');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);

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
    if (isValidating) {
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

  const handleInterestAreas = () => {
    if (isValidating) {
      return;
    }
    logButtonClick({
      screen_name: 'invitation_code',
      button_label: 'interest_areas',
      action_name: 'interest_areas',
    });
    logNavigation({
      source_screen: 'invitation_code',
      destination_screen: 'interest_categories',
      action_name: 'interest_areas',
    });
    navigation.navigate('InterestCategories');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAwareScreen scrollContentContainerStyle={styles.scrollContent}>
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
            editable={!isValidating}
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
            disabled={isValidating}
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
            onPress={handleInterestAreas}
            disabled={isValidating}
            size='large'
            testID={E2E_TEST_IDS.INVITATION_CODE_INTERESTS}
          />
        </View>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
};

export default InvitationCodeScreen;
