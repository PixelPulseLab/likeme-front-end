import { Platform, Share } from 'react-native';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';
import { shareContent, shareInputForProduct } from '@/utils/share/shareContent';
import { shareIntroMessageForContentType } from '@/utils/share/shareIntroMessage';

jest.mock('@/utils/share/shareIntroMessage', () => ({
  shareIntroMessageForContentType: jest.fn((contentType: string) => `intro:${contentType}`),
}));

jest.mock('@/analytics', () => ({
  GA4_EVENTS: { SHARE: 'share' },
  ANALYTICS_PARAMS: {
    CONTENT_TYPE: 'content_type',
    ITEM_ID: 'item_id',
    ACTION_NAME: 'action_name',
    SUCCESS: 'success',
    SCREEN_NAME: 'screen_name',
  },
  logEvent: jest.fn(),
}));

jest.mock('@/config/environment', () => ({
  SHARE_CONFIG: { baseUrl: 'https://share.example.com' },
}));

describe('shareInputForProduct', () => {
  it('mapeia tipo de catálogo para contentType de share', () => {
    expect(shareInputForProduct({ id: 'p1', type: PRODUCT_CATALOG_TYPE.PHYSICAL })).toEqual({
      contentType: SHARE_CONTENT_TYPES.PRODUCT,
      productId: 'p1',
    });
    expect(shareInputForProduct({ id: 's1', type: PRODUCT_CATALOG_TYPE.SERVICE })).toEqual({
      contentType: SHARE_CONTENT_TYPES.SERVICE,
      productId: 's1',
    });
    expect(shareInputForProduct({ id: 'prog1', type: PRODUCT_CATALOG_TYPE.PROGRAM })).toEqual({
      contentType: SHARE_CONTENT_TYPES.PROTOCOL,
      productId: 'prog1',
    });
    expect(shareInputForProduct({ id: 'a1', type: PRODUCT_CATALOG_TYPE.AMAZON }, 'ad-1')).toEqual({
      contentType: SHARE_CONTENT_TYPES.AFFILIATE,
      productId: 'a1',
      adId: 'ad-1',
    });
  });
});

describe('shareContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
  });

  it('abre share sheet e registra analytics de início e conclusão', async () => {
    Platform.OS = 'ios';
    await shareContent(
      { contentType: SHARE_CONTENT_TYPES.COMMUNITY_POST, postId: 'post-1' },
      { screenName: 'post_details' },
    );

    expect(shareIntroMessageForContentType).toHaveBeenCalledWith(SHARE_CONTENT_TYPES.COMMUNITY_POST);
    expect(Share.share).toHaveBeenCalledWith({
      message: 'intro:community_post',
      url: 'https://share.example.com/post/post-1',
    });
    expect(logEvent).toHaveBeenNthCalledWith(1, GA4_EVENTS.SHARE, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.COMMUNITY_POST,
      [ANALYTICS_PARAMS.ITEM_ID]: 'post-1',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'share_started',
      [ANALYTICS_PARAMS.SCREEN_NAME]: 'post_details',
    });
    expect(logEvent).toHaveBeenNthCalledWith(2, GA4_EVENTS.SHARE, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.COMMUNITY_POST,
      [ANALYTICS_PARAMS.ITEM_ID]: 'post-1',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'share_completed',
      [ANALYTICS_PARAMS.SUCCESS]: true,
      [ANALYTICS_PARAMS.SCREEN_NAME]: 'post_details',
    });
  });

  it('registra share_dismissed quando usuário cancela', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });

    await shareContent({ contentType: SHARE_CONTENT_TYPES.COMMUNITY, communityId: 'comm-1' });

    expect(logEvent).toHaveBeenLastCalledWith(GA4_EVENTS.SHARE, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.COMMUNITY,
      [ANALYTICS_PARAMS.ITEM_ID]: 'comm-1',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'share_dismissed',
      [ANALYTICS_PARAMS.SUCCESS]: false,
    });
  });

  it('registra share_failed quando Share.share lança erro', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('share unavailable'));

    await shareContent({ contentType: SHARE_CONTENT_TYPES.PRODUCT, productId: 'prod-1' });

    expect(logEvent).toHaveBeenLastCalledWith(GA4_EVENTS.SHARE, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.PRODUCT,
      [ANALYTICS_PARAMS.ITEM_ID]: 'prod-1',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'share_failed',
      [ANALYTICS_PARAMS.SUCCESS]: false,
    });
  });

  it.each([
    [
      'protocolo',
      { contentType: SHARE_CONTENT_TYPES.PROTOCOL, productId: 'prog-1' },
      'https://share.example.com/protocol/prog-1',
    ],
    [
      'serviço',
      { contentType: SHARE_CONTENT_TYPES.SERVICE, productId: 'svc-1' },
      'https://share.example.com/product/svc-1',
    ],
    [
      'afiliado com adId',
      { contentType: SHARE_CONTENT_TYPES.AFFILIATE, productId: 'aff-1', adId: 'ad-9' },
      'https://share.example.com/affiliate/aff-1?adId=ad-9',
    ],
    [
      'provider',
      { contentType: SHARE_CONTENT_TYPES.PROVIDER, providerId: 'prov-1' },
      'https://share.example.com/provider/prov-1',
    ],
  ] as const)('abre share sheet para %s com mensagem e URL corretas', async (_label, input, expectedUrl) => {
    Platform.OS = 'android';
    await shareContent(input);

    expect(Share.share).toHaveBeenCalledWith({
      message: `intro:${input.contentType}\n\n${expectedUrl}`,
    });
    expect(logEvent).toHaveBeenNthCalledWith(
      1,
      GA4_EVENTS.SHARE,
      expect.objectContaining({
        [ANALYTICS_PARAMS.ACTION_NAME]: 'share_started',
      }),
    );
  });
});
