import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
  },
  programName: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
  },
  continueButton: {
    marginTop: SPACING.XL,
  },
});
