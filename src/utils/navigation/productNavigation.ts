import type { Ad } from '@/types/ad';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';
import type { CommunityStackParamList, RootStackParamList } from '@/types/navigation';
import { PROGRAM_TYPE, type ProgramType } from '@/types/product/programType';
import { formatPriceLabel } from '@/utils/formatters/priceFormatter';
import { advertiserToRouteProductProvider } from '@/utils/marketplace/routeProductProvider';
import { navigateWithAppLoading } from '@/utils/navigation/appLoadingNavigation';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';

const priceForNav = (raw: number | null | undefined) => formatPriceLabel(raw);

interface Navigation {
  navigate: (screen: string, params?: any) => void;
  replace: (screen: string, params?: any) => void;
}

export const navigateToAmazonProduct = (ad: Ad, navigation: Navigation): boolean => {
  const isAmazonProduct = ad.product?.type === PRODUCT_CATALOG_TYPE.AMAZON;
  if (!isAmazonProduct) {
    return false;
  }

  if (!ad.product && !ad.productId) {
    return false;
  }

  const productId = ad.productId || ad.product?.id;
  if (!productId) {
    return false;
  }

  const productParams = ad.product
    ? {
        id: ad.product.id,
        title: ad.product.name,
        price: priceForNav(ad.product.price),
        image: ad.product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        type: ad.product.type,
        description: ad.product.description,
        provider: advertiserToRouteProductProvider(ad.advertiser),
      }
    : undefined;

  navigateWithAppLoading(navigation, {
    name: 'AffiliateProduct',
    params: {
      productId,
      adId: ad.id,
      product: productParams,
    },
  });

  return true;
};

export const navigateToExternalProduct = (ad: Ad, navigation: Navigation): boolean => {
  if (!ad.product?.externalUrl) {
    return false;
  }

  if (!ad.product) {
    return false;
  }

  const productId = ad.productId || ad.product.id;
  navigateWithAppLoading(navigation, {
    name: 'AffiliateProduct',
    params: {
      productId,
      adId: ad.id,
      product: {
        id: ad.product.id,
        title: ad.product.name,
        price: priceForNav(ad.product.price),
        image: ad.product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: ad.product.description,
        externalUrl: ad.product.externalUrl,
        provider: advertiserToRouteProductProvider(ad.advertiser),
      },
    },
  });

  return true;
};

export const navigateToProductDetails = (ad: Ad, navigation: Navigation): boolean => {
  if (!ad.productId || !ad.product) {
    return false;
  }

  navigateWithAppLoading(navigation, {
    name: 'ProductDetails',
    params: {
      productId: ad.productId,
      product: {
        id: ad.product.id,
        title: ad.product.name,
        price: priceForNav(ad.product.price),
        image: ad.product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
        description: ad.product.description,
        provider: advertiserToRouteProductProvider(ad.advertiser),
      },
    },
  });

  return true;
};

export function navigateToProductDetailsScreen(
  navigation: Navigation,
  params: RootStackParamList['ProductDetails'],
): void {
  navigateWithAppLoading(navigation, { name: 'ProductDetails', params });
}

export type SubscribedProgramStackRoute =
  | { screen: 'Community'; params: RootStackParamList['Community'] }
  | { screen: 'ProtocolDetail'; params: RootStackParamList['ProtocolDetail'] };

export function subscribedCommunityFeedParams(
  programType?: ProgramType | null,
  communityId?: string | null,
): CommunityStackParamList['CommunityList'] | null {
  const trimmedCommunityId = communityId?.trim();
  if (programType !== PROGRAM_TYPE.COMMUNITY || !trimmedCommunityId) {
    return null;
  }
  return {
    focusCommunityId: trimmedCommunityId,
    programType: PROGRAM_TYPE.COMMUNITY,
  };
}

export function subscribedProgramStackRoute(params: {
  programType?: ProgramType | null;
  communityId?: string | null;
  productId: string;
}): SubscribedProgramStackRoute {
  const communityParams = subscribedCommunityFeedParams(params.programType, params.communityId);
  if (communityParams) {
    return {
      screen: 'Community',
      params: {
        screen: 'CommunityList',
        params: communityParams,
      },
    };
  }
  return {
    screen: 'ProtocolDetail',
    params: { productId: params.productId },
  };
}

export function navigateToSubscribedProgram(
  navigation: Navigation,
  params: {
    programType?: ProgramType | null;
    communityId?: string | null;
    protocolDetailParams: RootStackParamList['ProtocolDetail'];
  },
): void {
  const communityParams = subscribedCommunityFeedParams(params.programType, params.communityId);
  if (communityParams) {
    navigateToCommunity(navigation, communityParams);
    return;
  }

  navigation.navigate('ProtocolDetail', params.protocolDetailParams);
}

export const handleAdNavigation = (ad: Ad, navigation: Navigation): void => {
  if (navigateToAmazonProduct(ad, navigation)) {
    return;
  }

  if (navigateToExternalProduct(ad, navigation)) {
    return;
  }

  navigateToProductDetails(ad, navigation);
};
