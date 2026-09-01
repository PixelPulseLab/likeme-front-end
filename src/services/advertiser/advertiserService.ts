import apiClient from '../infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type {
  GetAdvertiserApiResponse,
  ListAdvertisersApiResponse,
  ListAdvertiserProfilesApiResponse,
} from '@/types/ad';

class AdvertiserService {
  private readonly advertisersEndpoint = '/api/advertisers';

  async getAdvertisers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    communityId?: string;
    search?: string;
    categoryId?: string;
  }): Promise<ListAdvertisersApiResponse> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.page != null) queryParams.page = String(params.page);
      if (params?.limit != null) queryParams.limit = String(params.limit);
      if (params?.status) queryParams.status = params.status;
      if (params?.type) queryParams.type = params.type;
      if (params?.communityId) queryParams.communityId = params.communityId;
      const trimmedSearch = params?.search?.trim();
      if (trimmedSearch) queryParams.search = trimmedSearch;
      const trimmedCategoryId = params?.categoryId?.trim();
      if (trimmedCategoryId) queryParams.categoryId = trimmedCategoryId;

      const response = await apiClient.get<ListAdvertisersApiResponse>(
        this.advertisersEndpoint,
        queryParams,
        true,
        false,
      );

      logger.debug('Advertisers list response:', {
        success: response.success,
        count: response.data?.advertisers?.length ?? 0,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching advertisers list:', error);
      throw error;
    }
  }

  async getAdvertiserById(advertiserId: string): Promise<GetAdvertiserApiResponse> {
    try {
      if (!advertiserId || advertiserId.trim() === '') {
        throw new Error('Advertiser ID is required');
      }

      const endpoint = `${this.advertisersEndpoint}/${advertiserId.trim()}`;

      const response = await apiClient.get<GetAdvertiserApiResponse>(endpoint, undefined, true, false);

      logger.debug('Advertiser detail response:', {
        advertiserId,
        success: response.success,
        hasData: !!response.data,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching advertiser detail:', error);
      throw error;
    }
  }

  async getAdvertiserProfiles(advertiserId: string, locale = 'pt-BR'): Promise<ListAdvertiserProfilesApiResponse> {
    try {
      if (!advertiserId || advertiserId.trim() === '') {
        throw new Error('Advertiser ID is required');
      }

      const endpoint = `${this.advertisersEndpoint}/${advertiserId.trim()}/profiles`;

      const response = await apiClient.get<ListAdvertiserProfilesApiResponse>(endpoint, { locale }, true, false);

      logger.debug('Advertiser profiles response:', {
        advertiserId,
        success: response.success,
        count: response.data?.profiles?.length ?? 0,
      });

      return response;
    } catch (error) {
      logger.error('Error fetching advertiser profiles:', error);
      throw error;
    }
  }
}

export default new AdvertiserService();
