import { SHARE_CONFIG } from '@/config/environment';
import {
  AFFILIATE_SHARE_PATH_PREFIX,
  COMMUNITY_POST_SHARE_PATH_PREFIX,
  COMMUNITY_SHARE_PATH_PREFIX,
  PRODUCT_SHARE_PATH_PREFIX,
  PROTOCOL_SHARE_PATH_PREFIX,
  PROVIDER_SHARE_PATH_PREFIX,
  SHARE_CONTENT_TYPES,
  SHARE_QUERY_PARAMS,
  SUBSCRIPTION_SHARE_PATH_PREFIX,
  type ShareContentType,
} from '@/constants/share';

export type BuildShareUrlInput =
  | { contentType: typeof SHARE_CONTENT_TYPES.COMMUNITY_POST; postId: string }
  | { contentType: typeof SHARE_CONTENT_TYPES.COMMUNITY; communityId: string }
  | { contentType: typeof SHARE_CONTENT_TYPES.PRODUCT; productId: string }
  | { contentType: typeof SHARE_CONTENT_TYPES.SERVICE; productId: string }
  | { contentType: typeof SHARE_CONTENT_TYPES.PROTOCOL; productId: string }
  | { contentType: typeof SHARE_CONTENT_TYPES.AFFILIATE; productId: string; adId?: string }
  | { contentType: typeof SHARE_CONTENT_TYPES.PROVIDER; providerId: string };

function encodeSharePathSegment(id: string): string {
  return encodeURIComponent(id.trim());
}

function shareBaseUrl(): string {
  return SHARE_CONFIG.baseUrl.replace(/\/+$/, '');
}

export function buildShareUrl(input: BuildShareUrlInput): string {
  const base = shareBaseUrl();

  switch (input.contentType) {
    case SHARE_CONTENT_TYPES.COMMUNITY_POST:
      return `${base}${COMMUNITY_POST_SHARE_PATH_PREFIX}/${encodeSharePathSegment(input.postId)}`;
    case SHARE_CONTENT_TYPES.COMMUNITY:
      return `${base}${COMMUNITY_SHARE_PATH_PREFIX}/${encodeSharePathSegment(input.communityId)}`;
    case SHARE_CONTENT_TYPES.PRODUCT:
    case SHARE_CONTENT_TYPES.SERVICE:
      return `${base}${PRODUCT_SHARE_PATH_PREFIX}/${encodeSharePathSegment(input.productId)}`;
    case SHARE_CONTENT_TYPES.PROTOCOL:
      return `${base}${PROTOCOL_SHARE_PATH_PREFIX}/${encodeSharePathSegment(input.productId)}`;
    case SHARE_CONTENT_TYPES.AFFILIATE: {
      const url = `${base}${AFFILIATE_SHARE_PATH_PREFIX}/${encodeSharePathSegment(input.productId)}`;
      const adId = input.adId?.trim();
      return adId ? `${url}?${SHARE_QUERY_PARAMS.AD_ID}=${encodeURIComponent(adId)}` : url;
    }
    case SHARE_CONTENT_TYPES.PROVIDER:
      return `${base}${PROVIDER_SHARE_PATH_PREFIX}/${encodeSharePathSegment(input.providerId)}`;
    default: {
      const exhaustiveCheck: never = input;
      throw new Error(
        `buildShareUrl: contentType não suportado: ${(exhaustiveCheck as BuildShareUrlInput).contentType}`,
      );
    }
  }
}

export function sharePathPrefixForContentType(contentType: ShareContentType): string {
  switch (contentType) {
    case SHARE_CONTENT_TYPES.COMMUNITY_POST:
      return COMMUNITY_POST_SHARE_PATH_PREFIX;
    case SHARE_CONTENT_TYPES.COMMUNITY:
      return COMMUNITY_SHARE_PATH_PREFIX;
    case SHARE_CONTENT_TYPES.PRODUCT:
    case SHARE_CONTENT_TYPES.SERVICE:
      return PRODUCT_SHARE_PATH_PREFIX;
    case SHARE_CONTENT_TYPES.PROTOCOL:
      return PROTOCOL_SHARE_PATH_PREFIX;
    case SHARE_CONTENT_TYPES.AFFILIATE:
      return AFFILIATE_SHARE_PATH_PREFIX;
    case SHARE_CONTENT_TYPES.PROVIDER:
      return PROVIDER_SHARE_PATH_PREFIX;
    case SHARE_CONTENT_TYPES.SUBSCRIPTION:
      return SUBSCRIPTION_SHARE_PATH_PREFIX;
    default: {
      const exhaustiveCheck: never = contentType;
      throw new Error(`sharePathPrefixForContentType: contentType não suportado: ${exhaustiveCheck}`);
    }
  }
}
