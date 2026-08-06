import type { AdvertiserRecommendationTargetType } from '@/constants/recommendation/advertiserRecommendationTargetType';

export type AdvertiserRecommendation = {
  id: string;
  recommendedBy: string;
  advertiserId: string | null;
  targetType: AdvertiserRecommendationTargetType | string;
  targetId: string;
  status: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListAdvertiserRecommendationsResponse = {
  success: boolean;
  message?: string;
  data?: {
    recommendations: AdvertiserRecommendation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type AdvertiserRecommenderPreview = {
  id: string;
  advertiserId: string;
  name: string;
  avatar?: string;
  specialty?: string;
};
