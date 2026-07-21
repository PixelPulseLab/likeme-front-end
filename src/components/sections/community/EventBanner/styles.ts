import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

const IMAGE_CORNER_RADIUS = {
  borderTopLeftRadius: 24,
  borderTopRightRadius: 28,
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 32,
} as const;

const IMAGE_SHADOW = {
  shadowColor: COLORS.BLACK,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 4,
} as const;

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
    height: 148,
    width: '100%',
    alignSelf: 'stretch',
  },
  imageSide: {
    flex: 2,
    minWidth: 0,
    height: 148,
  },
  imageStack: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    ...IMAGE_CORNER_RADIUS,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  ctaButton: {
    backgroundColor: '#fdfbee',
    borderRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 9,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#001137',
    textAlign: 'center',
  },
  infoContainer: {
    flex: 3,
    minWidth: 0,
    height: 148,
    backgroundColor: 'rgba(237, 236, 128, 0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 32,
    paddingTop: 8,
    paddingBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.LG,
  },
  titleSection: {
    gap: SPACING.SM,
  },
  cameraIcon: {
    width: 24,
    height: 24,
    marginBottom: SPACING.XS,
  },
  titleContainer: {
    gap: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '400',
    color: '#001137',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    height: 16,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6e6a6a',
    letterSpacing: 0.2,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: '#001137',
    letterSpacing: 0.2,
  },
});
