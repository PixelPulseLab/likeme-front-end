import type { UserActivity } from '@/types/activity';
import type { ActivityItem } from '@/types/activity/hooks';

function formatActivityDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}.`;
}

function parseActivityStartDate(startDate: string): Date {
  const dateOnly = startDate.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(startDate);
}

function isUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('www.') ||
    value.startsWith('meet.google')
  );
}

export function userActivityToItem(activity: UserActivity): ActivityItem {
  let dateTime: string | undefined;
  if (activity.startDate) {
    const date = parseActivityStartDate(activity.startDate);
    const formattedDate = formatActivityDate(date);
    dateTime = activity.startTime ? `${formattedDate} at ${activity.startTime}` : formattedDate;
  }

  const linkedDescription = activity.description ?? '';
  const description = linkedDescription.startsWith('community_event:')
    ? activity.location ?? ''
    : linkedDescription || activity.location || '';
  const isCompleted = activity.deletedAt !== null && description.startsWith('[COMPLETED]');
  const isDeclined = activity.deletedAt !== null && !isCompleted;

  const meetUrl = activity.location && isUrl(activity.location) ? activity.location : undefined;
  const providerName =
    activity.location?.includes('Meet') && !isUrl(activity.location)
      ? activity.location.replace('Meet with ', '')
      : undefined;

  return {
    id: activity.id,
    type: activity.type === 'task' ? 'personal' : activity.type === 'event' ? 'appointment' : 'program',
    title: activity.name,
    description: description.replace(/^\[COMPLETED\]/, ''),
    dateTime,
    providerName,
    providerAvatar: providerName ? providerName.charAt(0) : undefined,
    completed: activity.deletedAt !== null,
    declined: isDeclined,
    isFavorite: false,
    meetUrl,
  };
}

export function userActivitiesToItems(activities: UserActivity[]): ActivityItem[] {
  return activities.map(userActivityToItem);
}
