import apiClient from '../infrastructure/apiClient';
import type { ApiResponse } from '@/types/infrastructure';

export type InboxNotification = {
  id: string;
  category: 'offers' | 'activities' | 'transactions';
  template: string;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

const inboxListeners = new Set<() => void>();

function emitInboxChange() {
  inboxListeners.forEach((listener) => listener());
}

const notificationApiService = {
  registerToken: async (token: string, platform: string): Promise<ApiResponse<unknown>> => {
    return apiClient.post<ApiResponse<unknown>>('/api/notifications/register-token', {
      token,
      platform,
    });
  },

  unregisterToken: async (token: string): Promise<ApiResponse<unknown>> => {
    return apiClient.post<ApiResponse<unknown>>('/api/notifications/unregister-token', {
      token,
    });
  },

  subscribeInboxChange(listener: () => void) {
    inboxListeners.add(listener);
    return () => {
      inboxListeners.delete(listener);
    };
  },

  async hasUnread(): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ hasUnread: boolean }>>('/api/notifications/inbox/unread');
    return response.data?.hasUnread === true;
  },

  async listInbox(): Promise<InboxNotification[]> {
    const response = await apiClient.get<ApiResponse<{ notifications: InboxNotification[] }>>(
      '/api/notifications/inbox',
    );
    return response.data?.notifications ?? [];
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/api/notifications/inbox/${id}/read`);
    emitInboxChange();
  },
};

export default notificationApiService;
