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
  commentCard: {
    backgroundColor: COLORS.SECONDARY.PURE,
    padding: SPACING.MD,
    gap: SPACING.MD,
    borderTopLeftRadius: BORDER_RADIUS.XL,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  commentBody: {
    gap: SPACING.SM,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  commentAvatar: {
    width: 26,
    height: 24,
    borderRadius: 12,
  },
  commentAvatarFallback: {
    width: 26,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitials: {
    ...TYPOGRAPHY.bodySm,
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  commentAuthor: {
    ...TYPOGRAPHY.bodySm,
    flex: 1,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  commentText: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    minHeight: 24,
  },
  commentActionPressed: {
    opacity: 0.7,
  },
  commentActionCount: {
    ...TYPOGRAPHY.bodySm,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: COLORS.PRIMARY.PURE,
  },
});
