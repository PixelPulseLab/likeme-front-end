import { useEffect } from 'react';
import { AUTH_BOOTSTRAP_HTTP_TIMEOUT_MS, FORCE_START_ONBOARDING_LOCALLY } from '@/constants';
import { getNextOnboardingDestination } from '@/utils';
import { storageService, AuthService, userService } from '@/services';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import { logger } from '@/utils/logger';

type NavigationReplace = (screen: string, params?: object) => void;

/**
 * Sincroniza JWT e flags de onboarding com o backend (`GET /api/auth/token`) quando há token.
 * Com `FORCE_START_ONBOARDING_LOCALLY` não chama a API (onboarding forçado só no device).
 */
async function syncOnboardingStateFromBackend(): Promise<void> {
  if (FORCE_START_ONBOARDING_LOCALLY) {
    return;
  }
  const token = await storageService.getToken();
  if (!token) return;
  try {
    await AuthService.refreshBackendSessionFromStoredCredentials();
  } catch (error) {
    logger.warn('[useOnboardingRedirect] syncOnboardingStateFromBackend falhou; segue com flags do storage', {
      cause: error,
    });
  }
}

/**
 * Obtém o nome do usuário logado para exibir nas telas de onboarding (storage primeiro, depois perfil da API).
 */
async function getLoggedInUserDisplayName(): Promise<string | null> {
  const token = await storageService.getToken();
  if (!token) return null;
  try {
    const response = await Promise.race([
      userService.getProfile(),
      new Promise<'timeout'>((resolve) => {
        setTimeout(() => resolve('timeout'), AUTH_BOOTSTRAP_HTTP_TIMEOUT_MS);
      }),
    ]);
    if (response !== 'timeout' && response && typeof response === 'object' && 'success' in response) {
      if (response.success && response.data) {
        const person = response.data.person;
        if (person?.firstName) {
          const full = [person.firstName, person.lastName, person.surname].filter(Boolean).join(' ').trim();
          return full || response.data.name?.trim() || null;
        }
        if (response.data.name?.trim()) {
          return response.data.name.trim();
        }
      }
    }
    if (response === 'timeout') {
      logger.warn('[useOnboardingRedirect] Timeout ao buscar perfil; usa nome do storage');
    }
  } catch (error) {
    logger.warn('[useOnboardingRedirect] getProfile falhou; fallback de nome no onboarding', { cause: error });
  }
  const stored = await storageService.getUser();
  return stored?.name?.trim() || stored?.nickname?.trim() || null;
}

export function useOnboardingRedirect(navigationReplace: NavigationReplace): void {
  useEffect(() => {
    const redirect = async () => {
      try {
        if (FORCE_START_ONBOARDING_LOCALLY) {
          await storageService.clearAll();
          invalidateApiClientAuthTokenMemoryCache();
        }
        await syncOnboardingStateFromBackend();

        const welcomeScreenAccessedAt = await storageService.getWelcomeScreenAccessedAt();
        const privacyPolicyAcceptedAt = await storageService.getPrivacyPolicyAcceptedAt();
        const registerCompletedAt = await storageService.getRegisterCompletedAt();
        const objectivesSelectedAt = await storageService.getCategorySelectedAt();
        const userDisplayName = await getLoggedInUserDisplayName();

        const destination = getNextOnboardingDestination(
          welcomeScreenAccessedAt,
          privacyPolicyAcceptedAt,
          registerCompletedAt,
          objectivesSelectedAt,
          userDisplayName,
        );
        navigationReplace(destination.screen, destination.params);
      } catch (error) {
        logger.error('Error checking onboarding status:', error);
        navigationReplace('Register');
      }
    };

    redirect();
  }, [navigationReplace]);
}
