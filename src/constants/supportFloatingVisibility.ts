/**
 * Rotas raiz do `RootNavigator` em que o botão flutuante de suporte pode aparecer
 * (fluxo pós-onboarding, a partir de `Home`).
 */
export const SUPPORT_FLOATING_MAIN_APP_ROOT_ROUTE_NAMES = [
  'Home',
  'Summary',
  'Activities',
  'Community',
  'Chat',
  'Marketplace',
  'ProductDetails',
  'AffiliateProduct',
  'Cart',
  'Checkout',
  'ProviderProfile',
  'ProductRecommenders',
  'SubscriptionList',
  'Profile',
  'AvatarProgress',
  'MarkerDetails',
] as const;

const SUPPORT_FLOATING_MAIN_APP_ROUTE_NAME_SET = new Set<string>(SUPPORT_FLOATING_MAIN_APP_ROOT_ROUTE_NAMES);

export function isRouteNameEligibleForSupportFloating(routeName: string | undefined): boolean {
  if (routeName == null || routeName.length === 0) {
    return false;
  }
  return SUPPORT_FLOATING_MAIN_APP_ROUTE_NAME_SET.has(routeName);
}
