import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '@/constants';

export const CARD_WIDTH = 260;
export const CARD_HEIGHT = 200;

export const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.NEUTRAL.LOW.MEDIUM,
  },
  cardPressed: {
    opacity: 0.92,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 17, 55, 0.28)',
  },
  badgesRow: {
    position: 'absolute',
    top: SPACING.MD,
    left: SPACING.MD,
    right: SPACING.MD,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
  },
  badge: {
    backgroundColor: 'rgba(0, 17, 55, 0.64)',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 24,
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DM Sans',
    color: COLORS.PRIMARY.LIGHT,
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    left: SPACING.MD,
    right: SPACING.MD,
    bottom: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.SM,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'DM Sans',
    color: COLORS.WHITE,
    lineHeight: 22,
  },
});
