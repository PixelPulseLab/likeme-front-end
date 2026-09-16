import apiClient from '../infrastructure/apiClient';
import type { ApiResponse } from '@/types/infrastructure';
import type {
  ActivityLeadTimeMinutes,
  NotificationCategoryForm,
  NotificationPreferenceCategoryId,
  NotificationPreferenceChannelId,
  NotificationPreferenceRow,
  NotificationPreferencesForm,
  NotificationPreferredTimeId,
} from '@/types/notification/notificationPreferences';

const ENDPOINT = '/api/notifications/preferences';
const CATEGORIES: NotificationPreferenceCategoryId[] = ['offers', 'activities', 'transactions'];
const CHANNELS: NotificationPreferenceChannelId[] = ['email', 'whatsapp', 'push'];
export const NOTIFICATION_REQUIRED_CHANNEL: Record<NotificationPreferenceCategoryId, NotificationPreferenceChannelId> =
  {
    offers: 'email',
    activities: 'push',
    transactions: 'email',
  };

type ListPreferencesResponse = ApiResponse<{
  preferences: NotificationPreferenceRow[];
  editedByUser?: boolean;
}>;

function emptyChannels(required: NotificationPreferenceChannelId) {
  return {
    email: required === 'email',
    whatsapp: false,
    push: required === 'push',
  };
}

function emptyCategory(id: NotificationPreferenceCategoryId): NotificationCategoryForm {
  return {
    id,
    enabled: true,
    channels: emptyChannels(NOTIFICATION_REQUIRED_CHANNEL[id]),
    preferredTime: 'no_preferred',
    leadTimeMinutes: 60,
  };
}

export function emptyPreferencesForm(): NotificationPreferencesForm {
  return {
    offers: emptyCategory('offers'),
    activities: emptyCategory('activities'),
    transactions: emptyCategory('transactions'),
  };
}

export function preferencesFormFromRows(rows: NotificationPreferenceRow[]): NotificationPreferencesForm {
  const form = emptyPreferencesForm();

  for (const categoryId of CATEGORIES) {
    const categoryRows = rows.filter(
      (row) => row.category === categoryId && CHANNELS.includes(row.channel as NotificationPreferenceChannelId),
    );
    if (categoryRows.length === 0) {
      continue;
    }

    const required = NOTIFICATION_REQUIRED_CHANNEL[categoryId];
    const channels = emptyChannels(required);
    let enabled = false;
    let preferredTime: NotificationPreferredTimeId = 'no_preferred';
    let leadTimeMinutes: ActivityLeadTimeMinutes = 60;

    for (const row of categoryRows) {
      const channel = row.channel as NotificationPreferenceChannelId;
      const isActive = row.status === 'active';
      channels[channel] = isActive;
      if (isActive) {
        enabled = true;
      }
      if (
        row.preferredTime === 'morning' ||
        row.preferredTime === 'afternoon' ||
        row.preferredTime === 'evening' ||
        row.preferredTime === 'no_preferred'
      ) {
        preferredTime = row.preferredTime;
      }
      if (row.leadTimeMinutes === 10 || row.leadTimeMinutes === 30 || row.leadTimeMinutes === 60) {
        leadTimeMinutes = row.leadTimeMinutes;
      }
    }

    if (categoryId === 'transactions') {
      enabled = true;
      channels.email = true;
    } else if (enabled) {
      channels[required] = true;
    }
    form[categoryId] = { id: categoryId, enabled, channels, preferredTime, leadTimeMinutes };
  }

  return form;
}

export function upsertPayloadsForCategory(category: NotificationCategoryForm) {
  const required = NOTIFICATION_REQUIRED_CHANNEL[category.id];
  const preferredTime = category.id === 'offers' ? category.preferredTime : 'no_preferred';
  const leadTimeMinutes = category.id === 'activities' ? category.leadTimeMinutes : null;
  const payloadBase = {
    category: category.id,
    preferredTime,
    leadTimeMinutes,
  };

  const enabled = category.id === 'transactions' || category.enabled;
  if (!enabled) {
    return [
      {
        ...payloadBase,
        channel: required,
        status: 'inactive',
      },
    ];
  }

  return CHANNELS.map((channel) => ({
    ...payloadBase,
    channel,
    status: channel === required || category.channels[channel] ? 'active' : 'inactive',
  }));
}

export const notificationPreferenceService = {
  async listPreferences(): Promise<NotificationPreferenceRow[]> {
    const response = await apiClient.get<ListPreferencesResponse>(ENDPOINT);
    return response.data?.preferences ?? [];
  },

  async werePreferencesEditedByUser(): Promise<boolean> {
    const response = await apiClient.get<ListPreferencesResponse>(ENDPOINT);
    return response.data?.editedByUser === true;
  },

  async saveCategory(category: NotificationCategoryForm): Promise<void> {
    for (const payload of upsertPayloadsForCategory(category)) {
      await apiClient.put(ENDPOINT, payload);
    }
  },
};
