import React, { useCallback, useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRootNavigationState } from '@/contexts/RootNavigationStateContext';
import { ColoredTwoDotsIcon } from '@/assets/ui';
import { FEATURE_FLAGS, isRouteNameEligibleForSupportFloating } from '@/constants';
import { useFeatureFlag } from '@/hooks';
import { useIsFloatingMenuVisible } from '@/contexts/FloatingMenuContext';
import { SUPPORT_CONFIG } from '@/config/environment';
import { getFocusedRouteNameFromNavState, getRootRouteName } from '@/utils/floatingMenuRoutePolicy';
import { supportFloatingBottomOffset } from '@/utils/layout/supportFloatingBottomOffset';
import { buildWhatsAppWaMeUrl } from '@/utils/messaging/buildWhatsAppWaMeUrl';
import { logger } from '@/utils/logger';
import { styles } from './styles';

const SUPPORT_ICON_SIZE = 16;
const SUPPORT_ACCESSIBILITY_LABEL = 'Abrir suporte';
const SUPPORT_LABEL = 'Suporte';
function buildSupportWhatsappUrl(): string {
  return buildWhatsAppWaMeUrl({
    fullUrl: SUPPORT_CONFIG.whatsappUrl,
    phone: SUPPORT_CONFIG.whatsappPhone,
    prefillText: SUPPORT_CONFIG.whatsappDefaultMessage,
  });
}

const SupportFloatingButton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const isFloatingMenuVisible = useIsFloatingMenuVisible();
  const { isEnabled: isSupportFloatingButtonEnabled } = useFeatureFlag(FEATURE_FLAGS.SUPPORT_FLOATING_BUTTON_ENABLED);
  const rootNavigationState = useRootNavigationState();
  const rootRouteName = useMemo(
    () => (rootNavigationState ? getRootRouteName(rootNavigationState) : undefined),
    [rootNavigationState],
  );
  const focusedRouteName = useMemo(
    () => (rootNavigationState ? getFocusedRouteNameFromNavState(rootNavigationState) : undefined),
    [rootNavigationState],
  );

  const shouldShowByRoute = useMemo(
    () =>
      isRouteNameEligibleForSupportFloating(rootRouteName) || isRouteNameEligibleForSupportFloating(focusedRouteName),
    [focusedRouteName, rootRouteName],
  );

  const bottomOffset = useMemo(
    () => supportFloatingBottomOffset(focusedRouteName, isFloatingMenuVisible, insets.bottom),
    [focusedRouteName, insets.bottom, isFloatingMenuVisible],
  );

  const handlePressSupport = useCallback(async () => {
    const supportUrl = buildSupportWhatsappUrl();
    if (!supportUrl) {
      logger.warn('[SupportFloatingButton] URL de suporte não configurada');
      return;
    }

    logger.info('[SupportFloatingButton] Abrindo link de suporte', {
      supportUrl,
      hasAccentInMessage: SUPPORT_CONFIG.whatsappDefaultMessage.includes('ú'),
    });

    try {
      const canOpen = await Linking.canOpenURL(supportUrl);
      if (!canOpen) {
        logger.warn('[SupportFloatingButton] URL de suporte inválida', { supportUrl });
        return;
      }

      await Linking.openURL(supportUrl);
    } catch (error) {
      logger.error('[SupportFloatingButton] Falha ao abrir suporte', {
        supportUrl,
        cause: error,
      });
    }
  }, []);

  if (!isSupportFloatingButtonEnabled || !shouldShowByRoute) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={SUPPORT_ACCESSIBILITY_LABEL}
      onPress={() => {
        void handlePressSupport();
      }}
      style={[styles.button, { bottom: bottomOffset }]}
    >
      <Text style={styles.label}>{SUPPORT_LABEL}</Text>
      <ColoredTwoDotsIcon width={SUPPORT_ICON_SIZE} height={SUPPORT_ICON_SIZE} />
    </Pressable>
  );
};

export default SupportFloatingButton;
