import apiClient from '../infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type {
  UserActivity,
  ListActivitiesParams,
  ListActivitiesApiResponse,
  GetActivityApiResponse,
  CreateActivityData,
  UpdateActivityData,
} from '@/types/activity';
import type { ApiResponse } from '@/types/infrastructure';

class ActivityService {
  private readonly activitiesEndpoint = '/api/activities';

  async listActivities(params: ListActivitiesParams = {}): Promise<ListActivitiesApiResponse> {
    try {
      const queryParams: Record<string, string> = {};

      if (params.page !== undefined) {
        queryParams.page = String(params.page);
      }

      if (params.limit !== undefined) {
        queryParams.limit = String(params.limit);
      }

      if (params.type) {
        queryParams.type = params.type;
      }

      if (params.startDate) {
        queryParams.startDate = params.startDate;
      }

      if (params.endDate) {
        queryParams.endDate = params.endDate;
      }

      if (params.scope) {
        queryParams.scope = params.scope;
      }

      if (params.includeDeleted !== undefined) {
        queryParams.includeDeleted = String(params.includeDeleted);
      }

      const response = await apiClient.get<ListActivitiesApiResponse>(
        this.activitiesEndpoint,
        queryParams,
        true,
        false,
      );

      logger.debug('Activities list response:', {
        page: params.page,
        limit: params.limit,
        type: params.type,
        success: response.success,
        activitiesCount: response.data?.activities?.length || 0,
        total: response.data?.pagination?.total || 0,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching activities list:', error);
      throw error;
    }
  }

  async getActivityById(activityId: string): Promise<GetActivityApiResponse> {
    try {
      if (!activityId || activityId.trim() === '') {
        throw new Error('Activity ID is required');
      }

      const endpoint = `${this.activitiesEndpoint}/${activityId.trim()}`;

      const response = await apiClient.get<GetActivityApiResponse>(endpoint, undefined, true, false);

      logger.debug('Activity detail response:', {
        activityId,
        success: response.success,
        hasData: !!response.data,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching activity detail:', error);
      throw error;
    }
  }

  async createActivity(data: CreateActivityData): Promise<ApiResponse<UserActivity>> {
    try {
      const response = await apiClient.post<ApiResponse<UserActivity>>(this.activitiesEndpoint, data, true);

      logger.debug('Activity created:', {
        activityId: response.data?.id,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error creating activity:', error);
      throw error;
    }
  }

  async updateActivity(activityId: string, data: UpdateActivityData): Promise<ApiResponse<UserActivity>> {
    try {
      if (!activityId || activityId.trim() === '') {
        throw new Error('Activity ID is required');
      }

      const endpoint = `${this.activitiesEndpoint}/${activityId.trim()}`;

      const response = await apiClient.put<ApiResponse<UserActivity>>(endpoint, data, true);

      logger.debug('Activity updated:', {
        activityId,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error updating activity:', error);
      throw error;
    }
  }

  async deleteActivity(activityId: string): Promise<ApiResponse<null>> {
    try {
      if (!activityId || activityId.trim() === '') {
        throw new Error('Activity ID is required');
      }

      const endpoint = `${this.activitiesEndpoint}/${activityId.trim()}`;

      const response = await apiClient.delete<ApiResponse<null>>(endpoint, undefined, true);

      logger.debug('Activity deleted:', {
        activityId,
        success: response.success,
      });

      return response;
    } catch (error) {
      logger.error('Error deleting activity:', error);
      throw error;
    }
  }
}

export default new ActivityService();
