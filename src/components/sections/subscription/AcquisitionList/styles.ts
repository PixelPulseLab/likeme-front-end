import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  tabs: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    zIndex: 1,
  },
  filters: {
    paddingHorizontal: SPACING.MD,
    zIndex: 1,
    marginBottom: SPACING.XL,
  },
  emptyWrap: {
    paddingTop: SPACING.XL,
  },
  emptyMessage: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.XL,
  },
  cards: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
    zIndex: 1,
  },
  section: {
    gap: SPACING.MD,
    zIndex: 1,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_SEMIBOLD,
    fontSize: FONT_SIZES.SM,
    letterSpacing: 0.2,
    color: COLORS.NEUTRAL.LOW.PURE,
    paddingHorizontal: SPACING.MD,
  },
  liveRow: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  eventsStack: {
    gap: SPACING.MD,
  },
});
