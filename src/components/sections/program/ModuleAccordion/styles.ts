import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: SPACING.SM,
  },
  moduleItem: {
    paddingTop: SPACING.LG,
    paddingHorizontal: SPACING.MD,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.MD,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    flex: 1,
  },
  moduleTitleButton: {
    flex: 1,
  },
  sessionIndicatorButton: {
    padding: 0,
  },
  sessionIndicator: {
    width: 29,
    height: 26,
  },
  moduleTitle: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XL,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  moduleBody: {
    marginLeft: SPACING.MD,
    marginBottom: SPACING.MD,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.SM,
    paddingRight: SPACING.MD,
  },
  moduleBodyText: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '400',
    letterSpacing: 0.2,
    color: COLORS.TEXT,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
});
