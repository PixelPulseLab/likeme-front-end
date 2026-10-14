import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

export const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  canvas: {
    ...StyleSheet.absoluteFill,
  },
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.SM,
  },
  bubbleImage: {
    ...StyleSheet.absoluteFill,
  },
  bubbleLabel: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
});
