import type { RootStackParamList } from '@/types/navigation';

export type PendingPushNavigationTarget = {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
};

let pendingTarget: PendingPushNavigationTarget | null = null;

export function setPendingPushNavigation(target: PendingPushNavigationTarget): void {
  pendingTarget = target;
}

export function consumePendingPushNavigation(): PendingPushNavigationTarget | null {
  const target = pendingTarget;
  pendingTarget = null;
  return target;
}

export function canNavigateFromPush(activeRouteName: string | undefined): boolean {
  if (!activeRouteName) {
    return false;
  }

  const blockedRoutes = new Set(['Loading', 'Unauthenticated', 'InvitationCode', 'Authenticated', 'ForcedUpdate']);
  return !blockedRoutes.has(activeRouteName);
}
