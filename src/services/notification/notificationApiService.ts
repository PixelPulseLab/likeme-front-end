import apiClient from '../infrastructure/apiClient';
import type { ApiResponse } from '@/types/infrastructure';

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

  async hasUnread(): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ hasUnread: boolean }>>('/api/notifications/inbox/unread');
    return response.data?.hasUnread === true;
  },
};

export default notificationApiService;
