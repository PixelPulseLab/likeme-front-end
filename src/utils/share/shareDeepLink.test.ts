import { CommonActions } from '@react-navigation/native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { SHARE_CONTENT_TYPES, SHARE_DEEP_LINK_HOME_SCREEN } from '@/constants/share';
import type { RootStackParamList } from '@/types/navigation';
import { consumePendingDeepLinkNavigation } from '@/utils/navigation/pendingDeepLinkNavigation';
import { shareEntityIdFromPath, sharePathFromUrl } from '@/utils/share/sharePath';
import {
  flushPendingDeepLinkNavigation,
  openDeepLinkTarget,
  shareDeepLinkTargetFromUrl,
} from '@/utils/share/shareDeepLink';

jest.mock('@/analytics', () => ({
  GA4_EVENTS: { SELECT_CONTENT: 'select_content' },
  ANALYTICS_PARAMS: {
    CONTENT_TYPE: 'content_type',
    ITEM_ID: 'item_id',
    ACTION_NAME: 'action_name',
  },
  logEvent: jest.fn(),
}));

jest.mock('@/config/environment', () => ({
  SHARE_CONFIG: {
    baseUrl: 'https://likeme-back-end-one.vercel.app',
  },
}));

jest.mock('@/services/auth/storageService', () => ({
  __esModule: true,
  default: {
    getToken: jest.fn().mockResolvedValue('session-token'),
  },
}));

import storageService from '@/services/auth/storageService';

function shareContentResetAction(screen: string, params?: unknown) {
  return CommonActions.reset({
    index: 1,
    routes: [{ name: SHARE_DEEP_LINK_HOME_SCREEN }, { name: screen, params }],
  });
}

const POST_TARGET = {
  screen: 'Community',
  params: {
    screen: 'PostDetail',
    params: { postId: 'post-xyz' },
  },
} as const;

const COMMUNITY_TARGET = {
  screen: 'Community',
  params: {
    screen: 'CommunityList',
    params: { focusCommunityId: 'community-abc' },
  },
} as const;

const PRODUCT_TARGET = {
  screen: 'ProductDetails',
  params: { productId: 'prod-1' },
} as const;

const PROTOCOL_TARGET = {
  screen: 'ProtocolDetail',
  params: { productId: 'prog-1' },
} as const;

const AFFILIATE_TARGET = {
  screen: 'AffiliateProduct',
  params: { productId: 'aff-1', adId: 'ad-9' },
} as const;

const PROVIDER_TARGET = {
  screen: 'ProviderProfile',
  params: { providerId: 'prov-1' },
} as const;

const HOME_TARGET = { screen: 'Summary' } as const;

const SHARE_BASE_URL = 'https://likeme-back-end-one.vercel.app';

function createNavigationRef(isReady = true) {
  return {
    isReady: () => isReady,
    dispatch: jest.fn(),
  } as unknown as NavigationContainerRefWithCurrent<RootStackParamList>;
}

describe('sharePathFromUrl', () => {
  it('extrai pathname de URL https', () => {
    expect(sharePathFromUrl('https://likeme-back-end-one.vercel.app/post/post-xyz')).toBe('/post/post-xyz');
  });

  it('aceita path sem scheme', () => {
    expect(sharePathFromUrl('/post/post-abc')).toBe('/post/post-abc');
  });

  it('extrai pathname de likeme:// e ignora URLs vazias', () => {
    expect(sharePathFromUrl('likeme://post/abc123')).toBe('/post/abc123');
    expect(sharePathFromUrl('   ')).toBeNull();
  });

  it('preserva query string em path https', () => {
    expect(sharePathFromUrl('https://likeme-back-end-one.vercel.app/affiliate/prod-1?ref=abc')).toBe(
      '/affiliate/prod-1?ref=abc',
    );
  });
});

describe('shareEntityIdFromPath', () => {
  it('extrai id de path com ou sem barra inicial', () => {
    expect(shareEntityIdFromPath('/post/post-xyz', '/post')).toBe('post-xyz');
    expect(shareEntityIdFromPath('post/post-xyz', '/post')).toBe('post-xyz');
  });

  it('decodifica id na URL', () => {
    expect(shareEntityIdFromPath('/post/post%2Fwith%2Fslash', '/post')).toBe('post/with/slash');
  });

  it('ignora paths desconhecidos', () => {
    expect(shareEntityIdFromPath('/legacy/abc', '/post')).toBeNull();
    expect(shareEntityIdFromPath('/post/', '/post')).toBeNull();
  });
});

describe('shareDeepLinkTargetFromUrl', () => {
  it('resolve rotas de conteúdo via Universal Link', () => {
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/post/post-xyz`)).toEqual(POST_TARGET);
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/community/community-abc`)).toEqual(COMMUNITY_TARGET);
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/product/prod-1`)).toEqual(PRODUCT_TARGET);
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/protocol/prog-1`)).toEqual(PROTOCOL_TARGET);
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/affiliate/aff-1?adId=ad-9`)).toEqual(AFFILIATE_TARGET);
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/provider/prov-1`)).toEqual(PROVIDER_TARGET);
  });

  it('resolve rotas via custom scheme likeme://', () => {
    expect(shareDeepLinkTargetFromUrl('likeme://post/abc123')).toEqual({
      screen: 'Community',
      params: {
        screen: 'PostDetail',
        params: { postId: 'abc123' },
      },
    });
    expect(shareDeepLinkTargetFromUrl('likeme://affiliate/aff-1?adId=ad-9')).toEqual(AFFILIATE_TARGET);
  });

  it('retorna null para paths desconhecidos', () => {
    expect(shareDeepLinkTargetFromUrl(`${SHARE_BASE_URL}/legacy/abc`)).toBeNull();
  });
});

describe('openDeepLinkTarget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consumePendingDeepLinkNavigation();
    (storageService.getToken as jest.Mock).mockResolvedValue('session-token');
  });

  it('navega para post quando app está pronto', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Main');

    expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.COMMUNITY_POST,
      [ANALYTICS_PARAMS.ITEM_ID]: 'post-xyz',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_open',
    });
    expect(navigationRef.dispatch).toHaveBeenCalledWith(shareContentResetAction('Community', POST_TARGET.params));
    expect(consumePendingDeepLinkNavigation()).toBeNull();
  });

  it('limpa destino pendente ao navegar com sessão ativa', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/product/prod-1`, 'Loading');
    expect(consumePendingDeepLinkNavigation()).toEqual(PRODUCT_TARGET);

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/product/prod-1`, 'Summary');

    expect(consumePendingDeepLinkNavigation()).toBeNull();
  });

  it('navega para produto quando app está pronto', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/product/prod-1`, 'Main');

    expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.PRODUCT,
      [ANALYTICS_PARAMS.ITEM_ID]: 'prod-1',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_open',
    });
    expect(navigationRef.dispatch).toHaveBeenCalledWith(
      shareContentResetAction('ProductDetails', PRODUCT_TARGET.params),
    );
  });

  it('navega para feed da comunidade quando app está pronto', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/community/community-abc`, 'Main');

    expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.COMMUNITY,
      [ANALYTICS_PARAMS.ITEM_ID]: 'community-abc',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_open',
    });
    expect(navigationRef.dispatch).toHaveBeenCalledWith(shareContentResetAction('Community', COMMUNITY_TARGET.params));
  });

  it('navega para protocolo, afiliado e provider quando app está pronto', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/protocol/prog-1`, 'Main');
    expect(navigationRef.dispatch).toHaveBeenLastCalledWith(
      shareContentResetAction('ProtocolDetail', PROTOCOL_TARGET.params),
    );

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/affiliate/aff-1?adId=ad-9`, 'Main');
    expect(navigationRef.dispatch).toHaveBeenLastCalledWith(
      shareContentResetAction('AffiliateProduct', AFFILIATE_TARGET.params),
    );

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/provider/prov-1`, 'Main');
    expect(navigationRef.dispatch).toHaveBeenLastCalledWith(
      shareContentResetAction('ProviderProfile', PROVIDER_TARGET.params),
    );
  });

  it('enfileira destino enquanto rota de bootstrap está ativa', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Loading');

    expect(navigationRef.dispatch).not.toHaveBeenCalled();
    expect(consumePendingDeepLinkNavigation()).toEqual(POST_TARGET);
  });

  it('ignora URL inválida, outro host ou navigation não pronta', async () => {
    const navigationRef = createNavigationRef(false);

    await openDeepLinkTarget(navigationRef, 'https://example.com/product/1', 'Main');
    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Main');

    expect(logEvent).not.toHaveBeenCalled();
    expect(navigationRef.dispatch).not.toHaveBeenCalled();
  });

  it('redireciona para Summary quando path do domínio de share é desconhecido', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/legacy/abc`, 'Main');

    expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: 'unknown',
      [ANALYTICS_PARAMS.ITEM_ID]: '/legacy/abc',
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_fallback_home',
    });
    expect(navigationRef.dispatch).toHaveBeenCalledWith(
      CommonActions.navigate({
        name: 'Summary',
      }),
    );
  });

  it('enfileira Summary como fallback enquanto bootstrap está ativo', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/unknown/path`, 'Loading');

    expect(navigationRef.dispatch).not.toHaveBeenCalled();
    expect(consumePendingDeepLinkNavigation()).toEqual(HOME_TARGET);
  });

  it('enfileira destino e redireciona para login sem sessão', async () => {
    (storageService.getToken as jest.Mock).mockResolvedValue(null);
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Summary');

    expect(navigationRef.dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Unauthenticated' }],
      }),
    );
    expect(consumePendingDeepLinkNavigation()).toEqual(POST_TARGET);
  });

  it('não redireciona para login duplicado quando já está em Unauthenticated', async () => {
    (storageService.getToken as jest.Mock).mockResolvedValue(null);
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Unauthenticated');

    expect(navigationRef.dispatch).not.toHaveBeenCalled();
    expect(consumePendingDeepLinkNavigation()).toEqual(POST_TARGET);
  });
});

describe('flushPendingDeepLinkNavigation', () => {
  beforeEach(() => {
    consumePendingDeepLinkNavigation();
    (storageService.getToken as jest.Mock).mockResolvedValue('session-token');
  });

  it('navega quando há destino pendente e rota permite', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Loading');

    await flushPendingDeepLinkNavigation(navigationRef, 'Main');

    expect(navigationRef.dispatch).toHaveBeenCalledWith(shareContentResetAction('Community', POST_TARGET.params));
    expect(consumePendingDeepLinkNavigation()).toBeNull();
  });

  it('não navega enquanto rota ainda bloqueia deep link', async () => {
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Loading');

    await flushPendingDeepLinkNavigation(navigationRef, 'Loading');

    expect(navigationRef.dispatch).not.toHaveBeenCalled();
    expect(consumePendingDeepLinkNavigation()).toEqual(POST_TARGET);
  });

  it('redireciona para login e mantém destino pendente sem sessão', async () => {
    (storageService.getToken as jest.Mock).mockResolvedValue(null);
    const navigationRef = createNavigationRef();

    await openDeepLinkTarget(navigationRef, `${SHARE_BASE_URL}/post/post-xyz`, 'Loading');
    await flushPendingDeepLinkNavigation(navigationRef, 'Summary');

    expect(navigationRef.dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Unauthenticated' }],
      }),
    );
    expect(consumePendingDeepLinkNavigation()).toEqual(POST_TARGET);
  });
});
