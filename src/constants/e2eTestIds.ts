/** testIDs estáveis para Maestro — não dependem de copy i18n. */
export const E2E_TEST_IDS = {
  UNAUTH_LOGIN: 'e2e.unauth.login',
  UNAUTH_E2E_CONTINUE: 'e2e.unauth.e2eContinue',
  WELCOME_NAME_INPUT: 'e2e.welcome.nameInput',
  WELCOME_NEXT: 'e2e.welcome.next',
  FLOATING_MENU_HOME: 'e2e.nav.home',
  FLOATING_MENU_PREFIX: 'e2e.nav.',
  PROFILE_MENU_PREFIX: 'e2e.profileMenu.',
  PROFILE_MENU_LOGOUT: 'e2e.profileMenu.logout',
  HEADER_PROFILE_MENU: 'e2e.header.profileMenu',
  HEADER_CART: 'e2e.header.cart',
  SUMMARY_SCREEN: 'e2e.summary.root',
  ACTIVITIES_SCREEN: 'e2e.activities.root',
  COMMUNITY_SCREEN: 'e2e.community.root',
  MARKETPLACE_SCREEN: 'e2e.marketplace.root',
  PRODUCT_CARD_PREFIX: 'e2e.marketplace.product.',
  POST_CARD_PREFIX: 'e2e.community.post.',
} as const;

export function floatingMenuTestId(itemId: string): string {
  return `${E2E_TEST_IDS.FLOATING_MENU_PREFIX}${itemId}`;
}

export function profileMenuTestId(itemKey: string): string {
  return `${E2E_TEST_IDS.PROFILE_MENU_PREFIX}${itemKey}`;
}
