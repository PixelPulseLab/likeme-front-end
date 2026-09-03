import type { CommunityStackParamList, RootStackParamList } from '@/types/navigation';
import { navigateWithAppLoading } from '@/utils/navigation/appLoadingNavigation';

type Navigation = {
  navigate: (screen: string, params?: unknown) => void;
  replace?: (screen: string, params?: unknown) => void;
};

export function navigateToCommunity(
  navigation: Navigation,
  communityListParams?: CommunityStackParamList['CommunityList'],
  options?: { replace?: boolean },
): void {
  const params: RootStackParamList['Community'] = {
    screen: 'CommunityList',
    params: communityListParams,
  };
  navigateWithAppLoading(navigation, { name: 'Community', params }, options);
}
