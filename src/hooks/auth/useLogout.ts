import { useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthService } from '@/services';
import { logger } from '@/utils/logger';

interface UseLogoutOptions {
  navigation: any;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useLogout = (options: UseLogoutOptions) => {
  const { navigation, onSuccess, onError } = options;

  const logout = useCallback(async () => {
    Alert.alert('Confirmar Logout', 'Tem certeza que deseja sair?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            const rootNavigation = navigation.getParent() || navigation;
            rootNavigation.reset({
              index: 0,
              routes: [{ name: 'Unauthenticated' as never, params: { skipAutoLogin: true } }],
            });
            onSuccess?.();
          } catch (error) {
            logger.error('Erro ao fazer logout:', error);
            const errorObj = error instanceof Error ? error : new Error('Erro desconhecido');
            Alert.alert('Erro', 'Não foi possível fazer logout. Tente novamente.');
            onError?.(errorObj);
          }
        },
      },
    ]);
  }, [navigation, onSuccess, onError]);

  return { logout };
};
