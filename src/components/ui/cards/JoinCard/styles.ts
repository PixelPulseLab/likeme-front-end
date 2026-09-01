import { StyleSheet, Dimensions } from 'react-native';
import { SPACING, FONT_SIZES } from '@/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const JOIN_CARD_CAROUSEL_WIDTH = SCREEN_WIDTH - SPACING.MD * 2 - SPACING.SM;

export const styles = StyleSheet.create({
  cardWrapperCarousel: {
    width: JOIN_CARD_CAROUSEL_WIDTH,
  },
  cardWrapperFullWidth: {
    width: '100%',
  },
  card: {
    height: 164,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 32,
    marginRight: 0,
  },
  cardSquare: {
    minHeight: JOIN_CARD_CAROUSEL_WIDTH,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 32,
    marginRight: 0,
  },
  badgesWrap: {
    alignItems: 'flex-start',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(0, 17, 55, 0.64)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    minHeight: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
    color: '#F6DEA9',
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  footerTextBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XL,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  ctaIconButton: {
    alignSelf: 'flex-end',
  },
  price: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
