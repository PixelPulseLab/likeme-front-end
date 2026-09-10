import type { CommunityStackParamList, RootStackParamList } from '@/types/navigation';
import { preloadAppLoadingTarget } from '@/utils/navigation/appLoadingNavigation';
import { navigateRootStack } from '@/utils/navigation/rootStackNavigation';

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
  replace?: (screen: string, params?: unknown) => void;
};

export function navigateToCommunity(
  navigation: Navigation,
  communityListParams?: CommunityStackParamList['CommunityList'],
  options?: { replace?: boolean },
): void {
  // A comunidade já mostra o Loading; o hop AppLoading repetia os dois pontos sem header.
  preloadAppLoadingTarget('Community');
  const params: RootStackParamList['Community'] = {
    screen: 'CommunityList',
    params: communityListParams,
  };
  if (options?.replace && typeof navigation.replace === 'function') {
    navigation.replace('Community', params);
    return;
  }
  navigateRootStack(navigation, 'Community', params);
}
