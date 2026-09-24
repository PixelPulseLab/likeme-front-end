import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XXL,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
    marginTop: SPACING.SM,
  },
  screenTitle: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.TEXT,
    marginBottom: SPACING.XS,
  },
  titleUnderline: {
    width: 85,
    height: 2,
    backgroundColor: COLORS.PRIMARY.PURE,
    borderRadius: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  summaryLabel: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.BLACK,
    flexShrink: 1,
    marginRight: SPACING.SM,
  },
  summaryValue: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.TEXT,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.LG,
  },
});
