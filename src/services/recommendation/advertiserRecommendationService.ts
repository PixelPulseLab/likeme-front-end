import apiClient from '@/services/infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type { AdvertiserRecommendationTargetType } from '@/constants/recommendation/advertiserRecommendationTargetType';
import type { ListAdvertiserRecommendationsResponse } from '@/types/recommendation/advertiserRecommendation';

class AdvertiserRecommendationService {
  private readonly endpoint = '/api/recommendations';

  async list(params: {
    targetType: AdvertiserRecommendationTargetType;
    targetId: string;
    page?: number;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<ListAdvertiserRecommendationsResponse> {
    try {
      const targetId = params.targetId.trim();
      if (!targetId) {
        throw new Error('targetId is required');
      }

      const queryParams: Record<string, string> = {
        targetType: params.targetType,
        targetId,
        activeOnly: params.activeOnly === false ? 'false' : 'true',
      };
      if (params.page != null) {
        queryParams.page = String(params.page);
      }
      if (params.limit != null) {
        queryParams.limit = String(params.limit);
      }

      const response = await apiClient.get<ListAdvertiserRecommendationsResponse>(
        this.endpoint,
        queryParams,
        true,
        false,
      );

      logger.debug('Advertiser recommendations list:', {
        targetType: params.targetType,
        targetId,
        count: response.data?.recommendations?.length ?? 0,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching advertiser recommendations:', {
        targetType: params.targetType,
        targetId: params.targetId,
        error,
      });
      throw error;
    }
  }
}

export const advertiserRecommendationService = new AdvertiserRecommendationService();
export default advertiserRecommendationService;
