import {
  getAffiliateProductScreen,
  getCommunityStackNavigator,
  getMarketplaceScreen,
  getProductDetailsScreen,
  getProviderProfileScreen,
} from '@/navigation/rootStackScreenLoaders';
import type { AppLoadingNavigateTarget } from '@/types/navigation';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';

export const APP_LOADING_TARGET_NAMES = [
  'ProductDetails',
  'AffiliateProduct',
  'Community',
  'Marketplace',
  'ProviderProfile',
] as const;

export type AppLoadingTargetName = (typeof APP_LOADING_TARGET_NAMES)[number];

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
};

const TARGET_PRELOADERS: Record<AppLoadingTargetName, () => void> = {
  ProductDetails: () => {
    getProductDetailsScreen();
  },
  AffiliateProduct: () => {
    getAffiliateProductScreen();
  },
  Community: () => {
    getCommunityStackNavigator();
  },
  Marketplace: () => {
    getMarketplaceScreen();
  },
  ProviderProfile: () => {
    getProviderProfileScreen();
  },
};

export function preloadAppLoadingTarget(name: AppLoadingTargetName): void {
  TARGET_PRELOADERS[name]();
}

export function navigateWithAppLoading(
  navigation: Navigation,
  target: AppLoadingNavigateTarget,
  options?: { loadingMessage?: string },
): void {
  preloadAppLoadingTarget(target.name);
  navigateRootStack(navigation, 'AppLoading', {
    target,
    loadingMessage: options?.loadingMessage,
  });
}
