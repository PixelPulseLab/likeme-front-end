export { APP_VERSION } from './appVersion.generated';
export { FONT_FAMILY, dmSansFontFamily } from './fonts';
export type { DmSansWeight } from './fonts';
export { TYPOGRAPHY } from './typography';

export const APP_CONFIG = {
  NAME: 'LIKE:ME',
  TAGLINE: 'LIKE YOUR LIFE',
} as const;

export const COLORS = {
  PRIMARY: {
    PURE: '#0154F8',
    LIGHT: '#D8E4D6',
    MEDIUM: '#8FA3A1',
  },
  SECONDARY: {
    LIGHT: '#FDFBEE',
    PURE: '#FBF7E5',
    MEDIUM: '#E1DFCF',
    DARK: '#CCCABC',
  },
  HIGHLIGHT: {
    PURE: '#C3D714',
    LIGHT: '#EDEC80',
    MEDIUM: '#B3B26D',
    DARK: '#8F8104',
  },
  NEUTRAL: {
    HIGH: {
      LIGHT: '#FFFFFF',
      PURE: '#F4F3EC',
      DARK: '#958AAA',
    },
    LOW: {
      PURE: '#001137',
      PURE_TRANSLUCENT: '#001137CC',
      DEEP: '#000A23',
      LIGHT: '#D9D9D9',
      MEDIUM: '#B2B2B2',
      DARK: '#6E6A6A',
    },
  },
  FEEDBACK: {
    WARNING: '#E30F3C',
    NOTIFICATION_PURE: '#FC8B5C',
  },
  BACKGROUND: '#F4F3EC',
  BACKGROUND_SECONDARY: '#FBF7E5',
  TEXT: '#001137',
  TEXT_LIGHT: '#6E6A6A',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  SUCCESS: '#C3D714',
  ERROR: '#E30F3C',
  WARNING: '#E30F3C',
  INFO: '#0154F8',
} as const;

export const GRADIENTS = {
  PINK: '#FFB6C1',
  YELLOW: '#FFD700',
  GREEN: '#32CD32',
} as const;

/** Gradiente padrão de fundo (equivalente a assets/ui/BackgroundWithGradient.png): cinza-esverdeado claro → creme. */
export const DEFAULT_BACKGROUND_GRADIENT = [
  COLORS.NEUTRAL.HIGH.DARK,
  COLORS.PRIMARY.LIGHT,
  COLORS.NEUTRAL.HIGH.PURE,
] as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD_PLUS: 12,
  MD: 16,
  /** Espaçamento intermediário comum em frames Figma (entre SM e MD). */
  GAP_20: 20,
  LG: 24,
  XL: 32,
  XXL: 48,
  /** Gap vertical entre blocos de conteúdo (ex.: force update Figma). */
  SECTION: 40,
} as const;

/** Altura ocupada pela barra do `FloatingMenu` (pills + padding) para posicionar CTAs acima do menu. */
export const FLOATING_NAV_MENU_BAR_OFFSET = SPACING.SM * 2;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 32,
  XXXL: 36,
} as const;

export const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  /** Botão primário grande — cantos superiores (Figma force update). */
  BUTTON_TOP: 24,
  /** Botão primário grande — cantos inferiores (Figma force update). */
  BUTTON_BOTTOM: 22,
  ROUND: 50,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/** Posts por requisição no feed da Comunidade (cada “load more” pede mais esta quantidade). */
export const COMMUNITY_FEED_POSTS_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

/** Linhas visíveis do corpo do post no feed antes de truncar com reticências (APP-215). */
export const COMMUNITY_POST_PREVIEW_MAX_LINES = 5;

export const KEYBOARD_AWARE_SCROLL = {
  CONTENT_FALLBACK_PADDING_BOTTOM: 120,
} as const;

export { BOTTOM_DOCK_BAR_HEIGHT, BOTTOM_DOCK_SUPPORT_GAP, POST_DETAIL_ROUTE } from './bottomDockBar';
export { ADVERTISER_STATUS, ADVERTISER_TYPE } from './advertiser';
export type { AdvertiserType } from './advertiser';
export { AUTH_ONBOARDING_SCREENS_ORDER } from './authOnboarding';
export type { AuthOnboardingScreenName } from './authOnboarding';
export { FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS } from './featureFlags';
export type { FeatureFlagKey } from './featureFlags';
export { FORCE_START_ONBOARDING_LOCALLY } from './onboardingDebug';
export {
  SUPPORT_FLOATING_MAIN_APP_ROOT_ROUTE_NAMES,
  isRouteNameEligibleForSupportFloating,
} from './supportFloatingVisibility';
export {
  API_HTTP_REQUEST_TIMEOUT_MS,
  CHECKOUT_CREATE_ORDER_HTTP_TIMEOUT_MS,
  APP_RELEASE_POLICY_FETCH_TIMEOUT_MS,
  AUTH_BOOTSTRAP_HTTP_TIMEOUT_MS,
  AUTH_LOGOUT_AND_POLICY_HTTP_TIMEOUT_MS,
  ROOT_SPLASH_FONT_LOAD_FALLBACK_MS,
} from './networkTimeouts';
export { MARKETPLACE_PRODUCT_PLACEHOLDER_IMAGE_URI } from './marketplacePlaceholders';
export {
  IMAGE_CACHE_POLICY,
  IMAGE_TRANSITION_MS,
  IMAGE_NEUTRAL_PLACEHOLDER_COLOR,
  IMAGE_PRIORITY_HIGH,
} from './imageCache';
