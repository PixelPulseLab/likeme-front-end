import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, BORDER_RADIUS } from '@/constants';

export const styles = StyleSheet.create({
  promptOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  welcomeCtaCard: {
    marginBottom: 0,
  },
  promptTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 32,
    lineHeight: 36,
    color: COLORS.TEXT,
  },
  promptIntro: {
    marginTop: SPACING.LG,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  promptBody: {
    marginTop: SPACING.SM,
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
