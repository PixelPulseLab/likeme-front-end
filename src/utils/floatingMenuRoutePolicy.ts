import { findFocusedRoute, type NavigationState } from '@react-navigation/native';

export const CHAT_STACK_LIST_ROUTE = 'ChatList' as const;
export const POST_DETAIL_ROUTE = 'PostDetail' as const;

export const ROUTES_SHOW_MENU = new Set<string>([
  'Home',
  'Summary',
  'Activities',
  'AvatarProgress',
  'MarkerDetails',
  'Community',
  'CommunityList',
  'Marketplace',
  'ProductDetails',
  'AffiliateProduct',
  'ProviderProfile',
  'Cart',
  'Checkout',
  'SubscriptionList',
  'ProtocolDetail',
  'ManageProtocolSubscription',
  'CancelProtocolSubscription',
  'CancelProtocolSubscriptionConfirm',
  'Profile',
  CHAT_STACK_LIST_ROUTE,
]);

export const ROUTE_TO_SELECTED_ID: Record<string, string> = {
  Home: 'home',
  Summary: 'home',
  Activities: 'activities',
  AvatarProgress: 'home',
  MarkerDetails: 'activities',
  Community: 'community',
  CommunityList: 'community',
  PostDetail: 'community',
  Chat: 'chat',
  ChatList: 'chat',
  Marketplace: 'marketplace',
  ProductDetails: 'marketplace',
  AffiliateProduct: 'marketplace',
  Cart: 'marketplace',
  Checkout: 'marketplace',
  ProviderProfile: 'marketplace',
  SubscriptionList: 'profile',
  ProtocolDetail: 'profile',
  ManageProtocolSubscription: 'profile',
  CancelProtocolSubscription: 'profile',
  CancelProtocolSubscriptionConfirm: 'profile',
  Profile: 'profile',
};

function getActiveChildRouteName(navState: NavigationState | undefined): string | undefined {
  if (!navState?.routes?.length) return undefined;
  const i = typeof navState.index === 'number' ? navState.index : 0;
  return navState.routes[i]?.name;
}

export function getChatNestedFocusedRouteName(state: NavigationState | undefined): string | undefined {
  if (!state?.routes?.length) return undefined;
  const rootIdx = typeof state.index === 'number' ? state.index : 0;
  const rootRoute = state.routes[rootIdx];
  if (rootRoute?.name !== 'Chat') return undefined;

  if (!rootRoute.state) {
    return undefined;
  }

  const nested = rootRoute.state as NavigationState;
  return findFocusedRoute(nested)?.name ?? getActiveChildRouteName(nested) ?? CHAT_STACK_LIST_ROUTE;
}

export function getFocusedRouteNameFromNavState(state: NavigationState | undefined): string | undefined {
  const chatNested = getChatNestedFocusedRouteName(state);
  if (chatNested !== undefined) {
    return chatNested;
  }
  if (!state) return undefined;
  return findFocusedRoute(state)?.name;
}

export function getRootRouteName(state: NavigationState | undefined): string | undefined {
  if (!state?.routes?.length) return undefined;
  const i = typeof state.index === 'number' ? state.index : 0;
  return state.routes[i]?.name;
}

export function isMenuAllowedByRouteName(routeName: string | undefined): boolean {
  return routeName == null || ROUTES_SHOW_MENU.has(routeName);
}

type RouteWithParams = {
  name: string;
  params?: Record<string, unknown>;
  state?: NavigationState;
};

/** Post aberto via link compartilhado (`{ postId }`); fluxo in-app usa `{ post }`. */
export function isSharedCommunityPostDetailRoute(state: NavigationState | undefined): boolean {
  if (!state?.routes?.length) {
    return false;
  }

  const rootIdx = typeof state.index === 'number' ? state.index : 0;
  const rootRoute = state.routes[rootIdx] as RouteWithParams | undefined;
  if (rootRoute?.name !== 'Community' || !rootRoute.state) {
    return false;
  }

  const focused = findFocusedRoute(rootRoute.state) as RouteWithParams | undefined;
  if (focused?.name !== POST_DETAIL_ROUTE) {
    return false;
  }

  const postId = typeof focused.params?.postId === 'string' ? focused.params.postId.trim() : '';
  if (!postId) {
    return false;
  }

  return !('post' in (focused.params ?? {}) && focused.params?.post);
}

/** Chat → só `ChatList`; Community → folha; outras rotas whitelist pelo topo do stack. */
export function shouldShowFloatingMenuByRoute(state: NavigationState | undefined): boolean {
  const focusedName = getFocusedRouteNameFromNavState(state);
  const rootName = getRootRouteName(state);

  if (rootName === 'Chat') {
    return focusedName === CHAT_STACK_LIST_ROUTE;
  }

  if (rootName === 'Community') {
    if (isSharedCommunityPostDetailRoute(state)) {
      return true;
    }
    return isMenuAllowedByRouteName(focusedName ?? rootName);
  }

  if (rootName != null && ROUTES_SHOW_MENU.has(rootName)) {
    return true;
  }

  return isMenuAllowedByRouteName(focusedName ?? rootName);
}

export function getSelectedIdFromRoute(routeName: string | undefined): string | undefined {
  if (!routeName) return undefined;
  return ROUTE_TO_SELECTED_ID[routeName];
}
