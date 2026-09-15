export type NotificationPreferenceCategoryId = 'offers' | 'activities' | 'transactions';
export type NotificationPreferenceChannelId = 'email' | 'whatsapp' | 'push';
export type NotificationPreferredTimeId = 'morning' | 'afternoon' | 'evening' | 'no_preferred';
export type ActivityLeadTimeMinutes = 10 | 30 | 60;

export type NotificationPreferenceRow = {
  category: string;
  channel: string;
  status: string;
  preferredTime?: string | null;
  leadTimeMinutes?: number | null;
};

export type NotificationCategoryForm = {
  id: NotificationPreferenceCategoryId;
  enabled: boolean;
  channels: Record<NotificationPreferenceChannelId, boolean>;
  preferredTime: NotificationPreferredTimeId;
  leadTimeMinutes: ActivityLeadTimeMinutes;
};

export type NotificationPreferencesForm = Record<NotificationPreferenceCategoryId, NotificationCategoryForm>;
