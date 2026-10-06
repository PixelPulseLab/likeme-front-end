import { StyleSheet } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  FLOATING_NAV_MENU_BAR_OFFSET,
  SPACING,
  TYPOGRAPHY,
} from '@/constants';

const cardRadius = {
  borderTopLeftRadius: BORDER_RADIUS.XL,
  borderTopRightRadius: 28,
  borderBottomRightRadius: SPACING.XL,
  borderBottomLeftRadius: BORDER_RADIUS.MD,
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.XL + FLOATING_NAV_MENU_BAR_OFFSET,
    gap: SPACING.MD,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.TEXT,
    maxWidth: 220,
    textAlign: 'center',
  },
  cover: {
    ...cardRadius,
    alignSelf: 'stretch',
    height: 208,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.SM,
  },
  statusTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.XL,
    lineHeight: 24,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  statusBody: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    color: COLORS.NEUTRAL.LOW.PURE,
    textAlign: 'center',
  },
  prompt: {
    alignItems: 'center',
    gap: SPACING.SM,
  },
  promptTitle: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.NEUTRAL.LOW.PURE,
    textAlign: 'center',
  },
  promptBody: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    color: COLORS.NEUTRAL.LOW.DARK,
    textAlign: 'center',
  },
  scale: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: 272,
    padding: SPACING.SM,
  },
  score: {
    width: 36,
    alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    color: COLORS.BLACK,
    textAlign: 'center',
  },
  next: {
    alignSelf: 'stretch',
    gap: SPACING.SM,
  },
  nextLabel: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.SM,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  nextCard: {
    ...cardRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.LG,
    minHeight: 187,
    paddingHorizontal: SPACING.GAP_20,
    paddingVertical: SPACING.MD,
    backgroundColor: '#F6DEA9',
  },
  nextCover: {
    width: 118,
    height: 154,
    borderTopLeftRadius: SPACING.GAP_20,
    borderTopRightRadius: SPACING.GAP_20,
    borderBottomRightRadius: SPACING.GAP_20,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
  },
  nextCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.XS,
  },
  nextOverline: {
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 8,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.NEUTRAL.LOW.DARK,
    textTransform: 'uppercase',
  },
  nextTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  nextSummary: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
  },
  actions: {
    alignSelf: 'stretch',
    gap: SPACING.SM,
  },
});
