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
  PRODUCT_ADD_TO_CART: 'product-details-add-to-cart',
  PRODUCT_TAB_PREFIX: 'e2e.product.tab.',
  PRODUCT_PROGRAM_TERMS: 'e2e.product.programTerms',
  CART_SCREEN: 'e2e.cart.root',
  CART_CHECKOUT: 'e2e.cart.checkout',
  CHECKOUT_ADDRESS_FORM: 'e2e.checkout.addressForm',
  CHECKOUT_ADDRESS_VIEW: 'e2e.checkout.addressView',
  CHECKOUT_ADDRESS_SAVE: 'e2e.checkout.addressSave',
  CHECKOUT_ZIP: 'e2e.checkout.zip',
  CHECKOUT_FULL_NAME: 'e2e.checkout.fullName',
  CHECKOUT_ADDRESS_LINE1: 'e2e.checkout.addressLine1',
  CHECKOUT_STREET_NUMBER: 'e2e.checkout.streetNumber',
  CHECKOUT_NEIGHBORHOOD: 'e2e.checkout.neighborhood',
  CHECKOUT_CITY: 'e2e.checkout.city',
  CHECKOUT_STATE: 'e2e.checkout.state',
  CHECKOUT_PHONE: 'e2e.checkout.phone',
  CHECKOUT_PAYMENT_FORM: 'e2e.checkout.paymentForm',
  CHECKOUT_CARDHOLDER: 'e2e.checkout.cardholder',
  CHECKOUT_CARD_NUMBER: 'e2e.checkout.cardNumber',
  CHECKOUT_EXPIRY: 'e2e.checkout.expiry',
  CHECKOUT_CVV: 'e2e.checkout.cvv',
  CHECKOUT_CPF: 'e2e.checkout.cpf',
  CHECKOUT_CONTINUE: 'button-continue',
  CHECKOUT_PAYMENT_ERROR: 'e2e.checkout.paymentError',
  CHECKOUT_ORDER_COMPLETION: 'order-completion',
  CHECKOUT_ORDER_SUCCESS: 'e2e.checkout.orderSuccess',
  CHECKOUT_ORDER_PENDING: 'e2e.checkout.orderPending',
  CHECKOUT_ORDER_ERROR: 'e2e.checkout.orderError',
} as const;

export function floatingMenuTestId(itemId: string): string {
  return `${E2E_TEST_IDS.FLOATING_MENU_PREFIX}${itemId}`;
}

export function profileMenuTestId(itemKey: string): string {
  return `${E2E_TEST_IDS.PROFILE_MENU_PREFIX}${itemKey}`;
}
