import i18n from '@/i18n';
import { SHARE_CONTENT_TYPES, type ShareContentType } from '@/constants/share';

const SHARE_MESSAGE_I18N_KEY = 'share.message';

const SHARE_TYPE_I18N_KEY_BY_CONTENT_TYPE: Record<ShareContentType, string> = {
  [SHARE_CONTENT_TYPES.COMMUNITY_POST]: 'share.type.communityPost',
  [SHARE_CONTENT_TYPES.COMMUNITY]: 'share.type.community',
  [SHARE_CONTENT_TYPES.PROTOCOL]: 'share.type.protocol',
  [SHARE_CONTENT_TYPES.PRODUCT]: 'share.type.product',
  [SHARE_CONTENT_TYPES.SERVICE]: 'share.type.service',
  [SHARE_CONTENT_TYPES.PROVIDER]: 'share.type.provider',
  [SHARE_CONTENT_TYPES.AFFILIATE]: 'share.type.affiliateProduct',
};

export function shareContentTypePhrase(contentType: ShareContentType): string {
  return i18n.t(SHARE_TYPE_I18N_KEY_BY_CONTENT_TYPE[contentType]);
}

export function shareIntroMessageForContentType(contentType: ShareContentType): string {
  const typePhrase = shareContentTypePhrase(contentType);
  return i18n.t(SHARE_MESSAGE_I18N_KEY, { type: typePhrase });
}
