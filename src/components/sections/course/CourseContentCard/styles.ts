import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.LG,
    paddingRight: SPACING.MD_PLUS,
    minHeight: 154,
  },
  cover: {
    width: 118,
    height: 154,
    borderTopLeftRadius: SPACING.GAP_20,
    borderTopRightRadius: SPACING.GAP_20,
    borderBottomRightRadius: SPACING.GAP_20,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  coverLocked: {
    opacity: 0.5,
  },
  coverFallback: {
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  copy: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: SPACING.XS,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  heading: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  headingLocked: {
    color: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  summary: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
  },
  summaryLocked: {
    color: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  seeMoreButton: {
    alignSelf: 'stretch',
  },
});
