import type { NavigationState } from '@react-navigation/native';
import {
  getFocusedRouteNameFromNavState,
  getRootRouteName,
  getSelectedIdFromRoute,
  isSharedCommunityPostDetailRoute,
  shouldShowFloatingMenuByRoute,
} from '../floatingMenuRoutePolicy';

type StackRoute = string | { name: string; params?: Record<string, unknown> };

/** Monta estado de stack compatível com `findFocusedRoute` nos testes. */
function makeStack(index: number, routes: StackRoute[]): NavigationState {
  const routeNames = routes.map((route) => (typeof route === 'string' ? route : route.name));
  return {
    stale: false,
    type: 'stack',
    index,
    routeNames,
    routes: routes.map((route, i) => {
      if (typeof route === 'string') {
        return { name: route, key: `${route}-${i}-key` };
      }
      return { name: route.name, key: `${route.name}-${i}-key`, params: route.params };
    }),
  } as unknown as NavigationState;
}

function makeChatRoot(nested: NavigationState | undefined): NavigationState {
  return {
    stale: false,
    type: 'stack',
    index: 0,
    routeNames: ['Chat'],
    routes: [
      {
        name: 'Chat',
        key: 'Chat-root-key',
        ...(nested != null ? { state: nested } : {}),
      },
    ],
  } as unknown as NavigationState;
}

function makeNestedRoot(rootName: string, nested: NavigationState): NavigationState {
  return {
    stale: false,
    type: 'stack',
    index: 0,
    routeNames: [rootName],
    routes: [
      {
        name: rootName,
        key: `${rootName}-root-key`,
        state: nested,
      },
    ],
  } as unknown as NavigationState;
}

describe('floatingMenuRoutePolicy', () => {
  describe('Chat stack', () => {
    it('allows menu only on ChatList (nested index 0)', () => {
      const nested = makeStack(0, ['ChatList']);
      const state = makeChatRoot(nested);
      expect(getRootRouteName(state)).toBe('Chat');
      expect(getFocusedRouteNameFromNavState(state)).toBe('ChatList');
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
    });

    it('hides menu on conversation screen (inner route name ChatConversation)', () => {
      const nested = makeStack(1, ['ChatList', 'ChatConversation']);
      const state = makeChatRoot(nested);
      expect(getFocusedRouteNameFromNavState(state)).toBe('ChatConversation');
      expect(shouldShowFloatingMenuByRoute(state)).toBe(false);
    });

    it('hides menu on ChatDetails', () => {
      const nested = makeStack(2, ['ChatList', 'ChatConversation', 'ChatDetails']);
      const state = makeChatRoot(nested);
      expect(getFocusedRouteNameFromNavState(state)).toBe('ChatDetails');
      expect(shouldShowFloatingMenuByRoute(state)).toBe(false);
    });

    it('hides menu while Chat nested state is unresolved', () => {
      const state = makeChatRoot(undefined);
      expect(getFocusedRouteNameFromNavState(state)).toBe('Chat');
      expect(shouldShowFloatingMenuByRoute(state)).toBe(false);
    });
  });

  describe('telas com menu (rota focada na folha)', () => {
    it.each(['Marketplace', 'Cart', 'ProductDetails', 'AffiliateProduct', 'Profile', 'Summary'])(
      '%s: stack de um nível permite overlay',
      (screenName) => {
        const state = makeStack(0, [screenName]);
        expect(getRootRouteName(state)).toBe(screenName);
        expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
      },
    );

    it('Marketplace: mantém overlay se a folha focada não estiver na whitelist (ex.: estado aninhado)', () => {
      const nested = makeStack(0, ['SomeNestedLeafNotInWhitelist']);
      const state = makeNestedRoot('Marketplace', nested);
      expect(getFocusedRouteNameFromNavState(state)).toBe('SomeNestedLeafNotInWhitelist');
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
    });
  });

  describe('stack Community (raiz Community + rotas internas)', () => {
    it('mostra menu na lista (CommunityList)', () => {
      const nested = makeStack(0, ['CommunityList']);
      const state = makeNestedRoot('Community', nested);
      expect(getFocusedRouteNameFromNavState(state)).toBe('CommunityList');
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
    });

    it('esconde menu em PostDetail aberto pelo feed ({ post })', () => {
      const nested = makeStack(1, ['CommunityList', { name: 'PostDetail', params: { post: { id: 'p1' } } }]);
      const state = makeNestedRoot('Community', nested);
      expect(getFocusedRouteNameFromNavState(state)).toBe('PostDetail');
      expect(isSharedCommunityPostDetailRoute(state)).toBe(false);
      expect(shouldShowFloatingMenuByRoute(state)).toBe(false);
    });

    it('mostra menu em PostDetail aberto via link compartilhado ({ postId })', () => {
      const nested = makeStack(0, [{ name: 'PostDetail', params: { postId: 'post-xyz' } }]);
      const state = makeNestedRoot('Community', nested);
      expect(getFocusedRouteNameFromNavState(state)).toBe('PostDetail');
      expect(isSharedCommunityPostDetailRoute(state)).toBe(true);
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
      expect(getSelectedIdFromRoute('PostDetail')).toBe('community');
    });
  });

  describe('telas sem menu por rota', () => {
    it('ProviderProfile permite overlay com aba marketplace selecionada', () => {
      const state = makeStack(0, ['ProviderProfile']);
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
      expect(getSelectedIdFromRoute('ProviderProfile')).toBe('marketplace');
    });

    it('Checkout permite overlay na confirmação do pedido', () => {
      const state = makeStack(0, ['Checkout']);
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
      expect(getSelectedIdFromRoute('Checkout')).toBe('marketplace');
    });

    it('ProtocolDetail permite overlay com aba profile selecionada', () => {
      const state = makeStack(0, ['ProtocolDetail']);
      expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
      expect(getSelectedIdFromRoute('ProtocolDetail')).toBe('profile');
    });

    it('fluxo de cancelamento de assinatura mantém overlay profile', () => {
      for (const routeName of [
        'ManageProtocolSubscription',
        'CancelProtocolSubscription',
        'CancelProtocolSubscriptionConfirm',
      ] as const) {
        const state = makeStack(0, [routeName]);
        expect(shouldShowFloatingMenuByRoute(state)).toBe(true);
        expect(getSelectedIdFromRoute(routeName)).toBe('profile');
      }
    });
  });

  describe('getSelectedIdFromRoute', () => {
    it('mapeia folhas usadas no pill', () => {
      expect(getSelectedIdFromRoute('ChatList')).toBe('chat');
      expect(getSelectedIdFromRoute('CommunityList')).toBe('community');
      expect(getSelectedIdFromRoute('Cart')).toBe('marketplace');
      expect(getSelectedIdFromRoute('ProtocolDetail')).toBe('profile');
      expect(getSelectedIdFromRoute('Profile')).toBe('profile');
    });
  });
});
