import {
  AFFILIATE_SHARE_PATH_PREFIX,
  COMMUNITY_POST_SHARE_PATH_PREFIX,
  COMMUNITY_SHARE_PATH_PREFIX,
  PRODUCT_SHARE_PATH_PREFIX,
  PROTOCOL_SHARE_PATH_PREFIX,
  PROVIDER_SHARE_PATH_PREFIX,
  SHARE_CONTENT_TYPES,
  SHARE_QUERY_PARAMS,
} from '@/constants/share';
import { buildShareUrl, sharePathPrefixForContentType } from '@/utils/share/buildShareUrl';

jest.mock('@/config/environment', () => ({
  SHARE_CONFIG: {
    baseUrl: 'https://app.likeme.global',
  },
}));

const BASE = 'https://app.likeme.global';

describe('buildShareUrl', () => {
  it('monta URLs por tipo de conteúdo', () => {
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.COMMUNITY_POST, postId: 'post-1' })).toBe(
      `${BASE}${COMMUNITY_POST_SHARE_PATH_PREFIX}/post-1`,
    );
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.COMMUNITY, communityId: 'comm-1' })).toBe(
      `${BASE}${COMMUNITY_SHARE_PATH_PREFIX}/comm-1`,
    );
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.PRODUCT, productId: 'prod-1' })).toBe(
      `${BASE}${PRODUCT_SHARE_PATH_PREFIX}/prod-1`,
    );
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.SERVICE, productId: 'svc-1' })).toBe(
      `${BASE}${PRODUCT_SHARE_PATH_PREFIX}/svc-1`,
    );
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.PROTOCOL, productId: 'prog-1' })).toBe(
      `${BASE}${PROTOCOL_SHARE_PATH_PREFIX}/prog-1`,
    );
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.PROVIDER, providerId: 'prov-1' })).toBe(
      `${BASE}${PROVIDER_SHARE_PATH_PREFIX}/prov-1`,
    );
  });

  it('inclui adId opcional em links de afiliado', () => {
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.AFFILIATE, productId: 'aff-1' })).toBe(
      `${BASE}${AFFILIATE_SHARE_PATH_PREFIX}/aff-1`,
    );
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.AFFILIATE, productId: 'aff-1', adId: 'ad-9' })).toBe(
      `${BASE}${AFFILIATE_SHARE_PATH_PREFIX}/aff-1?${SHARE_QUERY_PARAMS.AD_ID}=ad-9`,
    );
  });

  it('codifica segmentos da URL', () => {
    expect(buildShareUrl({ contentType: SHARE_CONTENT_TYPES.COMMUNITY_POST, postId: 'post/with/slash' })).toBe(
      `${BASE}${COMMUNITY_POST_SHARE_PATH_PREFIX}/post%2Fwith%2Fslash`,
    );
  });
});

describe('sharePathPrefixForContentType', () => {
  it('retorna prefixo alinhado ao content type', () => {
    expect(sharePathPrefixForContentType(SHARE_CONTENT_TYPES.PRODUCT)).toBe(PRODUCT_SHARE_PATH_PREFIX);
    expect(sharePathPrefixForContentType(SHARE_CONTENT_TYPES.SERVICE)).toBe(PRODUCT_SHARE_PATH_PREFIX);
    expect(sharePathPrefixForContentType(SHARE_CONTENT_TYPES.AFFILIATE)).toBe(AFFILIATE_SHARE_PATH_PREFIX);
  });
});
