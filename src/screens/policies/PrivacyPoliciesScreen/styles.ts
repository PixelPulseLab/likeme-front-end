import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

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
    paddingBottom: 120,
  },
  scrollContentWithoutFooter: {
    paddingBottom: SPACING.XL,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFill,
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
    marginBottom: SPACING.LG,
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '400',
    color: COLORS.NEUTRAL.LOW.PURE,
    lineHeight: 22,
    marginBottom: SPACING.LG,
  },
  descriptionBold: {
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  accordionItemExpanded: {
    backgroundColor: '#FBF7E5',
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
  },
  accordionBody: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '400',
    color: COLORS.NEUTRAL.LOW.PURE,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    elevation: 2,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  disclaimer: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XS,
    fontStyle: 'italic',
    paddingVertical: SPACING.XL,
    textAlign: 'left',
  },
});
