import { StyleSheet } from 'react-native';
import { COLORS, FLOATING_NAV_MENU_BAR_OFFSET, FONT_FAMILY, FONT_SIZES, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  screenContent: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    position: 'relative',
    paddingBottom: SPACING.XL + FLOATING_NAV_MENU_BAR_OFFSET,
  },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 0,
    width: 118,
    height: 306,
  },
  glowImage: {
    width: 118,
    height: 306,
  },
  screenTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.XXL,
    lineHeight: 40,
    color: COLORS.NEUTRAL.LOW.PURE,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
    maxWidth: 334,
    zIndex: 1,
  },
});
