import { CommonActions, type NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { SHARE_CONFIG } from '@/config/environment';
import {
  AFFILIATE_SHARE_PATH_PREFIX,
  COMMUNITY_POST_SHARE_PATH_PREFIX,
  COMMUNITY_SHARE_PATH_PREFIX,
  PRODUCT_SHARE_PATH_PREFIX,
  PROTOCOL_SHARE_PATH_PREFIX,
  PROVIDER_SHARE_PATH_PREFIX,
  SHARE_CONTENT_TYPES,
  SHARE_DEEP_LINK_HOME_SCREEN,
  SHARE_QUERY_PARAMS,
  type ShareContentType,
} from '@/constants/share';
import storageService from '@/services/auth/storageService';
import type { CommunityStackParamList, RootStackParamList } from '@/types/navigation';
import {
  canNavigateFromDeepLink,
  consumePendingDeepLinkNavigation,
  hasPendingDeepLinkNavigation,
  setPendingDeepLinkNavigation,
  type PendingDeepLinkNavigationTarget,
} from '@/utils/navigation/pendingDeepLinkNavigation';
import { shareEntityIdFromPath, sharePathFromUrl, shareQueryParamFromUrl } from '@/utils/share/sharePath';

type ShareDeepLinkMatch = {
  contentType: ShareContentType;
  itemId: string;
  target: PendingDeepLinkNavigationTarget;
};

const SHARE_HOME_TARGET: PendingDeepLinkNavigationTarget = {
  screen: SHARE_DEEP_LINK_HOME_SCREEN,
};

function shareHostFromBaseUrl(): string | null {
  try {
    return new URL(SHARE_CONFIG.baseUrl).host;
  } catch {
    return null;
  }
}

function isShareHostUrl(url: string): boolean {
  const shareHost = shareHostFromBaseUrl();
  if (!shareHost) {
    return false;
  }

  try {
    return new URL(url.trim()).host === shareHost;
  } catch {
    return false;
  }
}

function communityPostTarget(postId: string): PendingDeepLinkNavigationTarget {
  return {
    screen: 'Community',
    params: {
      screen: 'PostDetail',
      params: { postId } as CommunityStackParamList['PostDetail'],
    } as RootStackParamList['Community'],
  };
}

function communityFeedTarget(communityId: string): PendingDeepLinkNavigationTarget {
  return {
    screen: 'Community',
    params: {
      screen: 'CommunityList',
      params: { focusCommunityId: communityId } as CommunityStackParamList['CommunityList'],
    } as RootStackParamList['Community'],
  };
}

function productDetailsTarget(productId: string): PendingDeepLinkNavigationTarget {
  return {
    screen: 'ProductDetails',
    params: { productId },
  };
}

function protocolDetailTarget(productId: string): PendingDeepLinkNavigationTarget {
  return {
    screen: 'ProtocolDetail',
    params: { productId },
  };
}

function affiliateProductTarget(productId: string, adId?: string): PendingDeepLinkNavigationTarget {
  return {
    screen: 'AffiliateProduct',
    params: adId ? { productId, adId } : { productId },
  };
}

function providerProfileTarget(providerId: string): PendingDeepLinkNavigationTarget {
  return {
    screen: 'ProviderProfile',
    params: { providerId },
  };
}

function shareDeepLinkMatchFromUrl(url: string): ShareDeepLinkMatch | null {
  const path = sharePathFromUrl(url);
  if (!path) {
    return null;
  }

  const postId = shareEntityIdFromPath(path, COMMUNITY_POST_SHARE_PATH_PREFIX);
  if (postId) {
    return {
      contentType: SHARE_CONTENT_TYPES.COMMUNITY_POST,
      itemId: postId,
      target: communityPostTarget(postId),
    };
  }

  const communityId = shareEntityIdFromPath(path, COMMUNITY_SHARE_PATH_PREFIX);
  if (communityId) {
    return {
      contentType: SHARE_CONTENT_TYPES.COMMUNITY,
      itemId: communityId,
      target: communityFeedTarget(communityId),
    };
  }

  const productId = shareEntityIdFromPath(path, PRODUCT_SHARE_PATH_PREFIX);
  if (productId) {
    return {
      contentType: SHARE_CONTENT_TYPES.PRODUCT,
      itemId: productId,
      target: productDetailsTarget(productId),
    };
  }

  const protocolProductId = shareEntityIdFromPath(path, PROTOCOL_SHARE_PATH_PREFIX);
  if (protocolProductId) {
    return {
      contentType: SHARE_CONTENT_TYPES.PROTOCOL,
      itemId: protocolProductId,
      target: protocolDetailTarget(protocolProductId),
    };
  }

  const affiliateProductId = shareEntityIdFromPath(path, AFFILIATE_SHARE_PATH_PREFIX);
  if (affiliateProductId) {
    const adId = shareQueryParamFromUrl(url, SHARE_QUERY_PARAMS.AD_ID) ?? undefined;
    return {
      contentType: SHARE_CONTENT_TYPES.AFFILIATE,
      itemId: affiliateProductId,
      target: affiliateProductTarget(affiliateProductId, adId),
    };
  }

  const providerId = shareEntityIdFromPath(path, PROVIDER_SHARE_PATH_PREFIX);
  if (providerId) {
    return {
      contentType: SHARE_CONTENT_TYPES.PROVIDER,
      itemId: providerId,
      target: providerProfileTarget(providerId),
    };
  }

  return null;
}

export function shareDeepLinkTargetFromUrl(url: string): PendingDeepLinkNavigationTarget | null {
  return shareDeepLinkMatchFromUrl(url)?.target ?? null;
}

function dispatchDeepLinkTarget(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  target: PendingDeepLinkNavigationTarget,
): void {
  navigationRef.dispatch(
    CommonActions.navigate({
      name: target.screen,
      params: target.params,
    }),
  );
}

async function hasStoredSessionToken(): Promise<boolean> {
  const token = await storageService.getToken();
  return Boolean(token?.trim());
}

function navigateToUnauthenticatedIfNeeded(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  activeRouteName: string | undefined,
): void {
  if (activeRouteName === 'Unauthenticated' || activeRouteName === 'Loading') {
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Unauthenticated' }],
    }),
  );
}

export async function openDeepLinkTarget(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  url: string,
  activeRouteName: string | undefined,
): Promise<void> {
  if (!navigationRef.isReady()) {
    return;
  }

  const path = sharePathFromUrl(url);
  if (!path) {
    return;
  }

  const match = shareDeepLinkMatchFromUrl(url);
  const target = match?.target ?? (isShareHostUrl(url) ? SHARE_HOME_TARGET : null);
  if (!target) {
    return;
  }

  if (match) {
    logEvent(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: match.contentType,
      [ANALYTICS_PARAMS.ITEM_ID]: match.itemId,
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_open',
    });
  } else {
    logEvent(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.CONTENT_TYPE]: 'unknown',
      [ANALYTICS_PARAMS.ITEM_ID]: path,
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_fallback_home',
    });
  }

  if (!canNavigateFromDeepLink(activeRouteName)) {
    setPendingDeepLinkNavigation(target);
    return;
  }

  const hasSession = await hasStoredSessionToken();
  if (!hasSession) {
    setPendingDeepLinkNavigation(target);
    navigateToUnauthenticatedIfNeeded(navigationRef, activeRouteName);
    return;
  }

  dispatchDeepLinkTarget(navigationRef, target);
  consumePendingDeepLinkNavigation();
}

export async function flushPendingDeepLinkNavigation(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  activeRouteName: string | undefined,
): Promise<void> {
  if (!navigationRef.isReady() || !canNavigateFromDeepLink(activeRouteName)) {
    return;
  }

  if (!hasPendingDeepLinkNavigation()) {
    return;
  }

  const hasSession = await hasStoredSessionToken();
  if (!hasSession) {
    navigateToUnauthenticatedIfNeeded(navigationRef, activeRouteName);
    return;
  }

  const target = consumePendingDeepLinkNavigation();
  if (!target) {
    return;
  }

  dispatchDeepLinkTarget(navigationRef, target);
}
