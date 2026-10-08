import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONT_SIZES, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  fact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.GAP_20,
  },
  icon: {
    width: 32,
    height: 32,
  },
  copy: {
    flex: 1,
    gap: SPACING.SM,
  },
  title: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.SM,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  body: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  list: {
    gap: SPACING.XS,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    backgroundColor: COLORS.NEUTRAL.LOW.PURE,
  },
  itemText: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
});
