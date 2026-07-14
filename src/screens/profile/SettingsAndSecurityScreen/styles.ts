import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.GAP_20,
  },
  section: {
    width: '100%',
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  sectionTitle: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.TEXT,
  },
  menuList: {
    width: '100%',
  },
  menuItemBlock: {
    paddingTop: SPACING.LG,
    gap: SPACING.MD,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    flex: 1,
  },
  menuItemLabel: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.TEXT,
    flexShrink: 1,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.SECONDARY.MEDIUM,
    width: '100%',
  },
  webDeletionLink: {
    marginTop: SPACING.XL,
    paddingHorizontal: SPACING.MD,
    fontFamily: 'DM Sans',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: COLORS.TEXT_LIGHT,
    textDecorationLine: 'underline',
  },
});
