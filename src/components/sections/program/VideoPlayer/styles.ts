import { StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, FONT_SIZES, SPACING } from '@/constants';

export const LESSON_VIDEO_HEIGHT = 349;

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.SM,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e8e4d4',
  },
  posterInner: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2a2a2a',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  collapseTouch: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  collapseInner: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 4,
  },
  fullscreenStage: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenPlayer: {
    flex: 1,
  },
  fullscreenClose: {
    position: 'absolute',
    right: SPACING.MD,
    zIndex: 3,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    backgroundColor: '#2a2a2a',
  },
  statusText: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    color: COLORS.NEUTRAL.HIGH.PURE,
    textAlign: 'center',
  },
  statusLink: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    color: COLORS.NEUTRAL.HIGH.PURE,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  lessonContainer: {
    width: '100%',
    height: LESSON_VIDEO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#08090D',
  },
  lessonFrame: {
    position: 'relative',
    width: '100%',
    height: LESSON_VIDEO_HEIGHT,
  },
  lessonFrameFill: {
    flex: 1,
    height: undefined,
  },
  lessonUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  lessonChrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.MD,
    paddingTop: 56,
    paddingBottom: SPACING.SM,
  },
  lessonChromeFade: {
    ...StyleSheet.absoluteFillObject,
  },
  lessonChromeBody: {
    gap: SPACING.XS,
  },
  lessonChromeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD_PLUS,
  },
  lessonChromeTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.SM,
    lineHeight: 18,
    color: COLORS.NEUTRAL.HIGH.LIGHT,
  },
  lessonChromeTime: {
    fontFamily: FONT_FAMILY.DM_SANS_BOLD,
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
    color: COLORS.NEUTRAL.HIGH.LIGHT,
  },
  lessonTrackHit: {
    paddingVertical: SPACING.SM,
  },
  lessonTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(217, 217, 217, 0.4)',
  },
  lessonTrackFill: {
    height: 2,
    backgroundColor: COLORS.NEUTRAL.HIGH.LIGHT,
  },
  lessonChromeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonChromeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  lessonControl: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonControlMuted: {
    opacity: 0.45,
  },
  lessonPause: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lessonPauseBar: {
    width: 3,
    height: 14,
    borderRadius: 1,
    backgroundColor: COLORS.NEUTRAL.HIGH.LIGHT,
  },
  lessonSpinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
