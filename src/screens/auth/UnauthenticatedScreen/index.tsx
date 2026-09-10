import React, { useEffect, useState } from 'react';
import { useAuthLogin } from '@/hooks';
import { useFeatureFlag } from '@/hooks/featureFlags/useFeatureFlag';
import { useAnalyticsScreen, logButtonClick, logNavigation } from '@/analytics';
import { FEATURE_FLAGS } from '@/constants';
import { bootstrapE2eSessionAndNavigate } from '@/utils/e2e/bootstrapE2eSession';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';
import { logger } from '@/utils/logger';
import { UnauthenticatedStep1 } from './components';

type Props = {
  navigation: any;
  route: any;
};

const AUTO_LOGIN_DEBOUNCE_MS = 1500;
let lastUnauthenticatedAutoLoginMs = 0;

const UnauthenticatedScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'Unauthenticated', screenClass: 'UnauthenticatedScreen' });
  const { handleLogin: authLogin, isLoading } = useAuthLogin(navigation);
  const { isEnabled: isInvitationEnabled, isLoading: isInvitationFlagLoading } = useFeatureFlag(
    FEATURE_FLAGS.INVITATION_ENABLED,
  );
  const skipAutoLogin = Boolean(route?.params?.skipAutoLogin);
  const startLogin = Boolean(route?.params?.startLogin);
  const e2eBypass = isE2eAuthBypassEnabled();
  const [e2eLoading, setE2eLoading] = useState(false);

  useEffect(() => {
    if (!startLogin || skipAutoLogin || e2eBypass) {
      return;
    }
    const now = Date.now();
    if (now - lastUnauthenticatedAutoLoginMs < AUTO_LOGIN_DEBOUNCE_MS) {
      return;
    }
    lastUnauthenticatedAutoLoginMs = now;
    logNavigation({
      source_screen: 'unauthenticated',
      destination_screen: 'authenticated',
      action_name: 'login_auto_on_mount',
    });
    void authLogin();
  }, [authLogin, skipAutoLogin, startLogin, e2eBypass]);

  const handleStart = () => {
    if (isInvitationFlagLoading) {
      return;
    }

    if (isInvitationEnabled) {
      logButtonClick({
        screen_name: 'unauthenticated',
        button_label: 'start',
        action_name: 'invitation_code',
      });
      logNavigation({
        source_screen: 'unauthenticated',
        destination_screen: 'invitation_code',
        action_name: 'start',
      });
      navigation.navigate('InvitationCode');
      return;
    }

    logButtonClick({
      screen_name: 'unauthenticated',
      button_label: 'start',
      action_name: 'login',
    });
    logNavigation({
      source_screen: 'unauthenticated',
      destination_screen: 'authenticated',
      action_name: 'start',
    });
    authLogin();
  };

  const handleE2eContinue = async () => {
    if (!e2eBypass || e2eLoading) {
      return;
    }
    setE2eLoading(true);
    try {
      logButtonClick({
        screen_name: 'unauthenticated',
        button_label: 'e2e_continue',
        action_name: 'e2e_bootstrap',
      });
      await bootstrapE2eSessionAndNavigate(navigation, { completeOnboarding: true });
    } catch (error) {
      logger.error('[UnauthenticatedScreen] Falha no bootstrap E2E', error);
    } finally {
      setE2eLoading(false);
    }
  };

  return (
    <UnauthenticatedStep1
      onStart={handleStart}
      isLoading={isLoading}
      isStartDisabled={isInvitationFlagLoading}
      onE2eContinue={e2eBypass ? () => void handleE2eContinue() : undefined}
      e2eLoading={e2eLoading}
    />
  );
};

export default UnauthenticatedScreen;
