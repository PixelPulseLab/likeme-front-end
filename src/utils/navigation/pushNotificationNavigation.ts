import type { RootStackParamList } from '@/types/navigation';
import type { PendingPushNavigationTarget } from '@/utils/navigation/pendingPushNavigation';

export const ACTIVITY_CREATED_PUSH_TYPE = 'activity_created';
export const ACTIVITY_REMINDER_PUSH_TYPE = 'activity_reminder';
export const SUBSCRIPTION_PAST_DUE_PUSH_TYPE = 'subscription_past_due';

const SUBSCRIPTION_MANAGE_PROGRAM_NAME_FALLBACK = 'Programa';

function activityNavigationTarget(activityId: string | undefined): PendingPushNavigationTarget | null {
  if (!activityId?.trim()) {
    return { screen: 'Activities', params: { initialTab: 'actives' } };
  }

  return {
    screen: 'Activities',
    params: {
      initialTab: 'actives',
      focusActivityId: activityId.trim(),
    },
  };
}

function subscriptionPastDueNavigationTarget(subscriptionId: string | undefined): PendingPushNavigationTarget | null {
  const id = subscriptionId?.trim();
  if (!id) {
    return null;
  }

  return {
    screen: 'ManageProtocolSubscription',
    params: {
      subscriptionId: id,
      programName: SUBSCRIPTION_MANAGE_PROGRAM_NAME_FALLBACK,
      focusUpdatePayment: true,
    },
  };
}

export function pushNavigationTargetFromData(
  data: Record<string, string> | undefined,
): PendingPushNavigationTarget | null {
  if (!data?.type) {
    return null;
  }

  if (data.type === ACTIVITY_CREATED_PUSH_TYPE || data.type === ACTIVITY_REMINDER_PUSH_TYPE) {
    return activityNavigationTarget(data.activityId);
  }

  if (data.type === SUBSCRIPTION_PAST_DUE_PUSH_TYPE) {
    return subscriptionPastDueNavigationTarget(data.subscriptionId);
  }

  return null;
}

export function navigateToPushTarget(
  navigate: (screen: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void,
  target: PendingPushNavigationTarget,
): void {
  navigate(target.screen, target.params);
}
