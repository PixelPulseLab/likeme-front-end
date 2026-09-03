import { useEffect } from 'react';
import { FORCE_START_ONBOARDING_LOCALLY } from '@/constants';
import { AUTH_ONBOARDING_SCREENS_ORDER } from '@/constants/authOnboarding';
import { storageService, AuthService } from '@/services';
import { getCachedPostAuthRoute } from '@/services/auth/applyAuthSessionResponse';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';
import { logger } from '@/utils/logger';
import { getNextOnboardingDestination } from '@/utils/auth/navigation';

type NavigationReplace = (screen: string, params?: object) => void;

async function syncAuthSessionFromBackend(): Promise<void> {
  if (FORCE_START_ONBOARDING_LOCALLY || isE2eAuthBypassEnabled()) {
    return;
  }
  const token = await storageService.getToken();
  if (!token) {
    return;
  }
  try {
    await AuthService.refreshBackendSessionFromStoredCredentials();
  } catch (error) {
    logger.warn('[useOnboardingRedirect] syncAuthSessionFromBackend falhou; segue com storage local', {
      cause: error,
    });
  }
}

async function destinationFromLocalStorage(): Promise<{ screen: string; params?: object }> {
  const [welcomeScreenAccessedAt, privacyPolicyAcceptedAt, registerCompletedAt, objectivesSelectedAt, user] =
    await Promise.all([
      storageService.getWelcomeScreenAccessedAt(),
      storageService.getPrivacyPolicyAcceptedAt(),
      storageService.getRegisterCompletedAt(),
      storageService.getCategorySelectedAt(),
      storageService.getUser(),
    ]);

  if (!welcomeScreenAccessedAt) {
    return { screen: AUTH_ONBOARDING_SCREENS_ORDER[0] };
  }

  const displayName = user?.name?.trim() || user?.nickname?.trim() || null;
  return getNextOnboardingDestination(
    welcomeScreenAccessedAt,
    privacyPolicyAcceptedAt,
    registerCompletedAt,
    objectivesSelectedAt,
    displayName,
  );
}

export function useOnboardingRedirect(navigationReplace: NavigationReplace): void {
  useEffect(() => {
    const redirect = async () => {
      try {
        if (FORCE_START_ONBOARDING_LOCALLY) {
          await storageService.clearAll();
          invalidateApiClientAuthTokenMemoryCache();
        }

        const welcomeScreenAccessedAt = await storageService.getWelcomeScreenAccessedAt();
        if (!welcomeScreenAccessedAt) {
          navigationReplace(AUTH_ONBOARDING_SCREENS_ORDER[0]);
          return;
        }

        let postAuthRoute = getCachedPostAuthRoute();
        if (!postAuthRoute) {
          await syncAuthSessionFromBackend();
          postAuthRoute = getCachedPostAuthRoute();
        }

        if (postAuthRoute) {
          navigationReplace(postAuthRoute.screen, postAuthRoute.params);
          return;
        }

        // Rede falhou ou resposta sem postAuthRoute: não empurrar para Register às cegas.
        const localDestination = await destinationFromLocalStorage();
        navigationReplace(localDestination.screen, localDestination.params);
      } catch (error) {
        logger.error('Error checking onboarding status:', error);
        navigationReplace('Register');
      }
    };

    redirect();
  }, [navigationReplace]);
}
