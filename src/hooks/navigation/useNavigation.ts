import { useCallback, useEffect } from 'react';
import { storageService } from '@/services';
import {
  navigateRootStack,
  resetRootStack,
  rootStackNavigationFrom,
  type NavWithParent,
} from '@/utils/navigation/rootStackNavigation';

type UseNavigationOptions = {
  resetToIfAuthenticated?: string;
};

export function useNavigation(navigation: NavWithParent, options?: UseNavigationOptions) {
  const root = rootStackNavigationFrom(navigation) ?? navigation;

  const navigateTo = useCallback(
    (name: string, params?: object) => {
      navigateRootStack(root, name, params);
    },
    [root],
  );

  const resetTo = useCallback(
    (name: string, params?: object) => {
      resetRootStack(root, name, params);
    },
    [root],
  );

  const authenticatedHomeScreen = options?.resetToIfAuthenticated;

  useEffect(() => {
    if (!authenticatedHomeScreen) {
      return;
    }

    let cancelled = false;
    void storageService.getToken().then((token) => {
      if (cancelled || !token?.trim()) {
        return;
      }
      resetTo(authenticatedHomeScreen);
    });
    return () => {
      cancelled = true;
    };
  }, [authenticatedHomeScreen, resetTo]);

  return { navigation: root, navigateTo, resetTo };
}
