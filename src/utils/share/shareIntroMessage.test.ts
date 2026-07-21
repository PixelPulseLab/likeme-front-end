import { SHARE_CONTENT_TYPES } from '@/constants/share';
import { shareContentTypePhrase, shareIntroMessageForContentType } from '@/utils/share/shareIntroMessage';

const SHARE_TYPE_LABELS: Record<string, string> = {
  'share.type.communityPost': 'esse post',
  'share.type.community': 'essa comunidade',
  'share.type.protocol': 'esse protocolo',
  'share.type.product': 'esse produto',
  'share.type.service': 'esse serviço',
  'share.type.provider': 'esse profissional',
  'share.type.affiliateProduct': 'esse produto',
};

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string, options?: { type?: string }) => {
      if (key === 'share.message' && options?.type) {
        return `Vi ${options.type} no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.`;
      }
      return SHARE_TYPE_LABELS[key] ?? key;
    },
  },
}));

describe('shareContentTypePhrase', () => {
  it.each([
    [SHARE_CONTENT_TYPES.COMMUNITY_POST, 'esse post'],
    [SHARE_CONTENT_TYPES.COMMUNITY, 'essa comunidade'],
    [SHARE_CONTENT_TYPES.PROTOCOL, 'esse protocolo'],
    [SHARE_CONTENT_TYPES.PRODUCT, 'esse produto'],
    [SHARE_CONTENT_TYPES.SERVICE, 'esse serviço'],
    [SHARE_CONTENT_TYPES.PROVIDER, 'esse profissional'],
    [SHARE_CONTENT_TYPES.AFFILIATE, 'esse produto'],
  ])('retorna frase do tipo para %s', (contentType, expected) => {
    expect(shareContentTypePhrase(contentType)).toBe(expected);
  });
});

describe('shareIntroMessageForContentType', () => {
  it.each([
    [
      SHARE_CONTENT_TYPES.COMMUNITY_POST,
      'Vi esse post no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
    [
      SHARE_CONTENT_TYPES.COMMUNITY,
      'Vi essa comunidade no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
    [
      SHARE_CONTENT_TYPES.PROTOCOL,
      'Vi esse protocolo no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
    [
      SHARE_CONTENT_TYPES.PRODUCT,
      'Vi esse produto no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
    [
      SHARE_CONTENT_TYPES.SERVICE,
      'Vi esse serviço no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
    [
      SHARE_CONTENT_TYPES.PROVIDER,
      'Vi esse profissional no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
    [
      SHARE_CONTENT_TYPES.AFFILIATE,
      'Vi esse produto no Like:Me e lembrei de você. Se ainda não tiver o app, baixe gratuitamente na loja.',
    ],
  ])('monta mensagem com type para %s', (contentType, expected) => {
    expect(shareIntroMessageForContentType(contentType)).toBe(expected);
  });
});
