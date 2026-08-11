import apiClient from '@/services/infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type { AdvertiserRecommendationTargetType } from '@/constants/recommendation/advertiserRecommendationTargetType';
import type { ListAdvertiserRecommendationsResponse } from '@/types/recommendation/advertiserRecommendation';

class AdvertiserRecommendationService {
  private readonly endpoint = '/api/recommendations';

  async list(params: {
    targetType: AdvertiserRecommendationTargetType;
    targetId?: string;
    advertiserId?: string;
    page?: number;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<ListAdvertiserRecommendationsResponse> {
    try {
      const targetId = params.targetId?.trim() || '';
      const advertiserId = params.advertiserId?.trim() || '';
      if (!targetId && !advertiserId) {
        throw new Error('targetId ou advertiserId é obrigatório');
      }

      const queryParams: Record<string, string> = {
        targetType: params.targetType,
        activeOnly: params.activeOnly === false ? 'false' : 'true',
      };
      if (targetId) {
        queryParams.targetId = targetId;
      }
      if (advertiserId) {
        queryParams.advertiserId = advertiserId;
      }
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
        targetId: targetId || undefined,
        advertiserId: advertiserId || undefined,
        count: response.data?.recommendations?.length ?? 0,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching advertiser recommendations:', {
        targetType: params.targetType,
        targetId: params.targetId,
        advertiserId: params.advertiserId,
        error,
      });
      throw error;
    }
  }
}

export const advertiserRecommendationService = new AdvertiserRecommendationService();
export default advertiserRecommendationService;
