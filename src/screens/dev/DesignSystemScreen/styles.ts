import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.SECTION,
    gap: SPACING.XL,
  },
  intro: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  introTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  introBody: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT_LIGHT,
  },
  section: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionName,
    color: COLORS.TEXT,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
  },
  swatch: {
    width: 148,
    gap: SPACING.SM,
  },
  swatchChip: {
    height: 48,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  swatchName: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.TEXT,
  },
  swatchValue: {
    ...TYPOGRAPHY.bodySmRegular,
    color: COLORS.TEXT_LIGHT,
  },
  typeRow: {
    gap: SPACING.XS,
  },
  typeLabel: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
  },
  stack: {
    gap: SPACING.MD,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.MD,
  },
});
