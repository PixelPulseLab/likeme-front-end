import { Share } from 'react-native';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import { PRODUCT_CATALOG_TYPE, isProgramCatalogType } from '@/types/product';
import { logger } from '@/utils/logger';
import { buildShareUrl, type BuildShareUrlInput } from '@/utils/share/buildShareUrl';

export type ShareContentOptions = {
  screenName?: string;
};

function shareItemIdFromInput(input: BuildShareUrlInput): string {
  switch (input.contentType) {
    case SHARE_CONTENT_TYPES.COMMUNITY_POST:
      return input.postId;
    case SHARE_CONTENT_TYPES.COMMUNITY:
      return input.communityId;
    case SHARE_CONTENT_TYPES.PRODUCT:
    case SHARE_CONTENT_TYPES.SERVICE:
    case SHARE_CONTENT_TYPES.PROTOCOL:
    case SHARE_CONTENT_TYPES.AFFILIATE:
      return input.productId;
    case SHARE_CONTENT_TYPES.PROVIDER:
      return input.providerId;
    default: {
      const exhaustiveCheck: never = input;
      return (exhaustiveCheck as BuildShareUrlInput).contentType;
    }
  }
}

export function shareInputForProduct(product: { id: string; type?: string | null }, adId?: string): BuildShareUrlInput {
  const productId = product.id;
  const catalogType = product.type;

  if (catalogType === PRODUCT_CATALOG_TYPE.SERVICE) {
    return { contentType: SHARE_CONTENT_TYPES.SERVICE, productId };
  }
  if (isProgramCatalogType(catalogType)) {
    return { contentType: SHARE_CONTENT_TYPES.PROTOCOL, productId };
  }
  if (catalogType === PRODUCT_CATALOG_TYPE.AMAZON) {
    return { contentType: SHARE_CONTENT_TYPES.AFFILIATE, productId, adId };
  }
  return { contentType: SHARE_CONTENT_TYPES.PRODUCT, productId };
}

function logShareEvent(
  input: BuildShareUrlInput,
  actionName: 'share_started' | 'share_completed' | 'share_dismissed' | 'share_failed',
  options: ShareContentOptions | undefined,
  success?: boolean,
): void {
  logEvent(GA4_EVENTS.SHARE, {
    [ANALYTICS_PARAMS.CONTENT_TYPE]: input.contentType,
    [ANALYTICS_PARAMS.ITEM_ID]: shareItemIdFromInput(input),
    [ANALYTICS_PARAMS.ACTION_NAME]: actionName,
    ...(success !== undefined && { [ANALYTICS_PARAMS.SUCCESS]: success }),
    ...(options?.screenName && { [ANALYTICS_PARAMS.SCREEN_NAME]: options.screenName }),
  });
}

export async function shareContent(input: BuildShareUrlInput, options?: ShareContentOptions): Promise<void> {
  const url = buildShareUrl(input);
  logShareEvent(input, 'share_started', options);

  try {
    const result = await Share.share({ url, message: url });
    const completed = result.action === Share.sharedAction;
    logShareEvent(input, completed ? 'share_completed' : 'share_dismissed', options, completed);
  } catch (error) {
    logger.warn('[shareContent] Share cancelado ou falhou', {
      contentType: input.contentType,
      itemId: shareItemIdFromInput(input),
      cause: error,
    });
    logShareEvent(input, 'share_failed', options, false);
  }
}
