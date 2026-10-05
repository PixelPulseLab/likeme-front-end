import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_FAMILY, FONT_SIZES, SPACING, TYPOGRAPHY } from '@/constants';

const cardRadius = {
  borderTopLeftRadius: BORDER_RADIUS.XL,
  borderTopRightRadius: 28,
  borderBottomRightRadius: SPACING.XL,
  borderBottomLeftRadius: BORDER_RADIUS.MD,
};

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
  welcomeBody: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  section: {
    gap: SPACING.SM,
  },
  sectionLabel: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  continueCard: {
    ...cardRadius,
    backgroundColor: COLORS.PRIMARY.LIGHT,
    flexDirection: 'row',
    gap: SPACING.LG,
    paddingHorizontal: SPACING.GAP_20,
    paddingVertical: SPACING.MD,
    minHeight: 187,
  },
  continueCover: {
    width: 118,
    height: 154,
    borderTopLeftRadius: SPACING.GAP_20,
    borderTopRightRadius: SPACING.GAP_20,
    borderBottomRightRadius: SPACING.GAP_20,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
  },
  continueCopy: {
    flex: 1,
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  overline: {
    ...TYPOGRAPHY.bodySmRegular,
    color: COLORS.NEUTRAL.LOW.DARK,
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  continueSummary: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
  },
  liveRow: {
    flexDirection: 'row',
  },
  liveCoverWrap: {
    width: 139,
    height: 148,
    ...cardRadius,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: SPACING.MD_PLUS,
  },
  liveCover: {
    ...StyleSheet.absoluteFillObject,
  },
  livePanel: {
    flex: 1,
    height: 148,
    ...cardRadius,
    backgroundColor: COLORS.HIGHLIGHT.LIGHT,
    padding: SPACING.MD,
    justifyContent: 'space-between',
  },
  liveMessage: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  liveWhen: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  journeyHeader: {
    gap: SPACING.SM,
  },
  journeyHint: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  progressBlock: {
    gap: SPACING.SM,
  },
  progressTitle: {
    fontFamily: FONT_FAMILY.BRICOLAGE_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
  },
  progressTrack: {
    flex: 1,
    height: 16,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.SECONDARY.MEDIUM,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.NEUTRAL.LOW.PURE,
  },
  progressPercent: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  progressCount: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  stageList: {
    gap: SPACING.LG,
  },
  stageCard: {
    ...cardRadius,
    backgroundColor: COLORS.SECONDARY.LIGHT,
    paddingHorizontal: SPACING.GAP_20,
    paddingVertical: SPACING.MD,
    gap: SPACING.MD_PLUS,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stageCardLocked: {
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  stageTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_REGULAR,
    fontSize: 15,
    lineHeight: 18,
    color: COLORS.NEUTRAL.LOW.PURE,
    textTransform: 'uppercase',
  },
  stageBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
  },
  stageOrder: {
    width: 50,
  },
  stageOrderNumber: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.XXL,
    lineHeight: 36,
    color: COLORS.NEUTRAL.HIGH.DARK,
  },
  stageOrderMeta: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.DARK,
  },
  stageSummary: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT_LIGHT,
    flex: 1,
  },
  lessonList: {
    gap: SPACING.MD,
  },
  lessonRow: {
    ...cardRadius,
    backgroundColor: COLORS.SECONDARY.LIGHT,
    paddingHorizontal: SPACING.GAP_20,
    paddingVertical: SPACING.MD,
    gap: SPACING.XS,
  },
  lessonTitle: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  lessonCard: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.LG,
    paddingRight: SPACING.MD_PLUS,
    minHeight: 154,
  },
  lessonCover: {
    width: 118,
    height: 154,
    borderTopLeftRadius: SPACING.GAP_20,
    borderTopRightRadius: SPACING.GAP_20,
    borderBottomRightRadius: SPACING.GAP_20,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonCoverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  lessonCoverLocked: {
    opacity: 0.5,
  },
  lessonCoverFallback: {
    backgroundColor: COLORS.SECONDARY.MEDIUM,
  },
  lessonCopy: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: SPACING.XS,
  },
  lessonHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  lessonHeading: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  lessonHeadingLocked: {
    color: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  lessonSummaryLocked: {
    color: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  lessonSeparator: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  seeMoreButton: {
    alignSelf: 'stretch',
  },
  lessonScreen: {
    gap: SPACING.MD,
  },
  lessonVideo: {
    marginHorizontal: -SPACING.LG,
    minHeight: 280,
  },
  lessonPoster: {
    width: '100%',
    height: 280,
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
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.SECONDARY.PURE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.NEUTRAL.LOW.LIGHT,
  },
  materialThumb: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.MD,
  },
  materialIconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialIcon: {
    width: 40,
    height: 40,
  },
  materialCopy: {
    flex: 1,
    gap: SPACING.XS,
  },
  materialName: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  materialSize: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  lockedBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 17, 55, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  lockedCard: {
    backgroundColor: COLORS.SECONDARY.PURE,
    borderRadius: BORDER_RADIUS.XL,
    alignItems: 'center',
    gap: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XXL + SPACING.XS,
    paddingBottom: SPACING.XXL + SPACING.XS,
  },
  lockedClose: {
    position: 'absolute',
    top: SPACING.GAP_20,
    right: SPACING.GAP_20,
  },
  lockedTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  lockedBody: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
});
