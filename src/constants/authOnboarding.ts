/**
 * Ordem das telas de onboarding (nomes das rotas no RootNavigator).
 * Ao adicionar uma tela em screens/auth: exporte o componente no index e inclua o nome da rota
 * nesta lista na posição correta do fluxo. Regras de navegação ficam em utils/auth/navigation.
 */
export const AUTH_ONBOARDING_SCREENS_ORDER = [
  'Welcome',
  'PrivacyPolicies',
  'Register',
  'Plans',
  'InterestCategories',
] as const;

export type AuthOnboardingScreenName = (typeof AUTH_ONBOARDING_SCREENS_ORDER)[number];
