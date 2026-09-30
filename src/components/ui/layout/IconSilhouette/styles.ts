import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerXsmall: {
    width: 24,
    height: 20,
    borderRadius: BORDER_RADIUS.SM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  containerSmall: {
    width: 30,
    height: 26,
    borderRadius: BORDER_RADIUS.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  containerMedium: {
    width: 40,
    height: 36,
    borderRadius: BORDER_RADIUS.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  containerLarge: {
    width: 53,
    height: 48,
    borderRadius: BORDER_RADIUS.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  blurFace: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  blurBorder: {
    ...StyleSheet.absoluteFillObject,
  },
  blurMask: {
    backgroundColor: 'transparent',
  },
  image: {
    resizeMode: 'cover',
  },
  imageXsmall: {
    width: 24,
    height: 20,
  },
  imageSmall: {
    width: 30,
    height: 26,
  },
  imageMedium: {
    width: 40,
    height: 36,
  },
  imageLarge: {
    width: 53,
    height: 48,
  },
});
