import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, BORDER_RADIUS } from '@/constants';

export const styles = StyleSheet.create({
  promptOverlay: {
    flex: 1,
  },
  welcomeCtaCard: {
    flex: 1,
    marginBottom: 0,
    justifyContent: 'center',
  },
  promptTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 32,
    lineHeight: 32,
    color: COLORS.TEXT,
  },
  promptIntro: {
    marginTop: SPACING.XL,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  promptBody: {
    marginTop: SPACING.SM,
    marginBottom: SPACING.SECTION,
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  shoppingTipContainer: {},
  shoppingTip: {
    borderRadius: BORDER_RADIUS.XL,
  },
  shoppingTipTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.BLACK,
  },
  shoppingTipDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  shoppingTipDescriptionBold: {
    fontWeight: '700',
  },
  specialistBlock: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  specialistBlockCompact: {
    paddingBottom: SPACING.XL,
  },
});
