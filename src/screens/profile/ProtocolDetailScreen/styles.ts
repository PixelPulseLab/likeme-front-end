import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACING, FLOATING_NAV_MENU_BAR_OFFSET, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    paddingBottom: SPACING.XL + FLOATING_NAV_MENU_BAR_OFFSET,
  },
  infoSection: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    gap: SPACING.SM,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  tabContent: {
    paddingTop: SPACING.LG,
    gap: SPACING.LG,
  },
  eventBannerContainer: {
    paddingHorizontal: SPACING.MD,
    width: '100%',
    alignSelf: 'stretch',
  },
  descriptionText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.DARK,
    paddingHorizontal: SPACING.LG,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.DARK,
    paddingHorizontal: SPACING.LG,
  },
  loaderWrap: {
    paddingVertical: SPACING.XXL,
    alignItems: 'center',
  },
  heroFooter: {
    width: '100%',
  },
  heroDescription: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.WHITE,
    marginBottom: SPACING.SM,
  },
  canceledNoticeCard: {
    marginHorizontal: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 24,
    padding: SPACING.LG,
  },
  canceledNoticeText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  canceledNoticeDate: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  similarProductsSection: {
    paddingHorizontal: SPACING.MD,
    alignItems: 'center',
    gap: SPACING.MD,
  },
  similarProductsTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  similarProductsDescription: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
    textAlign: 'center',
    maxWidth: 275,
  },
});
