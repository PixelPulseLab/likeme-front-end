export const ADVERTISER_RECOMMENDATION_TARGET_TYPE = {
  product: 'product',
  community: 'community',
  advertiser: 'advertiser',
} as const;

export type AdvertiserRecommendationTargetType =
  (typeof ADVERTISER_RECOMMENDATION_TARGET_TYPE)[keyof typeof ADVERTISER_RECOMMENDATION_TARGET_TYPE];
