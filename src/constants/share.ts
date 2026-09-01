export const COMMUNITY_POST_SHARE_PATH_PREFIX = '/post';
export const COMMUNITY_SHARE_PATH_PREFIX = '/community';
export const PRODUCT_SHARE_PATH_PREFIX = '/product';
export const PROTOCOL_SHARE_PATH_PREFIX = '/protocol';
export const AFFILIATE_SHARE_PATH_PREFIX = '/affiliate';
export const PROVIDER_SHARE_PATH_PREFIX = '/provider';
export const SUBSCRIPTION_SHARE_PATH_PREFIX = '/subscription';
export const SUBSCRIPTION_PAYMENT_PATH_SEGMENT = 'payment';

export const SHARE_CONTENT_PATH_PREFIXES = [
  COMMUNITY_POST_SHARE_PATH_PREFIX,
  COMMUNITY_SHARE_PATH_PREFIX,
  PRODUCT_SHARE_PATH_PREFIX,
  PROTOCOL_SHARE_PATH_PREFIX,
  AFFILIATE_SHARE_PATH_PREFIX,
  PROVIDER_SHARE_PATH_PREFIX,
  SUBSCRIPTION_SHARE_PATH_PREFIX,
] as const;

export const SHARE_CONTENT_TYPES = {
  COMMUNITY_POST: 'community_post',
  COMMUNITY: 'community',
  PRODUCT: 'product',
  SERVICE: 'service',
  PROTOCOL: 'protocol',
  AFFILIATE: 'affiliate_product',
  PROVIDER: 'provider',
  SUBSCRIPTION: 'subscription',
} as const;

export type ShareContentType = (typeof SHARE_CONTENT_TYPES)[keyof typeof SHARE_CONTENT_TYPES];

/** Tela principal do app após onboarding (HomeScreen redireciona para Summary). */
export const SHARE_DEEP_LINK_HOME_SCREEN = 'Summary' as const;

export const SHARE_QUERY_PARAMS = {
  AD_ID: 'adId',
} as const;
