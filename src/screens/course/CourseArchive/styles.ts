import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

const cardRadius = {
  borderTopLeftRadius: BORDER_RADIUS.XL,
  borderTopRightRadius: 28,
  borderBottomRightRadius: SPACING.XL,
  borderBottomLeftRadius: BORDER_RADIUS.MD,
};

export const styles = StyleSheet.create({
  root: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    gap: SPACING.XL,
  },
  intro: {
    gap: SPACING.SM,
  },
  kicker: {
    fontFamily: FONT_FAMILY.DM_SANS_MEDIUM,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: COLORS.NEUTRAL.LOW.DARK,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  typeList: {
    gap: SPACING.MD,
  },
  typeCard: {
    height: 112,
    overflow: 'hidden',
    ...cardRadius,
  },
  typePhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  typeShade: {
    ...StyleSheet.absoluteFillObject,
  },
  typeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  typeTitle: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.WHITE,
    flex: 1,
  },
  typeChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SECONDARY.PURE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemList: {
    gap: SPACING.LG,
  },
  itemCard: {
    gap: SPACING.SM,
  },
  itemMedia: {
    height: 180,
    overflow: 'hidden',
    backgroundColor: COLORS.NEUTRAL.LOW.PURE,
    ...cardRadius,
  },
  itemPhoto: {
    width: '100%',
    height: '100%',
  },
  itemCopy: {
    gap: SPACING.XS,
  },
  itemDate: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
  },
  itemTitle: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  itemSummary: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  unavailable: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  empty: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
});
