import { navigateToMarketplace } from '@/utils/navigation/marketplaceNavigation';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
  replace: (screen: string, params?: unknown) => void;
};

export function navigateToShareDiscover(navigation: Navigation | undefined, productId?: string | null): void {
  if (!navigation) {
    return;
  }

  const id = productId?.trim();
  if (id) {
    navigateToProductDetailsScreen(navigation, { productId: id });
    return;
  }

  navigateToMarketplace(navigation);
}
