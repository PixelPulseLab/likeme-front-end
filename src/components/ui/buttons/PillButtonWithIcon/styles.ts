import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const styles = StyleSheet.create({
  blurRoot: {
    position: 'relative',
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFill,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pill: {
    position: 'relative',
    zIndex: 1,
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.NEUTRAL.LOW.PURE_TRANSLUCENT,
    minHeight: 48,
    borderRadius: 24,
    paddingVertical: 0,
    paddingLeft: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 20,
    color: COLORS.SECONDARY.PURE,
  },
  trailingIconWrap: {
    marginLeft: SPACING.SM,
  },
  trailingIconContainer: {
    padding: 0,
  },
});
