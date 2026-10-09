import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { FORCE_START_ONBOARDING_LOCALLY } from '@/constants';
import { storageService, AuthService } from '@/services';
import { invitationService } from '@/services/invitation/invitationService';
import {
  clearCachedPostAuthRoute,
  getCachedHasRedeemedInvitation,
  getCachedPostAuthRoute,
} from '@/services/auth/applyAuthSessionResponse';
import { invalidateApiClientAuthTokenMemoryCache } from '@/services/infrastructure/apiClient';
import { useTranslation } from '@/hooks/i18n';
import { logger } from '@/utils/logger';
import {
  resetRootStack,
  resetRootStackOnTopOf,
  rootStackNavigationFrom,
  type NavWithParent,
} from '@/utils/navigation/rootStackNavigation';

async function syncAuthSessionFromBackend(invitationCode: string): Promise<void> {
  if (FORCE_START_ONBOARDING_LOCALLY) {
    return;
  }
  const token = await storageService.getToken();
  if (!token) {
    return;
  }
  try {
    const code = invitationCode.trim();
    const refreshOptions = code ? { code } : undefined;
    await AuthService.refreshBackendSessionFromStoredCredentials(refreshOptions);
  } catch (error) {
    logger.warn('[useOnboardingRedirect] syncAuthSessionFromBackend falhou; segue Home', {
      cause: error,
    });
  }
}

function currentRootRouteName(navigation: NavWithParent): string | undefined {
  const state = rootStackNavigationFrom(navigation)?.getState?.();
  return state?.routes[state.index]?.name;
}

function isInvitationRedeemRoute(currentRoute: string | undefined): boolean {
  return currentRoute === 'InvitationCode' || currentRoute === 'InvitationContext';
}

function shouldStayOnInvitationRedeem(
  currentRoute: string | undefined,
  sessionScreen: string | undefined,
  hasRedeemedInvitation: boolean | null,
): boolean {
  if (!isInvitationRedeemRoute(currentRoute)) {
    return false;
  }
  if (hasRedeemedInvitation === true) {
    return false;
  }
  if (hasRedeemedInvitation === false) {
    return true;
  }
  return sessionScreen !== 'Home';
}

export function useOnboardingRedirect(navigation: NavWithParent): void {
  const { t } = useTranslation();
  const replace = useCallback(
    (screen: string, params?: object) => {
      if (screen === 'ProductDetails') {
        resetRootStackOnTopOf(navigation, 'Home', screen, params);
        return;
      }
      resetRootStack(navigation, screen, params);
    },
    [navigation],
  );

  useEffect(() => {
    let cancelled = false;
    const redirect = async () => {
      try {
        if (FORCE_START_ONBOARDING_LOCALLY) {
          await storageService.clearAll();
          invalidateApiClientAuthTokenMemoryCache();
        } else {
          const token = await storageService.getToken();
          if (!token?.trim() || cancelled) {
            return;
          }
        }

        const currentRoute = currentRootRouteName(navigation);
        const onInvitationRoute = isInvitationRedeemRoute(currentRoute);
        const storedCode = onInvitationRoute ? '' : (await storageService.getPendingInvitationCode())?.trim() ?? '';
        if (!onInvitationRoute) {
          const activation = await invitationService.activatePendingStoredCode();
          if (!cancelled && activation.outcome === 'mismatch') {
            Alert.alert(t('invitation.identityMismatch'));
          }
        }

        clearCachedPostAuthRoute();
        await syncAuthSessionFromBackend(storedCode);
        if (cancelled || currentRootRouteName(navigation) !== currentRoute) {
          return;
        }
        const cachedRoute = getCachedPostAuthRoute();
        const hasRedeemedInvitation = getCachedHasRedeemedInvitation();
        if (shouldStayOnInvitationRedeem(currentRoute, cachedRoute?.screen, hasRedeemedInvitation)) {
          return;
        }
        const followsSession = cachedRoute?.screen === 'Home' || cachedRoute?.screen === 'ProductDetails';
        const destination = followsSession ? cachedRoute : { screen: 'Home' };
        if (destination.screen === 'ProductDetails') {
          await storageService.removePendingInvitationCode();
        }
        if (cancelled || currentRootRouteName(navigation) !== currentRoute) {
          return;
        }
        replace(destination.screen, destination.params);
      } catch (error) {
        logger.error('Error checking onboarding status:', error);
        if (!cancelled) {
          replace('Home');
        }
      }
    };

    redirect();
    return () => {
      cancelled = true;
    };
  }, [navigation, replace, t]);
}
