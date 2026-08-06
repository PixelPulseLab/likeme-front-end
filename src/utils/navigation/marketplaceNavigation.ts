import type { FilterCategoryResult } from '@/components/ui/modals';
import type { MarketplaceRouteParams, RootStackParamList } from '@/types/navigation';
import {
  SOLUTION_TAB_ALL,
  marketplaceSolutionIdsForTab,
  resolveMarketplaceSolutionTabFromFilters,
  type MarketplaceSolutionTab,
} from '@/types/solution';
import { navigateWithAppLoading } from '@/utils/navigation/appLoadingNavigation';

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
};

export function navigateToMarketplace(navigation: Navigation, params?: MarketplaceRouteParams): void {
  navigateWithAppLoading(navigation, { name: 'Marketplace', params });
}

export function marketplaceRouteParamsFromHomeCarousel(solutionId: MarketplaceSolutionTab): MarketplaceRouteParams {
  if (solutionId === SOLUTION_TAB_ALL) {
    return { initialSolutionTab: SOLUTION_TAB_ALL, initialSolutionIds: [] };
  }
  return {
    initialSolutionTab: solutionId,
    initialSolutionIds: marketplaceSolutionIdsForTab(solutionId),
  };
}

export function marketplaceRouteParamsFromFilterApply(result: FilterCategoryResult): MarketplaceRouteParams {
  return {
    initialCategoryId: result.categoryId ?? '',
    initialCategoryName: result.categoryName,
    initialSolutionIds: result.solutionIds,
    initialSolutionTab: resolveMarketplaceSolutionTabFromFilters(result.solutionIds),
  };
}

export function marketplaceRouteParamsFromFilterClear(): MarketplaceRouteParams {
  return {
    initialCategoryId: '',
    initialCategoryName: null,
    initialSolutionTab: SOLUTION_TAB_ALL,
    initialSolutionIds: [],
    initialSearch: '',
  };
}

export function navigateToProviderProfile(navigation: Navigation, params: RootStackParamList['ProviderProfile']): void {
  navigateWithAppLoading(navigation, { name: 'ProviderProfile', params });
}

export function navigateToProductRecommenders(
  navigation: Navigation,
  params: RootStackParamList['ProductRecommenders'],
): void {
  navigation.navigate('ProductRecommenders', params);
}
