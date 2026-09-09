import React, { useState } from 'react';
import { Text } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { PrimaryButton } from '@/components/ui';
import { ScreenWithHeader } from '@/components/ui/layout';
import { E2E_TEST_IDS } from '@/constants/e2eTestIds';
import { useAnalyticsScreen, logButtonClick, logNavigation } from '@/analytics';
import { useTranslation } from '@/hooks/i18n';
import { storageService } from '@/services';
import type { RootStackParamList } from '@/types/navigation';
import { logger } from '@/utils/logger';
import { styles } from './styles';

type Props = StackScreenProps<RootStackParamList, 'InvitationContext'>;

const InvitationContextScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'InvitationContext', screenClass: 'InvitationContextScreen' });
  const { t } = useTranslation();
  const [isContinuing, setIsContinuing] = useState(false);

  const handleContinue = async () => {
    if (isContinuing) {
      return;
    }
    setIsContinuing(true);
    try {
      await storageService.setPendingInvitationCode(route.params.code);
      logButtonClick({
        screen_name: 'invitation_context',
        button_label: 'continue',
        action_name: 'continue',
      });
      logNavigation({
        source_screen: 'invitation_context',
        destination_screen: 'unauthenticated',
        action_name: 'continue',
      });
      navigation.navigate('Unauthenticated');
    } catch (error) {
      logger.error('[InvitationContextScreen] Falha ao guardar código de convite pendente', error);
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        onBackPress: () => navigation.goBack(),
        onLogoPress: () => undefined,
      }}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.programName}>{route.params.program.name}</Text>
      <PrimaryButton
        label={t('invitation.continue')}
        onPress={() => {
          void handleContinue();
        }}
        loading={isContinuing}
        disabled={isContinuing}
        size='large'
        style={styles.continueButton}
        testID={E2E_TEST_IDS.INVITATION_CONTEXT_CONTINUE}
      />
    </ScreenWithHeader>
  );
};

export default InvitationContextScreen;
