import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { UnauthenticatedStep1 } from './components';
import { useAuthLogin } from '@/hooks';
import { useAnalyticsScreen, logButtonClick, logNavigation } from '@/analytics';
import { bootstrapE2eSessionAndNavigate } from '@/utils/e2e/bootstrapE2eSession';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';
import { logger } from '@/utils/logger';
import { styles } from './styles';

type Props = {
  navigation: any;
  route: any;
};

const AUTO_LOGIN_DEBOUNCE_MS = 1500;
let lastUnauthenticatedAutoLoginMs = 0;

const UnauthenticatedScreen: React.FC<Props> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'Unauthenticated', screenClass: 'UnauthenticatedScreen' });
  const { handleLogin: authLogin, isLoading } = useAuthLogin(navigation);
  const skipAutoLogin = Boolean(route?.params?.skipAutoLogin);
  const e2eBypass = isE2eAuthBypassEnabled();
  const [e2eLoading, setE2eLoading] = useState(false);

  useEffect(() => {
    if (skipAutoLogin || e2eBypass) {
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
  }, [authLogin, skipAutoLogin, e2eBypass]);

  const handleLogin = () => {
    logButtonClick({
      screen_name: 'unauthenticated',
      button_label: 'login',
      action_name: 'login',
    });
    logNavigation({
      source_screen: 'unauthenticated',
      destination_screen: 'authenticated',
      action_name: 'login',
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
    <SafeAreaView style={styles.container}>
      <UnauthenticatedStep1
        onLogin={handleLogin}
        isLoading={isLoading}
        onE2eContinue={e2eBypass ? () => void handleE2eContinue() : undefined}
        e2eLoading={e2eLoading}
      />
    </SafeAreaView>
  );
};

export default UnauthenticatedScreen;
