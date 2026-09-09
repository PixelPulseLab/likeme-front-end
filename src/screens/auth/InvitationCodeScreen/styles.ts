import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.XL,
  },
  headline: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.TEXT,
    textTransform: 'uppercase',
    marginBottom: SPACING.SECTION,
  },
  block: {
    width: '100%',
    gap: SPACING.MD,
  },
  blockTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  blockBody: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.TEXT,
  },
  blockBodyEmphasis: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.TEXT,
  },
  enterButton: {
    marginTop: SPACING.SM,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
    marginVertical: SPACING.SECTION,
    width: '100%',
  },
});
