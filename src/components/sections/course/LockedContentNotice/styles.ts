import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 17, 55, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  card: {
    backgroundColor: COLORS.SECONDARY.PURE,
    borderRadius: BORDER_RADIUS.XL,
    alignItems: 'center',
    gap: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XXL + SPACING.XS,
    paddingBottom: SPACING.XXL + SPACING.XS,
  },
  close: {
    position: 'absolute',
    top: SPACING.GAP_20,
    right: SPACING.GAP_20,
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  body: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
});
