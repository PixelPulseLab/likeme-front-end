import {
  canNavigateFromDeepLink,
  consumePendingDeepLinkNavigation,
  setPendingDeepLinkNavigation,
} from '@/utils/navigation/pendingDeepLinkNavigation';

describe('canNavigateFromDeepLink', () => {
  it('bloqueia rotas de bootstrap e auth', () => {
    expect(canNavigateFromDeepLink(undefined)).toBe(false);
    expect(canNavigateFromDeepLink('Loading')).toBe(false);
    expect(canNavigateFromDeepLink('Unauthenticated')).toBe(false);
    expect(canNavigateFromDeepLink('InvitationCode')).toBe(false);
    expect(canNavigateFromDeepLink('Authenticated')).toBe(false);
    expect(canNavigateFromDeepLink('ForcedUpdate')).toBe(false);
    expect(canNavigateFromDeepLink('AppLoading')).toBe(false);
  });

  it('permite rotas do app já montado', () => {
    expect(canNavigateFromDeepLink('Main')).toBe(true);
    expect(canNavigateFromDeepLink('Community')).toBe(true);
  });
});

describe('pendingDeepLinkNavigation queue', () => {
  afterEach(() => {
    consumePendingDeepLinkNavigation();
  });

  it('armazena e consome destino uma única vez', () => {
    const target = {
      screen: 'Community' as const,
      params: {
        screen: 'PostDetail' as const,
        params: { postId: 'post-1' },
      },
    };

    setPendingDeepLinkNavigation(target);
    expect(consumePendingDeepLinkNavigation()).toEqual(target);
    expect(consumePendingDeepLinkNavigation()).toBeNull();
  });
});
