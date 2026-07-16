import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { UnauthenticatedStep1 } from './components';
import { useAuthLogin } from '@/hooks';
import { useAnalyticsScreen, logButtonClick, logNavigation } from '@/analytics';
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

  useEffect(() => {
    if (skipAutoLogin) {
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
  }, [authLogin, skipAutoLogin]);

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

  return (
    <SafeAreaView style={styles.container}>
      <UnauthenticatedStep1 onLogin={handleLogin} isLoading={isLoading} />
    </SafeAreaView>
  );
};

export default UnauthenticatedScreen;
