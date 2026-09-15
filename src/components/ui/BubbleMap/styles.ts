import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.SM,
  },
  bubbleImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bubbleLabel: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
});
