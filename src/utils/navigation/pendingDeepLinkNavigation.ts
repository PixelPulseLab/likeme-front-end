import type { RootStackParamList } from '@/types/navigation';

export type PendingDeepLinkNavigationTarget = {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

let pendingTarget: PendingDeepLinkNavigationTarget | null = null;

export function hasPendingDeepLinkNavigation(): boolean {
  return pendingTarget != null;
}

export function setPendingDeepLinkNavigation(target: PendingDeepLinkNavigationTarget): void {
  pendingTarget = target;
}

export function consumePendingDeepLinkNavigation(): PendingDeepLinkNavigationTarget | null {
  const target = pendingTarget;
  pendingTarget = null;
  return target;
}

export function canNavigateFromDeepLink(activeRouteName: string | undefined): boolean {
  if (!activeRouteName) {
    return false;
  }

  const blockedRoutes = new Set(['Loading', 'Unauthenticated', 'Authenticated', 'ForcedUpdate', 'AppLoading']);
  return !blockedRoutes.has(activeRouteName);
}
