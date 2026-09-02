export const FEATURE_FLAGS = {
  CHAT_ENABLED: 'chat_enabled',
  SUPPORT_FLOATING_BUTTON_ENABLED: 'support_floating_button_enabled',
  WALLET_ENABLED: 'wallet_enabled',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  [FEATURE_FLAGS.CHAT_ENABLED]: false,
  [FEATURE_FLAGS.SUPPORT_FLOATING_BUTTON_ENABLED]: true,
  [FEATURE_FLAGS.WALLET_ENABLED]: false,
};
