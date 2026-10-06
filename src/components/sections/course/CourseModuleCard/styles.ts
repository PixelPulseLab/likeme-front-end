import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

const cardRadius = {
  borderTopLeftRadius: BORDER_RADIUS.XL,
  borderTopRightRadius: 28,
  borderBottomRightRadius: SPACING.XL,
  borderBottomLeftRadius: BORDER_RADIUS.MD,
};

export const styles = StyleSheet.create({
  card: {
    ...cardRadius,
    backgroundColor: COLORS.SECONDARY.LIGHT,
    paddingHorizontal: SPACING.GAP_20,
    paddingVertical: SPACING.MD,
    gap: SPACING.MD_PLUS,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLocked: {
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  title: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 15,
    lineHeight: 18,
    color: COLORS.NEUTRAL.LOW.PURE,
    textTransform: 'uppercase',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
  },
  order: {
    width: 50,
  },
  orderNumber: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.XXL,
    lineHeight: 36,
    color: COLORS.NEUTRAL.HIGH.DARK,
  },
  orderMeta: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  summary: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
    flex: 1,
  },
});
