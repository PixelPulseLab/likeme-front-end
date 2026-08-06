import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.XL,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.LG,
  },
  title: {
    fontFamily: 'Bricolage Grotesque',
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.NEUTRAL.LOW.PURE,
    marginBottom: SPACING.SM,
    textTransform: 'uppercase',
  },
  intro: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '400',
    color: COLORS.NEUTRAL.LOW.PURE,
    lineHeight: 22,
    marginBottom: SPACING.LG,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  accordionItemExpanded: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    marginHorizontal: -SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingRight: SPACING.SM,
  },
  accordionTitle: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.MD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  accordionContent: {
    paddingBottom: SPACING.MD,
    paddingRight: SPACING.LG,
    gap: SPACING.SM,
  },
  accordionBody: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '400',
    color: COLORS.NEUTRAL.LOW.PURE,
    lineHeight: 22,
  },
  plansSubtitle: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: SPACING.SM,
  },
  plansTable: {
    borderWidth: 1,
    borderColor: COLORS.NEUTRAL.LOW.LIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: SPACING.SM,
  },
  plansTableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  plansTableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  plansTableCellFeature: {
    flex: 1.4,
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    color: COLORS.TEXT,
    paddingRight: SPACING.XS,
  },
  plansTableCell: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XS,
    fontWeight: '400',
    color: COLORS.NEUTRAL.LOW.PURE,
    textAlign: 'center',
  },
  plansTableCellHeader: {
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  plansTableCheck: {
    color: COLORS.PRIMARY.PURE,
    fontWeight: '700',
  },
  plansTableDash: {
    color: COLORS.NEUTRAL.LOW.LIGHT,
  },
});
