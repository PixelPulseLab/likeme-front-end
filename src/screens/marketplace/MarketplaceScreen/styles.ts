import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  contentFloatingMenuReserve: {},
  content: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
    paddingVertical: SPACING.SM,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  customHeader: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    minHeight: 36,
    paddingBottom: SPACING.MD,
  },
  searchRowBackButton: {
    padding: 0,
    alignSelf: 'center',
  },
  searchRowSearch: {
    flex: 1,
    justifyContent: 'center',
  },
  searchBarContainer: {
    paddingBottom: 0,
  },
  filterMenuContainer: {
    marginTop: 0,
  },
  scrollView: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: SPACING.XXL,
  },
  listContentContainer: {
    paddingBottom: SPACING.XXL,
  },
  listItemWrapper: {
    marginHorizontal: SPACING.MD,
  },
  listItemSeparator: {
    height: SPACING.MD,
  },
  listFooter: {
    paddingTop: SPACING.MD,
  },
  listLoadingMore: {
    padding: SPACING.MD,
    alignItems: 'center',
  },
  listLoadMoreButton: {
    padding: SPACING.MD,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: SPACING.MD,
  },
  listLoadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  listLoadingFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  listLoadingText: {
    marginTop: SPACING.MD,
    fontSize: 16,
    color: '#666666',
    fontFamily: 'DM Sans',
  },
  listEmptyContainer: {
    marginHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
  },
  section: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  sectionName: {
    ...TYPOGRAPHY.sectionName,
    color: COLORS.BLACK,
    marginBottom: SPACING.MD,
  },
  title3: {
    ...TYPOGRAPHY.title3,
    color: COLORS.BLACK,
    marginBottom: SPACING.MD,
  },
  listHeaderWrap: {
    marginHorizontal: SPACING.MD,
  },
  curationTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.BLACK,
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  curationIntro: {
    ...TYPOGRAPHY.bodyMd,
    color: '#666666',
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  // Week highlights styles
  weekHighlightCard: {
    width: SCREEN_WIDTH - SPACING.MD * 2,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  weekHighlightImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2E7D32',
  },
  weekHighlightBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  weekHighlightBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  weekHighlightContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.LG,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  weekHighlightTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.XS,
  },
  weekHighlightPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  weekHighlightCartButton: {
    position: 'absolute',
    bottom: SPACING.LG,
    right: SPACING.LG,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: SPACING.MD,
    left: SPACING.LG,
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#2196F3',
  },
  // Curated by providers styles
  horizontalScroll: {
    paddingVertical: SPACING.SM,
    gap: SPACING.MD,
  },
  curatedCard: {
    width: SCREEN_WIDTH - SPACING.MD * 3,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginRight: SPACING.MD,
  },
  curatedImage: {
    width: '100%',
    height: '100%',
  },
  curatedTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    gap: 4,
  },
  curatedTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  curatedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  curatedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.SM,
  },
  curatedProvider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  providerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  providerName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  curatedArrowButton: {
    position: 'absolute',
    bottom: SPACING.MD,
    right: SPACING.MD,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New for you styles
  newForYouCard: {
    width: 180,
    marginRight: SPACING.MD,
  },
  newForYouImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: SPACING.SM,
  },
  newForYouBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
  },
  newForYouBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  newForYouFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  newForYouPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  newForYouLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newForYouLikesText: {
    fontSize: 12,
    color: '#666666',
  },
  newForYouContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newForYouTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: SPACING.SM,
  },
  newForYouArrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // All products styles
  orderFilterMenuContainer: {
    marginBottom: SPACING.MD,
  },
  productsList: {
    gap: SPACING.MD,
  },
  productRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.MD,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productRowImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: SPACING.MD,
  },
  productRowContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productRowCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 999,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    marginBottom: SPACING.XS,
  },
  productRowCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  productRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: SPACING.XS,
  },
  productRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productRowPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  productRowRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productRowRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  productRowAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.MD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    padding: SPACING.XL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  externalLinkText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  loadMoreButton: {
    padding: SPACING.MD,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: SPACING.MD,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  loadingMoreContainer: {
    padding: SPACING.MD,
    alignItems: 'center',
  },
});
