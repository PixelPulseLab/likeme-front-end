import { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { HOME_MVP_ASSETS } from '@/assets/homeMvp';
import { useTranslation } from '@/hooks/i18n';
import { FEATURE_FLAGS } from '@/constants';
import { useFeatureFlag } from '@/hooks/featureFlags/useFeatureFlag';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { navigateToMarketplace } from '@/utils/navigation/marketplaceNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';

type MenuItem = {
  id: string;
  icon?: string;
  iconImage?: ImageSourcePropType;
  label: string;
  fullLabel: string;
  onPress: () => void;
};

export const useMenuItems = (navigation: any): MenuItem[] => {
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const { t } = useTranslation();
  const shopLabel = t('community.solutions');
  const { isEnabled: isChatEnabled } = useFeatureFlag(FEATURE_FLAGS.CHAT_ENABLED);

  return useMemo(() => {
    const items: MenuItem[] = [
      {
        id: 'activities',
        icon: 'fitness-center',
        iconImage: HOME_MVP_ASSETS.navActivities,
        label: 'Atividades',
        fullLabel: 'Atividades',
        onPress: () => navigateRootStack(rootNavigation, 'Activities'),
      },
      {
        id: 'community',
        icon: 'group',
        iconImage: HOME_MVP_ASSETS.navCommunity,
        label: 'Comunidade',
        fullLabel: 'Comunidade',
        onPress: () => navigateToCommunity(rootNavigation, { openFeedFromMenu: true }),
      },
      {
        id: 'marketplace',
        icon: 'store',
        iconImage: HOME_MVP_ASSETS.navMarketplace,
        label: shopLabel,
        fullLabel: shopLabel,
        onPress: () => navigateToMarketplace(rootNavigation),
      },
    ];

    if (isChatEnabled) {
      items.splice(2, 0, {
        id: 'chat',
        icon: 'chat',
        iconImage: HOME_MVP_ASSETS.navChat,
        label: 'Chat',
        fullLabel: 'Chat',
        onPress: () => navigateRootStack(rootNavigation, 'Chat'),
      });
    }

    return items;
  }, [isChatEnabled, rootNavigation, shopLabel]);
};
