import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FLOATING_NAV_MENU_BAR_OFFSET } from '@/constants';

export const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY.LIGHT,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: SPACING.XL + FLOATING_NAV_MENU_BAR_OFFSET,
  },
  screenTitle: {
    fontSize: FONT_SIZES.XL,
    fontFamily: 'DM Sans',
    fontWeight: '700',
    color: COLORS.BLACK,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  searchWrap: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  searchEmptyWrap: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
  },
  section: {
    paddingTop: SPACING.SM,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.SM,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    color: COLORS.NEUTRAL.LOW.PURE,
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  cardsList: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: SPACING.XXL * 2,
    gap: SPACING.XL,
  },
});
