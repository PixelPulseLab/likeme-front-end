import apiClient from '../infrastructure/apiClient';
import { logger } from '@/utils/logger';
import type { ApiResponse } from '@/types/infrastructure';

export type LinkAdvertiserAffiliateResponse = ApiResponse<{
  advertiserAffiliate: {
    id: string;
    advertiserId: string;
    userId: string;
    affiliateCodeUsed: string;
    status: string;
  };
}>;

class AdvertiserAffiliateService {
  private readonly endpoint = '/api/users/me/advertiser-affiliate';

  async linkByAffiliateCode(affiliateCode: string): Promise<LinkAdvertiserAffiliateResponse> {
    const normalized = affiliateCode.trim().toUpperCase();
    if (!normalized) {
      throw new Error('Código de afiliado inválido');
    }

    try {
      const response = await apiClient.post<LinkAdvertiserAffiliateResponse>(
        this.endpoint,
        { affiliateCode: normalized },
        true,
      );

      logger.debug('Advertiser affiliate link response:', {
        success: response.success,
        affiliateCodeUsed: response.data?.advertiserAffiliate?.affiliateCodeUsed,
      });

      return response;
    } catch (error) {
      logger.error('Error linking advertiser affiliate by code:', error);
      throw error;
    }
  }
}

export default new AdvertiserAffiliateService();
