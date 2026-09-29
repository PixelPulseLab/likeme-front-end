import { StyleSheet, Dimensions } from 'react-native';
import { BORDER_RADIUS, SPACING, FONT_SIZES } from '@/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const JOIN_CARD_CAROUSEL_WIDTH = SCREEN_WIDTH - SPACING.MD * 2 - SPACING.SM;

export const styles = StyleSheet.create({
  cardWrapperCarousel: {
    width: JOIN_CARD_CAROUSEL_WIDTH,
  },
  cardWrapperFullWidth: {
    width: '100%',
  },
  cardWrapperCompact: {
    width: 170,
    gap: SPACING.SM,
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
  cardCompact: {
    width: 170,
    height: 164,
    borderRadius: BORDER_RADIUS.BUTTON_BOTTOM,
  },
  cardHero: {
    height: 475,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroMedia: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.XL,
  },
  mediaFrame: {
    overflow: 'hidden',
  },
  mediaBody: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  mediaTop: {
    paddingTop: SPACING.SM,
    paddingHorizontal: SPACING.SM,
  },
  mediaFooter: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.SM,
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
  titleWithoutCta: {
    flex: 0,
    alignSelf: 'flex-start',
  },
  ctaIconButton: {
    alignSelf: 'flex-end',
  },
  detail: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  price: {
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.XS,
  },
  caption: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    color: '#001137',
    lineHeight: 20,
  },
});
