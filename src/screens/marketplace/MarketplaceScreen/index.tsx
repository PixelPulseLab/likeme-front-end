import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
  Text,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/ui/inputs';
import { IconButton } from '@/components/ui/buttons';
import { StickyFilterCarouselRow } from '@/components/ui/menu';
import { adToJoinCardItem } from '@/utils/marketplace/adToJoinCardItem';
import { ScreenWithHeader } from '@/components/ui/layout';
import { EmptyState } from '@/components/ui/feedback';
import { GradientBackgroundByCategory } from '@/components/sections';
import { FilterCategoryModal, type FilterCategoryResult } from '@/components/ui/modals';
import {
  MarketplaceCategoryBlocks,
  MarketplaceProfessionalsBlock,
  MarketplaceProgramCardsRow,
  MarketplaceServiceCardsList,
} from '@/components/sections/marketplace';
import { JoinCard } from '@/components/ui/cards';
import { ProductListItem } from '@/components/sections/product/ProductList';
import {
  useMarketplaceScreenListings,
  useMenuItems,
  useCategories,
  useCategoryDisplayLabel,
  useUserAvatar,
  useAdvertisers,
  useSolutions,
} from '@/hooks';
import { getMarkerIdForCategory } from '@/hooks/category/markerId';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { useTranslation } from '@/hooks/i18n';
import { handleAdNavigation } from '@/utils';
import { navigateToProviderProfile } from '@/utils/navigation/marketplaceNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import type { Ad, Advertiser } from '@/types/ad';
import type { RootStackParamList } from '@/types/navigation';
import { BOTTOM_DOCK_BAR_HEIGHT, SPACING } from '@/constants';
import { styles } from './styles';
import { useAnalyticsScreen } from '@/analytics';
import { CategoryName } from '@/types';
import {
  SOLUTION_TAB_ALL,
  hasMarketplaceSearchQuery,
  isMarketplaceAllTab,
  marketplaceSolutionIdsForTab,
  marketplaceSolutionOptions,
  resolveMarketplaceSolutionTabFromFilters,
  type MarketplaceSolutionTab,
  type SolutionFilterId,
} from '@/types/solution';

const MARKETPLACE_LIST_END_REACHED_THRESHOLD = 0.5;

type MarketplaceScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Marketplace'>;
  route?: RouteProp<RootStackParamList, 'Marketplace'>;
};

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'Marketplace', screenClass: 'MarketplaceScreen' });
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { marketplaceCarouselOptions } = useSolutions();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const userAvatarUri = useUserAvatar();
  const { categories } = useCategories({ enabled: true });
  const { getCategoryName } = useCategoryDisplayLabel();

  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedSolutionTab, setSelectedSolutionTab] = useState<MarketplaceSolutionTab>(SOLUTION_TAB_ALL);
  const [selectedCategoryName, setSelectedCategoryName] = useState<CategoryName | null>(null);
  const [isFilterCategoryModalVisible, setIsFilterCategoryModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedSolutionIds, setSelectedSolutionIds] = useState<SolutionFilterId[]>([]);
  const [searchAutoFocus, setSearchAutoFocus] = useState(false);

  const scrollNearBottomRef = useRef(false);
  const flatListLoadMoreLockedRef = useRef(false);
  const appliedRouteParamsKeyRef = useRef<string | null>(null);
  const resetPagesRef = useRef<() => void>(() => {});

  const listScrollBottomPadding = useMemo(() => BOTTOM_DOCK_BAR_HEIGHT + bottomInset + SPACING.MD, [bottomInset]);

  const listContentContainerStyle = useMemo(
    () => [styles.listContentContainer, { paddingBottom: listScrollBottomPadding }],
    [listScrollBottomPadding],
  );

  const { advertisers: professionals } = useAdvertisers({
    listOptions: {
      status: 'active',
      limit: 50,
      ...(appliedSearchQuery.trim() ? { search: appliedSearchQuery.trim() } : {}),
      ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
    },
  });

  const listings = useMarketplaceScreenListings({
    selectedSolutionTab,
    selectedCategoryId,
    appliedSearchQuery,
    professionalsCount: professionals.length,
  });

  resetPagesRef.current = listings.resetPages;

  useFocusEffect(
    useCallback(() => {
      const params = route?.params;
      if (!params || Object.keys(params).length === 0) {
        appliedRouteParamsKeyRef.current = null;
        return;
      }

      const paramsKey = JSON.stringify(params);
      if (appliedRouteParamsKeyRef.current === paramsKey) {
        return;
      }
      appliedRouteParamsKeyRef.current = paramsKey;

      if (params.initialSearch !== undefined) {
        setSearchQuery(params.initialSearch);
        setAppliedSearchQuery(params.initialSearch.trim());
      }
      if (params.initialCategoryId !== undefined) {
        setSelectedCategoryId(params.initialCategoryId || undefined);
      }
      if (params.initialCategoryName !== undefined) {
        setSelectedCategoryName(params.initialCategoryName);
      }
      if (params.initialSolutionTab !== undefined) {
        setSelectedSolutionTab(params.initialSolutionTab);
      }
      if (params.initialSolutionIds !== undefined) {
        setSelectedSolutionIds(params.initialSolutionIds);
      }
      if (params.openFilterModal) {
        setIsFilterCategoryModalVisible(true);
      }
      if (params.focusSearch) {
        setSearchAutoFocus(true);
      }

      resetPagesRef.current();
      navigation.setParams({
        initialSearch: undefined,
        initialCategoryId: undefined,
        initialCategoryName: undefined,
        initialSolutionTab: undefined,
        initialSolutionIds: undefined,
        openFilterModal: undefined,
        focusSearch: undefined,
      });
    }, [navigation, route?.params]),
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = searchQuery.trim();
      setAppliedSearchQuery((prev) => {
        if (prev === next) return prev;
        resetPagesRef.current();
        return next;
      });
    }, 450);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const {
    showCategoryBlocks,
    showAllTabGroupedLayout,
    showSolutionKindLayout,
    isProfessionalsTab,
    listChrome,
    hasCategoryBlockContent,
    hasAllTabGroupedContent,
    loading: listingsLoading,
  } = listings;

  useEffect(() => {
    if (!listChrome.groupedScrollPagination.loading) {
      scrollNearBottomRef.current = false;
    }
  }, [listChrome.groupedScrollPagination.loading]);

  useEffect(() => {
    if (!listingsLoading) {
      flatListLoadMoreLockedRef.current = false;
    }
  }, [listingsLoading]);

  const listData = isProfessionalsTab ? [] : listings.listAdsForCurrentTab;

  const productFallbackTitle = t('marketplace.product');
  const outOfStockLabel = t('marketplace.outOfStock');

  const selectedCategoryFromId =
    selectedCategoryId != null
      ? categories.find((category) => String(category.categoryId) === String(selectedCategoryId))
      : null;
  const activeCategoryMarker = useMemo((): CategoryName | null => {
    if (selectedCategoryName != null) {
      return selectedCategoryName;
    }
    if (selectedCategoryFromId != null) {
      return getMarkerIdForCategory(String(selectedCategoryFromId.categoryId), selectedCategoryFromId.name ?? '');
    }
    return null;
  }, [selectedCategoryName, selectedCategoryFromId]);
  const hasActiveCategoryFilter = selectedCategoryId != null || selectedCategoryName != null;
  const hasActiveFilterModalSelection = hasActiveCategoryFilter || selectedSolutionIds.length > 0;
  const categoryFilterButtonLabel =
    selectedCategoryName != null
      ? getCategoryName(selectedCategoryName)
      : selectedCategoryFromId?.name ?? t('marketplace.category');
  const categoryDisplayName =
    selectedCategoryName != null ? getCategoryName(selectedCategoryName) : selectedCategoryFromId?.name?.trim() ?? '';
  const showCategoryCurationCopy = hasActiveCategoryFilter && Boolean(categoryDisplayName);
  const categoryTitleText = showCategoryCurationCopy
    ? t('marketplace.categoryTitle', { categoryName: categoryDisplayName })
    : null;
  const categoryIntroText = showCategoryCurationCopy
    ? t('marketplace.categoryIntro', { categoryName: categoryDisplayName })
    : null;

  const showSelectedSolutionSectionTitle =
    !showCategoryBlocks && !showAllTabGroupedLayout && !isProfessionalsTab && !isMarketplaceAllTab(selectedSolutionTab);

  const selectedSolutionSectionTitle = useMemo(() => {
    if (isMarketplaceAllTab(selectedSolutionTab) || isProfessionalsTab) {
      return null;
    }
    return marketplaceCarouselOptions.find((option) => option.id === selectedSolutionTab)?.label ?? null;
  }, [isProfessionalsTab, marketplaceCarouselOptions, selectedSolutionTab]);

  const categoryCurationHeader = useMemo(() => {
    if (!showCategoryCurationCopy || !categoryTitleText || !categoryIntroText) {
      return null;
    }
    return (
      <>
        <Text style={styles.curationTitle} testID='marketplace-category-title'>
          {categoryTitleText}
        </Text>
        <Text style={styles.curationIntro} testID='marketplace-category-intro'>
          {categoryIntroText}
        </Text>
      </>
    );
  }, [showCategoryCurationCopy, categoryTitleText, categoryIntroText]);

  const handleAdPress = useCallback(
    (ad: Ad) => {
      handleAdNavigation(ad, navigation);
    },
    [navigation],
  );

  const handleProfessionalPress = useCallback(
    (advertiser: Advertiser) => {
      navigateToProviderProfile(navigation, {
        providerId: advertiser.id,
        provider: { name: advertiser.name, avatar: advertiser.logo },
      });
    },
    [navigation],
  );

  const handleFilterCategoryApply = (result: FilterCategoryResult) => {
    setSelectedCategoryId(result.categoryId ?? undefined);
    setSelectedSolutionIds(result.solutionIds);
    setSelectedCategoryName(result.categoryName);
    setSelectedSolutionTab(resolveMarketplaceSolutionTabFromFilters(result.solutionIds, selectedSolutionTab));
    listings.resetPages();
  };

  const handleClearFilterCategory = useCallback(() => {
    setSelectedCategoryId(undefined);
    setSelectedSolutionIds([]);
    setSelectedSolutionTab(SOLUTION_TAB_ALL);
    setSelectedCategoryName(null);
    setSearchQuery('');
    setAppliedSearchQuery('');
    listings.resetPages();
  }, [listings.resetPages]);

  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'marketplace');

  const professionalsContent = useMemo(() => {
    if (!professionals.length) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionName}>{t('filterCategory.solutions.professionals')}</Text>
        <MarketplaceProfessionalsBlock
          professionals={professionals}
          onProfessionalPress={handleProfessionalPress}
          viewProfileLabel={t('community.viewProfile')}
        />
      </View>
    );
  }, [professionals, t, handleProfessionalPress]);

  const weekHighlights = useMemo(() => {
    if (
      showCategoryBlocks ||
      !isMarketplaceAllTab(selectedSolutionTab) ||
      hasMarketplaceSearchQuery(appliedSearchQuery)
    ) {
      return null;
    }
    const highlight = listings.weekHighlightAd;
    if (!highlight?.product) {
      return null;
    }
    const item = adToJoinCardItem(highlight, {
      categories,
      includePrice: true,
      fallbackTitle: productFallbackTitle,
      featuredBadgeLabel: t('marketplace.featured'),
    });
    return (
      <View style={styles.section}>
        <Text style={styles.title3}>{t('marketplace.weekHighlights')}</Text>
        <JoinCard
          title={item.title}
          badges={item.badges}
          image={item.image}
          price={item.price}
          square
          onPress={() => handleAdPress(highlight)}
        />
      </View>
    );
  }, [
    showCategoryBlocks,
    selectedSolutionTab,
    appliedSearchQuery,
    listings.weekHighlightAd,
    categories,
    productFallbackTitle,
    t,
    handleAdPress,
  ]);

  const listEmpty = useMemo(
    () => (
      <View style={styles.listEmptyContainer}>
        <EmptyState
          title={t('marketplace.noAdsFound')}
          description={t('marketplace.noAdsFoundDescription')}
          iconName='storefront'
          actionLabel={showCategoryBlocks ? t('home.clearFilters') : undefined}
          onActionPress={showCategoryBlocks ? handleClearFilterCategory : undefined}
        />
      </View>
    ),
    [t, showCategoryBlocks, handleClearFilterCategory],
  );

  const productListHeader = useMemo(
    () => (
      <>
        {weekHighlights}
        {categoryCurationHeader}
        {showSelectedSolutionSectionTitle && selectedSolutionSectionTitle ? (
          <View style={styles.listHeaderWrap}>
            <Text style={styles.sectionName} testID='marketplace-section-title'>
              {selectedSolutionSectionTitle}
            </Text>
          </View>
        ) : null}
      </>
    ),
    [weekHighlights, categoryCurationHeader, showSelectedSolutionSectionTitle, selectedSolutionSectionTitle],
  );

  const renderSolutionKindContent = () => {
    if (showCategoryBlocks) {
      if (!hasCategoryBlockContent) {
        return listEmpty;
      }
      return (
        <MarketplaceCategoryBlocks
          layout='categoryFilter'
          productAds={listings.groupedCategoryAds.product}
          serviceAds={listings.groupedCategoryAds.service}
          programAds={listings.categoryProgramAds}
          professionals={professionals}
          categories={categories}
          onAdPress={handleAdPress}
          onProfessionalPress={handleProfessionalPress}
        />
      );
    }

    if (showAllTabGroupedLayout) {
      if (!hasAllTabGroupedContent) {
        return listEmpty;
      }
      return (
        <MarketplaceCategoryBlocks
          layout='allTab'
          productAds={listings.allTabProductAds}
          serviceAds={listings.allTabServiceAds}
          programAds={listings.allTabProgramAds}
          professionals={[]}
          categories={categories}
          onAdPress={handleAdPress}
          onProfessionalPress={handleProfessionalPress}
        />
      );
    }

    if (listings.filteredAdsBySolution.length === 0) {
      return listEmpty;
    }

    if (selectedSolutionTab === 'services') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionName} testID='marketplace-section-title'>
            {selectedSolutionSectionTitle ?? t('filterCategory.solutions.services')}
          </Text>
          <MarketplaceServiceCardsList
            ads={listings.filteredAdsBySolution}
            categories={categories}
            onAdPress={handleAdPress}
            fallbackTitle={productFallbackTitle}
          />
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionName} testID='marketplace-section-title'>
          {selectedSolutionSectionTitle ?? t('filterCategory.solutions.programs')}
        </Text>
        <MarketplaceProgramCardsRow
          ads={listings.filteredAdsBySolution}
          categories={categories}
          onAdPress={handleAdPress}
          fallbackTitle={productFallbackTitle}
        />
      </View>
    );
  };

  const listFooter = useMemo(
    () => (
      <View style={styles.listFooter}>
        {listChrome.footer.showLoadMoreSpinner ? (
          <View style={styles.listLoadingMore}>
            <ActivityIndicator size='small' color='#2196F3' />
          </View>
        ) : null}
        {listChrome.footer.showProfessionals ? professionalsContent : null}
      </View>
    ),
    [listChrome.footer.showLoadMoreSpinner, listChrome.footer.showProfessionals, professionalsContent],
  );

  const renderAdItem = useCallback<ListRenderItem<Ad>>(
    ({ item: ad }) => (
      <View style={styles.listItemWrapper}>
        <ProductListItem
          ad={ad}
          categories={categories}
          onAdPress={handleAdPress}
          fallbackTitle={productFallbackTitle}
          outOfStockLabel={outOfStockLabel}
        />
      </View>
    ),
    [categories, productFallbackTitle, outOfStockLabel, handleAdPress],
  );

  const handleProductListEndReached = useCallback(() => {
    if (flatListLoadMoreLockedRef.current || listings.loading || !listings.hasMore) {
      return;
    }
    flatListLoadMoreLockedRef.current = true;
    listings.handleLoadMore();
  }, [listings.loading, listings.hasMore, listings.handleLoadMore]);

  const handleGroupedScrollEndReached = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const visibleBottom = layoutMeasurement.height + contentOffset.y;
      const isNearBottom =
        visibleBottom >= contentSize.height - layoutMeasurement.height * MARKETPLACE_LIST_END_REACHED_THRESHOLD;

      if (!isNearBottom) {
        scrollNearBottomRef.current = false;
        return;
      }
      if (
        scrollNearBottomRef.current ||
        !listChrome.groupedScrollPagination.hasMore ||
        listChrome.groupedScrollPagination.loading
      ) {
        return;
      }
      scrollNearBottomRef.current = true;
      listings.handleLoadMore();
    },
    [listChrome.groupedScrollPagination.hasMore, listChrome.groupedScrollPagination.loading, listings.handleLoadMore],
  );

  const renderGroupedContent = () => (
    <ScrollView
      testID='marketplace-scroll'
      style={styles.scrollView}
      contentContainerStyle={listContentContainerStyle}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleGroupedScrollEndReached}
    >
      {weekHighlights}
      {categoryCurationHeader}
      {isProfessionalsTab ? professionalsContent ?? listEmpty : renderSolutionKindContent()}
      {listFooter}
    </ScrollView>
  );

  const productListEmpty = useMemo(() => {
    if (listingsLoading && listData.length === 0 && hasMarketplaceSearchQuery(appliedSearchQuery)) {
      return (
        <View style={styles.listLoadingMore}>
          <ActivityIndicator size='small' color='#2196F3' />
        </View>
      );
    }
    return isProfessionalsTab ? professionalsContent ?? listEmpty : listEmpty;
  }, [listingsLoading, listData.length, appliedSearchQuery, isProfessionalsTab, professionalsContent, listEmpty]);

  const renderProductList = () => (
    <FlatList<Ad>
      testID='marketplace-list'
      style={styles.scrollView}
      contentContainerStyle={listContentContainerStyle}
      showsVerticalScrollIndicator={false}
      data={listData}
      keyExtractor={(ad) => ad.id}
      renderItem={renderAdItem}
      ItemSeparatorComponent={() => <View style={styles.listItemSeparator} />}
      ListHeaderComponent={productListHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={productListEmpty}
      onEndReached={handleProductListEndReached}
      onEndReachedThreshold={MARKETPLACE_LIST_END_REACHED_THRESHOLD}
      onMomentumScrollBegin={() => {
        flatListLoadMoreLockedRef.current = false;
      }}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={11}
      removeClippedSubviews
    />
  );

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: false,
        showMenuWithAvatar: true,
        onMenuPress: () => navigateRootStack(rootNavigation, 'Profile'),
        userAvatarUri,
        showCartButton: true,
        onCartPress: () => navigation.navigate('Cart'),
      }}
      contentContainerStyle={[styles.container, styles.contentFloatingMenuReserve]}
    >
      <GradientBackgroundByCategory category={hasActiveCategoryFilter ? activeCategoryMarker : null} />
      <View pointerEvents='none' style={styles.backgroundGradient}>
        <GradientBackgroundByCategory category={hasActiveCategoryFilter ? activeCategoryMarker : null} />
      </View>
      <View style={styles.content}>
        <View style={styles.customHeader}>
          <View style={styles.searchContainer}>
            <IconButton
              icon='chevron-left'
              onPress={() => navigation.goBack()}
              backgroundSize='medium'
              containerStyle={styles.searchRowBackButton}
            />
            <View style={styles.searchRowSearch}>
              <SearchBar
                placeholder={t('marketplace.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={searchAutoFocus}
                onSearchPress={() => {
                  setAppliedSearchQuery(searchQuery.trim());
                  listings.resetPages();
                }}
                showFilterButton={false}
                containerStyle={styles.searchBarContainer}
              />
            </View>
          </View>
          <View style={styles.filterMenuContainer}>
            <StickyFilterCarouselRow
              filterButtonLabel={categoryFilterButtonLabel}
              filterButtonSelected={hasActiveFilterModalSelection}
              onFilterButtonPress={() => setIsFilterCategoryModalVisible(true)}
              carouselOptions={marketplaceCarouselOptions}
              selectedCarouselId={selectedSolutionTab}
              onCarouselSelect={(solutionId) => {
                setSelectedSolutionTab(solutionId as MarketplaceSolutionTab);
                setSelectedSolutionIds(marketplaceSolutionIdsForTab(solutionId as MarketplaceSolutionTab));
                listings.resetPages();
              }}
            />
          </View>
          <FilterCategoryModal
            visible={isFilterCategoryModalVisible}
            onClose={() => setIsFilterCategoryModalVisible(false)}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={() => {}}
            selectedSolutionIds={selectedSolutionIds}
            solutionOptions={marketplaceSolutionOptions}
            onFilter={handleFilterCategoryApply}
            onClear={handleClearFilterCategory}
          />
        </View>

        {listChrome.showFullScreenLoading ? (
          <View style={styles.listLoadingFullScreen}>
            <ActivityIndicator size='large' color='#2196F3' />
            <Text style={styles.listLoadingText}>{t('common.loading')}</Text>
          </View>
        ) : showSolutionKindLayout ? (
          renderGroupedContent()
        ) : (
          renderProductList()
        )}
      </View>
    </ScreenWithHeader>
  );
};

export default MarketplaceScreen;
