import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_MARKETPLACE_SORT_ORDER, type MarketplaceSortOrderId } from '@/constants/marketplaceSortOrder';
import { useMarketplaceAds, useProducts } from '@/hooks';
import { filterAdsForMarketplaceTab } from '@/utils/marketplace/marketplaceAdSolutionKind';
import { groupMarketplaceAdsBySolutionKind } from '@/utils/marketplace/groupMarketplaceAdsBySolutionKind';
import { sortAdsByMarketplaceOrder } from '@/utils/marketplace/sorting';
import { uniqueAdsById } from '@/utils/marketplace/uniqueAdsById';
import type { Ad } from '@/types/ad';
import {
  SOLUTION_TAB_ALL,
  hasMarketplaceSearchQuery,
  isMarketplaceAllTab,
  isMarketplaceAllTabGroupedBrowsing,
  isMarketplaceCategoryBrowsing,
  isMarketplaceProfessionalsTab,
  showMarketplaceSolutionKindLayout,
  type MarketplaceSolutionTab,
} from '@/types/solution';

type UseMarketplaceScreenListingsParams = {
  selectedSolutionTab: MarketplaceSolutionTab;
  selectedCategoryId?: string;
  appliedSearchQuery: string;
  professionalsCount: number;
};

export type MarketplaceScreenListChrome = {
  showFullScreenLoading: boolean;
  footer: {
    showLoadMoreSpinner: boolean;
    showProfessionals: boolean;
  };
  groupedScrollPagination: {
    loading: boolean;
    hasMore: boolean;
  };
};

type MarketplaceScreenListChromeInput = {
  showCategoryBlocks: boolean;
  showAllTabGroupedLayout: boolean;
  showSolutionKindLayout: boolean;
  isProfessionalsTab: boolean;
  isAllTab: boolean;
  hasCategoryBlockContent: boolean;
  hasAllTabGroupedContent: boolean;
  listAdCount: number;
  filteredAdsBySolutionCount: number;
  hasProfessionalsContent: boolean;
  listingsLoading: boolean;
  listingsHasMore: boolean;
  allTabLoading: boolean;
  programsLoading: boolean;
  allTabHasMore: boolean;
  programsHasMore: boolean;
  hasActiveSearchQuery: boolean;
};

export function marketplaceScreenListChrome(input: MarketplaceScreenListChromeInput): MarketplaceScreenListChrome {
  const groupedLayoutActive = input.showCategoryBlocks || input.showAllTabGroupedLayout;
  const groupedLoading = input.allTabLoading || input.programsLoading;
  const groupedHasMore = input.allTabHasMore || input.programsHasMore;
  const groupedScrollLoading = groupedLayoutActive ? groupedLoading : input.listingsLoading;
  const groupedScrollHasMore = groupedLayoutActive ? groupedHasMore : input.listingsHasMore;
  const groupedHasContent = input.showCategoryBlocks ? input.hasCategoryBlockContent : input.hasAllTabGroupedContent;

  const showFullScreenLoading =
    !input.hasActiveSearchQuery &&
    ((input.showCategoryBlocks && groupedLoading && !input.hasCategoryBlockContent) ||
      (input.showAllTabGroupedLayout && groupedLoading && !input.hasAllTabGroupedContent) ||
      (!input.isProfessionalsTab &&
        !input.showCategoryBlocks &&
        !input.showAllTabGroupedLayout &&
        input.listingsLoading &&
        input.listAdCount === 0));

  const showLoadMoreSpinner = input.showSolutionKindLayout
    ? groupedScrollLoading && (groupedLayoutActive ? groupedHasContent : input.filteredAdsBySolutionCount > 0)
    : !input.isProfessionalsTab && input.listingsLoading && input.listAdCount > 0;

  const showProfessionals =
    !input.showCategoryBlocks &&
    input.isAllTab &&
    input.hasProfessionalsContent &&
    (input.showAllTabGroupedLayout ? input.hasAllTabGroupedContent : input.listAdCount > 0);

  return {
    showFullScreenLoading,
    footer: {
      showLoadMoreSpinner,
      showProfessionals,
    },
    groupedScrollPagination: {
      loading: groupedScrollLoading,
      hasMore: groupedScrollHasMore,
    },
  };
}

export function useMarketplaceScreenListings({
  selectedSolutionTab,
  selectedCategoryId,
  appliedSearchQuery,
  professionalsCount,
}: UseMarketplaceScreenListingsParams) {
  const [allTabPage, setAllTabPage] = useState(1);
  const [productsTabPage, setProductsTabPage] = useState(1);
  const [servicesTabPage, setServicesTabPage] = useState(1);
  const [programsTabPage, setProgramsTabPage] = useState(1);
  const prefetchKeyRef = useRef<string | null>(null);
  const loadMoreInFlightRef = useRef(false);

  const listingsEnabled = !isMarketplaceProfessionalsTab(selectedSolutionTab);
  const listingsSearchQuery = appliedSearchQuery.trim() || undefined;
  const isProgramsTab = selectedSolutionTab === 'programs';
  const isProfessionalsTab = isMarketplaceProfessionalsTab(selectedSolutionTab);
  const showCategoryBlocks = isMarketplaceCategoryBrowsing(selectedSolutionTab, selectedCategoryId, appliedSearchQuery);
  const showAllTabGroupedLayout = isMarketplaceAllTabGroupedBrowsing(
    selectedSolutionTab,
    selectedCategoryId,
    appliedSearchQuery,
  );
  const showSolutionKindLayout = showMarketplaceSolutionKindLayout(
    selectedSolutionTab,
    selectedCategoryId,
    appliedSearchQuery,
  );

  const resetPages = useCallback(() => {
    setAllTabPage(1);
    setProductsTabPage(1);
    setServicesTabPage(1);
    setProgramsTabPage(1);
    prefetchKeyRef.current = null;
    loadMoreInFlightRef.current = false;
  }, []);

  const allTab = useMarketplaceAds({
    selectedCategory: undefined,
    selectedCategoryId,
    page: allTabPage,
    searchQuery: listingsSearchQuery,
    enabled: listingsEnabled,
  });

  const productsTab = useMarketplaceAds({
    selectedCategory: 'products',
    selectedCategoryId,
    page: productsTabPage,
    searchQuery: listingsSearchQuery,
    enabled: listingsEnabled,
  });

  const servicesTab = useMarketplaceAds({
    selectedCategory: 'services',
    selectedCategoryId,
    page: servicesTabPage,
    searchQuery: listingsSearchQuery,
    enabled: listingsEnabled,
  });

  const programsTab = useProducts({
    categoryId: selectedCategoryId,
    page: programsTabPage,
    searchQuery: listingsSearchQuery,
    enabled: listingsEnabled,
  });

  const loadAllTabAds = allTab.loadAds;
  const loadProductsTabAds = productsTab.loadAds;
  const loadServicesTabAds = servicesTab.loadAds;
  const loadProgramsTabProducts = programsTab.loadProducts;
  const refreshAllTabAds = allTab.refresh;
  const refreshProductsTabAds = productsTab.refresh;
  const refreshServicesTabAds = servicesTab.refresh;
  const refreshProgramsTabProducts = programsTab.refresh;

  const activeSource = useMemo(() => {
    switch (selectedSolutionTab) {
      case 'products':
        return { ...productsTab, page: productsTabPage };
      case 'services':
        return { ...servicesTab, page: servicesTabPage };
      case 'programs':
        return { ...programsTab, page: programsTabPage };
      case 'professionals':
        return { ads: [] as Ad[], loading: false, hasMore: false, page: 1, load: async () => {} };
      default:
        return { ...allTab, page: allTabPage };
    }
  }, [
    selectedSolutionTab,
    allTab,
    allTabPage,
    productsTab,
    productsTabPage,
    servicesTab,
    servicesTabPage,
    programsTab,
    programsTabPage,
  ]);

  useEffect(() => {
    resetPages();
  }, [selectedCategoryId, resetPages]);

  useEffect(() => {
    if (!listingsEnabled) {
      return;
    }
    const prefetchKey = `${listingsSearchQuery ?? ''}::${selectedCategoryId ?? ''}`;
    if (prefetchKeyRef.current === prefetchKey) {
      return;
    }
    prefetchKeyRef.current = prefetchKey;
    if (selectedSolutionTab !== SOLUTION_TAB_ALL) {
      void loadAllTabAds();
    }
    if (selectedSolutionTab !== 'products') {
      void loadProductsTabAds();
    }
    if (selectedSolutionTab !== 'services') {
      void loadServicesTabAds();
    }
    if (selectedSolutionTab !== 'programs') {
      void loadProgramsTabProducts();
    }
  }, [
    listingsEnabled,
    listingsSearchQuery,
    selectedCategoryId,
    selectedSolutionTab,
    loadAllTabAds,
    loadProductsTabAds,
    loadServicesTabAds,
    loadProgramsTabProducts,
  ]);

  useEffect(() => {
    if (!listingsEnabled || isProgramsTab) {
      return;
    }
    if (selectedSolutionTab === 'products') {
      void loadProductsTabAds();
      return;
    }
    if (selectedSolutionTab === 'services') {
      void loadServicesTabAds();
      return;
    }
    void loadAllTabAds();
  }, [
    listingsEnabled,
    isProgramsTab,
    selectedSolutionTab,
    allTabPage,
    productsTabPage,
    servicesTabPage,
    loadAllTabAds,
    loadProductsTabAds,
    loadServicesTabAds,
  ]);

  useEffect(() => {
    if (!listingsEnabled) {
      return;
    }
    const needsPrograms =
      isProgramsTab || (isMarketplaceAllTab(selectedSolutionTab) && !hasMarketplaceSearchQuery(appliedSearchQuery));
    if (!needsPrograms) {
      return;
    }
    void loadProgramsTabProducts();
  }, [
    listingsEnabled,
    isProgramsTab,
    selectedSolutionTab,
    appliedSearchQuery,
    selectedCategoryId,
    programsTabPage,
    loadProgramsTabProducts,
  ]);

  const handleLoadMore = useCallback(() => {
    if (loadMoreInFlightRef.current) {
      return;
    }

    const groupedPagination =
      isMarketplaceAllTab(selectedSolutionTab) && !hasMarketplaceSearchQuery(appliedSearchQuery);

    if (groupedPagination) {
      if (allTab.loading || programsTab.loading) {
        return;
      }
      if (!allTab.hasMore && !programsTab.hasMore) {
        return;
      }
      loadMoreInFlightRef.current = true;
      if (allTab.hasMore) {
        setAllTabPage((prev) => prev + 1);
      }
      if (programsTab.hasMore) {
        setProgramsTabPage((prev) => prev + 1);
      }
      return;
    }

    if (activeSource.loading || !activeSource.hasMore) {
      return;
    }

    loadMoreInFlightRef.current = true;

    switch (selectedSolutionTab) {
      case 'products':
        setProductsTabPage((prev) => prev + 1);
        break;
      case 'services':
        setServicesTabPage((prev) => prev + 1);
        break;
      case 'programs':
        setProgramsTabPage((prev) => prev + 1);
        break;
      default:
        setAllTabPage((prev) => prev + 1);
    }
  }, [
    appliedSearchQuery,
    selectedSolutionTab,
    allTab.loading,
    allTab.hasMore,
    programsTab.loading,
    programsTab.hasMore,
    activeSource.loading,
    activeSource.hasMore,
  ]);

  useEffect(() => {
    if (!allTab.loading && !programsTab.loading && !activeSource.loading) {
      loadMoreInFlightRef.current = false;
    }
  }, [allTab.loading, programsTab.loading, activeSource.loading]);

  const sortedAllTabAds = useMemo(
    () =>
      sortAdsByMarketplaceOrder(uniqueAdsById(allTab.ads), DEFAULT_MARKETPLACE_SORT_ORDER as MarketplaceSortOrderId),
    [allTab.ads],
  );

  const groupedCategoryAds = useMemo(() => groupMarketplaceAdsBySolutionKind(sortedAllTabAds), [sortedAllTabAds]);

  const categoryProgramAds = useMemo(() => {
    const sortedProgramAds = sortAdsByMarketplaceOrder(
      programsTab.ads,
      DEFAULT_MARKETPLACE_SORT_ORDER as MarketplaceSortOrderId,
    );
    const seen = new Set<string>();
    const merged: Ad[] = [];
    for (const ad of [...sortedProgramAds, ...groupedCategoryAds.program]) {
      if (seen.has(ad.id)) {
        continue;
      }
      seen.add(ad.id);
      merged.push(ad);
    }
    return merged;
  }, [programsTab.ads, groupedCategoryAds.program]);

  const sortedActiveAds = useMemo(
    () =>
      sortAdsByMarketplaceOrder(
        uniqueAdsById(activeSource.ads),
        DEFAULT_MARKETPLACE_SORT_ORDER as MarketplaceSortOrderId,
      ),
    [activeSource.ads],
  );

  const filteredAdsBySolution = useMemo(
    () => filterAdsForMarketplaceTab(sortedActiveAds, selectedSolutionTab),
    [sortedActiveAds, selectedSolutionTab],
  );

  const highlightAdId = useMemo(() => {
    if (!isMarketplaceAllTab(selectedSolutionTab) || hasMarketplaceSearchQuery(appliedSearchQuery)) {
      return null;
    }
    if (activeSource.page !== 1) {
      return null;
    }
    return filteredAdsBySolution.find((ad) => ad.isFeatured)?.id ?? null;
  }, [selectedSolutionTab, appliedSearchQuery, activeSource.page, filteredAdsBySolution]);

  const excludeHighlight = useCallback(
    (adsList: readonly Ad[]) => (highlightAdId == null ? adsList : adsList.filter((ad) => ad.id !== highlightAdId)),
    [highlightAdId],
  );

  const allTabProductAds = useMemo(
    () => excludeHighlight(groupedCategoryAds.product),
    [excludeHighlight, groupedCategoryAds.product],
  );
  const allTabServiceAds = useMemo(
    () => excludeHighlight(groupedCategoryAds.service),
    [excludeHighlight, groupedCategoryAds.service],
  );
  const allTabProgramAds = useMemo(() => excludeHighlight(categoryProgramAds), [excludeHighlight, categoryProgramAds]);

  const listAdsForCurrentTab = useMemo(() => {
    if (showAllTabGroupedLayout) {
      return allTabProductAds;
    }
    const skipHighlightSlice =
      hasMarketplaceSearchQuery(appliedSearchQuery) ||
      selectedSolutionTab === 'programs' ||
      selectedSolutionTab === 'services';
    if (skipHighlightSlice) {
      return filteredAdsBySolution;
    }
    return activeSource.page === 1 ? filteredAdsBySolution.slice(1) : filteredAdsBySolution;
  }, [
    showAllTabGroupedLayout,
    allTabProductAds,
    filteredAdsBySolution,
    activeSource.page,
    appliedSearchQuery,
    selectedSolutionTab,
  ]);

  const hasCategoryBlockContent =
    groupedCategoryAds.product.length > 0 ||
    groupedCategoryAds.service.length > 0 ||
    categoryProgramAds.length > 0 ||
    professionalsCount > 0;
  const hasAllTabGroupedContent =
    (highlightAdId != null && filteredAdsBySolution.some((ad) => ad.id === highlightAdId && ad.product != null)) ||
    allTabServiceAds.length > 0 ||
    allTabProgramAds.length > 0 ||
    allTabProductAds.length > 0 ||
    professionalsCount > 0;

  const listChrome = useMemo(
    () =>
      marketplaceScreenListChrome({
        showCategoryBlocks,
        showAllTabGroupedLayout,
        showSolutionKindLayout,
        isProfessionalsTab,
        isAllTab: isMarketplaceAllTab(selectedSolutionTab),
        hasCategoryBlockContent,
        hasAllTabGroupedContent,
        listAdCount: listAdsForCurrentTab.length,
        filteredAdsBySolutionCount: filteredAdsBySolution.length,
        hasProfessionalsContent: professionalsCount > 0,
        listingsLoading: activeSource.loading,
        listingsHasMore: activeSource.hasMore,
        allTabLoading: allTab.loading,
        programsLoading: programsTab.loading,
        allTabHasMore: allTab.hasMore,
        programsHasMore: programsTab.hasMore,
        hasActiveSearchQuery: hasMarketplaceSearchQuery(appliedSearchQuery),
      }),
    [
      showCategoryBlocks,
      showAllTabGroupedLayout,
      showSolutionKindLayout,
      isProfessionalsTab,
      selectedSolutionTab,
      hasCategoryBlockContent,
      hasAllTabGroupedContent,
      listAdsForCurrentTab.length,
      filteredAdsBySolution.length,
      professionalsCount,
      activeSource.loading,
      activeSource.hasMore,
      allTab.loading,
      programsTab.loading,
      allTab.hasMore,
      programsTab.hasMore,
      appliedSearchQuery,
    ],
  );

  const refresh = useCallback(async () => {
    prefetchKeyRef.current = null;
    loadMoreInFlightRef.current = false;
    await Promise.all([
      refreshAllTabAds(),
      refreshProductsTabAds(),
      refreshServicesTabAds(),
      refreshProgramsTabProducts(),
    ]);
    setAllTabPage(1);
    setProductsTabPage(1);
    setServicesTabPage(1);
    setProgramsTabPage(1);
  }, [refreshAllTabAds, refreshProductsTabAds, refreshServicesTabAds, refreshProgramsTabProducts]);

  return {
    resetPages,
    refresh,
    handleLoadMore,
    showCategoryBlocks,
    showAllTabGroupedLayout,
    showSolutionKindLayout,
    isProfessionalsTab,
    listChrome,
    groupedCategoryAds,
    categoryProgramAds,
    filteredAdsBySolution,
    allTabProductAds,
    allTabServiceAds,
    allTabProgramAds,
    listAdsForCurrentTab,
    highlightAdId,
    weekHighlightAd: filteredAdsBySolution.find((ad) => ad.isFeatured && ad.product != null) ?? null,
    loading: activeSource.loading,
    hasMore: activeSource.hasMore,
    allTabLoading: allTab.loading,
    programsLoading: programsTab.loading,
    allTabHasMore: allTab.hasMore,
    programsHasMore: programsTab.hasMore,
    hasCategoryBlockContent,
    hasAllTabGroupedContent,
  };
}
