import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';

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
});
