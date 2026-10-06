import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import { LESSON_VIDEO_HEIGHT } from '@/components/sections/course/VideoPlayer/styles';

export const styles = StyleSheet.create({
  root: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    gap: SPACING.XL,
  },
  lessonScreen: {
    gap: SPACING.MD,
  },
  lessonVideo: {
    marginHorizontal: -SPACING.LG,
    marginTop: -SPACING.LG,
  },
  lessonPoster: {
    width: '100%',
    height: LESSON_VIDEO_HEIGHT,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  lessonScreenTitle: {
    ...TYPOGRAPHY.title3,
    flex: 1,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  lessonBody: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  lessonFacts: {
    gap: SPACING.MD,
  },
  lessonComplete: {
    marginTop: SPACING.SM,
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  tab: {
    minHeight: 36,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: BORDER_RADIUS.LG,
    borderBottomRightRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.SECONDARY.LIGHT,
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: COLORS.PRIMARY.PURE,
  },
  tabLabel: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  tabLabelSelected: {
    color: COLORS.SECONDARY.PURE,
  },
  materialSectionTitle: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.BLACK,
  },
});
