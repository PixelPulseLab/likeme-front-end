import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  root: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    gap: SPACING.XL,
  },
  welcomeBlock: {
    gap: SPACING.MD,
  },
  displayTitle: {
    ...TYPOGRAPHY.displaySm,
    color: COLORS.NEUTRAL.LOW.PURE,
    textTransform: 'uppercase',
  },
  continueSummary: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
  },
  lessonList: {
    gap: SPACING.MD,
  },
  lessonSeparator: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
});
