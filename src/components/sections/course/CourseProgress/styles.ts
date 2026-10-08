import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  progressBlock: {
    gap: SPACING.SM,
  },
  progressTitle: {
    fontFamily: FONT_FAMILY.BRICOLAGE_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
  },
  progressTrack: {
    flex: 1,
    height: 16,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.SECONDARY.MEDIUM,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.NEUTRAL.LOW.PURE,
  },
  progressPercent: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  progressCount: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
});
