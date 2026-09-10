import { StyleSheet, type TextStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

const textPreserveWhitespace: TextStyle = { whiteSpace: 'pre-wrap' } as TextStyle;

export const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  /** Header em posição absoluta no topo para o HeroImage começar logo abaixo. */
  headerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.XL,
  },
  content: {
    flex: 1,
    zIndex: 1,
    paddingBottom: SPACING.XL,
    backgroundColor: 'transparent',
  },
  heroFooter: {
    width: '100%',
  },
  feedListWrap: {
    flex: 1,
    zIndex: 1,
  },
  feedList: {
    flex: 1,
  },
  feedRefreshIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
    paddingTop: SPACING.SM,
  },
  feedContentContainer: {
    paddingBottom: SPACING.XL,
  },
  feedListHeader: {
    paddingBottom: SPACING.MD,
  },
  feedListFooter: {
    paddingTop: SPACING.MD,
  },
  feedItemWrapper: {
    paddingHorizontal: SPACING.MD,
  },
  feedItemSeparator: {
    height: SPACING.MD,
  },
  feedLoadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    columnGap: SPACING.SM,
  },
  feedLoadingFooterLabel: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  feedEmptyContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  feedEmptyText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  heroDescription: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    lineHeight: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tabsWrapper: {
    width: '100%',
    backgroundColor: 'rgba(253,251,238,0.8)',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: 8,
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  tabButtonSelected: {
    backgroundColor: '#FBF7E5',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    color: '#B2B2B2',
    textAlign: 'center',
  },
  tabTextSelected: {
    color: '#001137',
  },
  toggleContainer: {
    flex: 1,
  },
  tabsContainerInCard: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '700',
    color: '#001137',
    marginBottom: SPACING.MD,
  },
  tabContent: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  descriptionContainer: {
    gap: 8,
  },
  descriptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletPoint: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6e6a6a',
    marginTop: 8.5,
    flexShrink: 0,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '400',
    color: '#6e6a6a',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  agreementsCheckboxRow: {
    marginTop: SPACING.LG,
  },
  agreementsTermsCheckboxContainer: {
    gap: 4,
  },
  agreementsTermsCheckboxLabel: {
    fontSize: 10,
    lineHeight: 14,
    flexShrink: 1,
  },
  aboutBodyText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '400',
    color: '#6e6a6a',
    lineHeight: 22,
    letterSpacing: 0.2,
    ...textPreserveWhitespace,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  toggleBackButton: {},
  suggestedSection: {
    marginTop: SPACING.XL,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.XL,
    padding: SPACING.LG,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  suggestedOverline: {
    fontSize: 13,
    textTransform: 'uppercase',
    color: COLORS.TEXT_LIGHT,
    marginBottom: SPACING.XS,
    letterSpacing: 0.5,
  },
  suggestedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: SPACING.XS,
  },
  suggestedDescription: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    marginBottom: SPACING.LG,
  },
  productSlide: {
    flexDirection: 'row',
  },
  productCardWrapper: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  productCardWrapperLast: {
    marginRight: 0,
  },
  productCard: {
    backgroundColor: '#E7EFE7',
    borderRadius: BORDER_RADIUS.XL,
    padding: SPACING.MD,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 130,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.SM,
  },
  productTag: {
    position: 'absolute',
    top: SPACING.MD,
    left: SPACING.MD,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.LG,
  },
  productTagText: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  productLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productLikesText: {
    fontSize: 12,
    color: COLORS.TEXT,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  productSubtitleText: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
    marginBottom: SPACING.MD,
  },
  productActionButton: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.WHITE,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardPlaceholder: {
    flex: 1,
  },
  sliderIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  sliderIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: 4,
  },
  sliderIndicatorActive: {
    width: 20,
    backgroundColor: '#4CAF50',
  },
  eventJoinBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 251, 238, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
