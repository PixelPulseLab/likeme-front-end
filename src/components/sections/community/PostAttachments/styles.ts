import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const attachmentStyles = StyleSheet.create({
  container: {
    marginTop: SPACING.SM,
    gap: SPACING.SM,
  },
  mediaImageBlock: {
    marginBottom: SPACING.GAP_20,
  },
  mediaContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e8e4d4',
  },
  mediaContainerVideo: {
    marginTop: SPACING.SM,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e8e4d4',
  },
  mediaContainerCompact: {
    marginTop: SPACING.XS,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8e4d4',
  },
  postAttachmentImage: {
    width: '100%',
  },
  postAttachmentImageLoading: {
    minHeight: 120,
  },
  videoPosterPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#2a2a2a',
  },
  videoPosterInner: {
    position: 'relative',
    width: '100%',
  },
  videoPlayerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
  },
  imageGridPair: {
    width: '49%',
    aspectRatio: 1,
  },
  imageGridTripleMain: {
    width: '66%',
    aspectRatio: 2 / 3,
  },
  imageGridTripleSide: {
    width: '32%',
    aspectRatio: 2 / 3,
    gap: SPACING.XS,
  },
  imageGridTripleSideCell: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8e4d4',
  },
  imageGridQuad: {
    width: '49%',
    aspectRatio: 1,
  },
  imageGridCell: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8e4d4',
  },
  mediaVideoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 200,
  },
  imageGridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 17, 55, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGridOverlayText: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: '600',
  },
  fileDownloadActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.XS,
    minHeight: 48,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD_PLUS,
    backgroundColor: 'rgba(240, 238, 225, 0.16)',
    borderWidth: 1,
    borderColor: COLORS.NEUTRAL.LOW.PURE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  fileListSectionTitle: {
    ...TYPOGRAPHY.bodyMdMedium,
    color: COLORS.BLACK,
    marginBottom: SPACING.XS,
  },
  fileDownloadActionLabel: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.NEUTRAL.LOW.PURE,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  fullscreenNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  fullscreenNavPrevious: {
    left: 12,
  },
  fullscreenNavNext: {
    right: 12,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  fullscreenCounter: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
});
