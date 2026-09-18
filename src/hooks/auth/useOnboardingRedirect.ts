import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { FORCE_START_ONBOARDING_LOCALLY } from '@/constants';
import { storageService, AuthService } from '@/services';
import { invitationHomeRoute, invitationService } from '@/services/invitation/invitationService';
import { clearCachedPostAuthRoute, getCachedPostAuthRoute } from '@/services/auth/applyAuthSessionResponse';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import { useTranslation } from '@/hooks/i18n';
import { isE2eAuthBypassEnabled } from '@/utils/e2e/e2eAuthBypass';
import { logger } from '@/utils/logger';
import { resetRootStack, rootStackNavigationFrom, type NavWithParent } from '@/utils/navigation/rootStackNavigation';

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
    logger.warn('[useOnboardingRedirect] syncAuthSessionFromBackend falhou; segue Home ou Wall', {
      cause: error,
    });
  }
}

function homeOrWallFromSession(
  postAuthRoute: { screen: string; params?: object } | null,
): { screen: string; params?: object } | undefined {
  if (postAuthRoute?.screen === 'Home' || postAuthRoute?.screen === 'Wall') {
    return postAuthRoute;
  }
  return undefined;
}

function currentRootRouteName(navigation: NavWithParent): string | undefined {
  const state = rootStackNavigationFrom(navigation)?.getState?.();
  return state?.routes[state.index]?.name;
}

function isInvitationRedeemRoute(currentRoute: string | undefined): boolean {
  return currentRoute === 'InvitationCode' || currentRoute === 'InvitationContext';
}

function shouldStayOnInvitationRedeem(currentRoute: string | undefined, destinationScreen: string): boolean {
  return destinationScreen === 'Wall' && isInvitationRedeemRoute(currentRoute);
}

export function useOnboardingRedirect(navigation: NavWithParent): void {
  const { t } = useTranslation();
  const replace = useCallback(
    (screen: string, params?: object) => {
      resetRootStack(navigation, screen, params);
    },
    [navigation],
  );

  useEffect(() => {
    const redirect = async () => {
      try {
        if (FORCE_START_ONBOARDING_LOCALLY) {
          await storageService.clearAll();
          invalidateApiClientAuthTokenMemoryCache();
        } else {
          const token = await storageService.getToken();
          if (!token?.trim()) {
            return;
          }
        }

        const currentRoute = currentRootRouteName(navigation);
        if (!isInvitationRedeemRoute(currentRoute)) {
          const activation = await invitationService.activatePendingStoredCode();
          if (activation.outcome === 'mismatch') {
            Alert.alert(t('invitation.identityMismatch'));
          }
        }

        clearCachedPostAuthRoute();
        await syncAuthSessionFromBackend();
        const sessionRoute = homeOrWallFromSession(getCachedPostAuthRoute());
        const destination = await invitationHomeRoute(sessionRoute?.screen, sessionRoute?.params);
        if (shouldStayOnInvitationRedeem(currentRoute, destination.screen)) {
          return;
        }
        replace(destination.screen, destination.params);
      } catch (error) {
        logger.error('Error checking onboarding status:', error);
        replace('Wall');
      }
    };

    redirect();
  }, [navigation, replace, t]);
}
