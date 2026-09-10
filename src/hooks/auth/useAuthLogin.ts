import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { AuthService } from '@/services';
import { invitationService } from '@/services/invitation/invitationService';
import { useTranslation } from '@/hooks/i18n';
import { logger } from '@/utils/logger';
import { isLoginUserAbortError } from '@/utils/auth/loginUserAbort';

export const useAuthLogin = (navigation: any) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const loginInFlightRef = useRef(false);

  const handleLogin = useCallback(async () => {
    if (loginInFlightRef.current) {
      return;
    }

    loginInFlightRef.current = true;
    setIsLoading(true);
    try {
      const authResult = await AuthService.login();
      await AuthService.validateToken(authResult);

      const activation = await invitationService.activatePendingStoredCode();
      if (activation.outcome === 'mismatch') {
        Alert.alert(t('invitation.identityMismatch'));
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Authenticated' as never }],
      });
    } catch (error) {
      if (isLoginUserAbortError(error)) {
        loginInFlightRef.current = false;
        setIsLoading(false);
        return;
      }
      logger.error('Login error:', error);
      if (error instanceof Error) {
        Alert.alert('Erro no Login', error.message || 'Erro ao fazer login');
      } else {
        Alert.alert('Erro no Login', 'Erro ao fazer login');
      }
    } finally {
      loginInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [navigation, t]);

  return { handleLogin, isLoading };
};
