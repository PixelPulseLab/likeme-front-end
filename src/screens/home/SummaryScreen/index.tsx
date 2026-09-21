import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GradientBackground, ScreenWithHeader } from '@/components/ui/layout';
import { PullToRefreshIndicator, usePullToRefresh } from '@/components/ui/feedback/PullToRefresh';
import { SearchBar } from '@/components/ui/inputs';
import { StickyFilterCarouselRow } from '@/components/ui/menu';
import {
  useCommunities,
  useSuggestedProducts,
  useMenuItems,
  useSolutions,
  useSessionTokenReady,
  useCategories,
  useCommunityEventBanner,
  useAdvertisers,
} from '@/hooks';
import {
  HOME_SUMMARY_COMMUNITIES_LIST_PARAMS,
  HOME_SUMMARY_COMMUNITIES_PAGE_SIZE,
  HOME_SUMMARY_SUGGESTED_PROGRAMS_QUERY,
} from '@/constants/home/summaryHomeData';
import { EventBanner, NotificationPreferencesPrompt } from '@/components/sections/community';
import { notificationPreferenceService } from '@/services/notification/notificationPreferenceService';
import { EventWebViewSession } from '@/components/infrastructure/webview/EventWebViewSession';
import { styles as socialListStyles } from '@/components/sections/community/SocialList/styles';
import { FilterCategoryModal, type FilterCategoryResult } from '@/components/ui/modals';
import { useFloatingMenuActions } from '@/contexts/FloatingMenuContext';
import { useTranslation } from '@/hooks/i18n';
import { logger } from '@/utils/logger';
import { communityService, storageService } from '@/services';
import { PopularProvidersSection, type Provider } from '@/components/sections/community';
import { type JoinCardItem } from '@/components/ui/cards';
import { JoinCardList } from '@/components/ui/lists/JoinCardList';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import ProfileFloatingMenu from '@/components/sections/profile/ProfileFloatingMenu';
// TODO: Temporariamente desabilitados
// import { AnamnesisPromptCard } from '@/components/sections/anamnesis';
// import { AvatarSection } from '@/components/sections/avatar';
import { useAnalyticsScreen } from '@/analytics';
import { getCommunityStackNavigator } from '@/navigation/rootStackScreenLoaders';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import {
  navigateToProviderProfile,
  navigateToMarketplace,
  marketplaceRouteParamsFromFilterApply,
  marketplaceRouteParamsFromFilterClear,
  marketplaceRouteParamsFromHomeCarousel,
} from '@/utils/navigation/marketplaceNavigation';
import { marketplaceSolutionOptions, SOLUTION_TAB_ALL, type MarketplaceSolutionTab } from '@/types/solution';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';
import type { RootStackParamList } from '@/types/navigation';
import { ADVERTISER_STATUS, ADVERTISER_TYPE } from '@/constants';
import { styles } from './styles';

type Props = {
  navigation: any;
  route: any;
};
const SummaryScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'Summary', screenClass: 'SummaryScreen' });
  const { t } = useTranslation();
  const { marketplaceCarouselOptions } = useSolutions();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const hasSessionToken = useSessionTokenReady();
  const [userAvatarUri, setUserAvatarUri] = useState<string | null>(null);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [isHomeFilterModalVisible, setIsHomeFilterModalVisible] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const { categories } = useCategories({ enabled: hasSessionToken });
  // TODO: Temporariamente desabilitados
  // const [hasCompletedAnamnesis, setHasCompletedAnamnesis] = useState<boolean>(false);
  // const [hasAnyAnamnesisAnswers, setHasAnyAnamnesisAnswers] = useState<boolean>(false);
  // const { progress: _anamnesisProgress } = useAnamnesisProgress();
  // const { scores: anamnesisScores, refresh: refreshAnamnesisScores } = useAnamnesisScores();

  // useFocusEffect(
  //   useCallback(() => {
  //     refreshAnamnesisScores();
  //   }, [refreshAnamnesisScores]),
  // );

  useEffect(() => {
    const loadUser = async () => {
      const user = await storageService.getUser();
      setUserAvatarUri(user?.picture ?? null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!hasSessionToken) {
      return;
    }
    getCommunityStackNavigator();
  }, [hasSessionToken]);

  const handleCartPress = () => {
    navigateRootStack(rootNavigation, 'Cart');
  };

  const handleMenuPress = () => {
    setIsProfileMenuVisible(true);
  };

  const openMarketplaceFromHome = useCallback(
    (params?: Parameters<typeof navigateToMarketplace>[1]) => {
      navigateToMarketplace(rootNavigation, params);
    },
    [rootNavigation],
  );

  const handleHomeSearchPress = useCallback(() => {
    const trimmed = homeSearchQuery.trim();
    openMarketplaceFromHome(trimmed ? { initialSearch: trimmed } : undefined);
  }, [homeSearchQuery, openMarketplaceFromHome]);

  const handleHomeFilterPress = useCallback(() => {
    setIsHomeFilterModalVisible(true);
  }, []);

  const handleHomeFilterApply = useCallback(
    (result: FilterCategoryResult) => {
      openMarketplaceFromHome(marketplaceRouteParamsFromFilterApply(result));
    },
    [openMarketplaceFromHome],
  );

  const handleHomeFilterClear = useCallback(() => {
    openMarketplaceFromHome(marketplaceRouteParamsFromFilterClear());
  }, [openMarketplaceFromHome]);

  const handleHomeCarouselSelect = useCallback(
    (solutionId: MarketplaceSolutionTab) => {
      openMarketplaceFromHome(marketplaceRouteParamsFromHomeCarousel(solutionId));
    },
    [openMarketplaceFromHome],
  );

  const categoryFilterButtonLabel = t('marketplace.category');

  // TODO: Temporariamente desabilitados
  // const handleStartAnamnesis = () => {
  //   rootNavigation.navigate('Anamnesis' as never);
  // };
  // const handleAvatarSeeMore = () => {
  //   rootNavigation.navigate('AvatarProgress' as never);
  // };
  // const handleShareAvatar = async () => {
  //   try {
  //     const mindPct = anamnesisScores?.mentalPercentage || 0;
  //     const bodyPct = anamnesisScores?.physicalPercentage || 0;
  //     const message = t('avatar.shareMessage', {
  //       mindPercentage: mindPct,
  //       bodyPercentage: bodyPct,
  //     });
  //     await Share.share({ message });
  //   } catch (error) {
  //     console.log('Share cancelled or failed:', error);
  //   }
  // };

  // TODO: Temporariamente desabilitado
  // useEffect(() => {
  //   const checkAnamnesisStatus = async () => { ... };
  //   checkAnamnesisStatus();
  // }, []);

  const {
    filteredJoinCommunities,
    loading: _communitiesLoading,
    refresh: refreshCommunities,
  } = useCommunities({
    enabled: hasSessionToken,
    pageSize: HOME_SUMMARY_COMMUNITIES_PAGE_SIZE,
    params: HOME_SUMMARY_COMMUNITIES_LIST_PARAMS,
  });

  useFocusEffect(
    useCallback(() => {
      if (!hasSessionToken) {
        return;
      }
      refreshCommunities();
    }, [hasSessionToken, refreshCommunities]),
  );

  const homeBannerCommunity = filteredJoinCommunities[0];
  const homeBannerCommunityId = homeBannerCommunity?.id?.trim() ?? '';

  const { eventBanner, eventJoinUrl, closeEventSession, handleEventBannerPress, handleEventBannerCtaPress } =
    useCommunityEventBanner({
      enabled: hasSessionToken && Boolean(homeBannerCommunityId),
      communityId: homeBannerCommunityId,
      communityAvatarUrl: homeBannerCommunity?.image,
      communityProviderName: homeBannerCommunity?.title,
      onlyOnEventDay: true,
      navigation: rootNavigation as StackNavigationProp<RootStackParamList>,
    });

  const { advertisers: popularAdvertisers, refresh: refreshPopularAdvertisers } = useAdvertisers({
    listOptions: {
      page: 1,
      limit: 10,
      status: ADVERTISER_STATUS.ACTIVE,
      type: ADVERTISER_TYPE.PERSON,
    },
    enabled: hasSessionToken,
  });
  const popularProviders = useMemo<Provider[]>(
    () =>
      popularAdvertisers.map((advertiser) => ({
        id: advertiser.id,
        name: advertiser.name,
        avatar: advertiser.logo,
      })),
    [popularAdvertisers],
  );

  const { products: suggestedPrograms, refresh: refreshSuggestedPrograms } = useSuggestedProducts({
    ...HOME_SUMMARY_SUGGESTED_PROGRAMS_QUERY,
    enabled: hasSessionToken,
  });

  const recommendedProgramCards = useMemo(
    (): JoinCardItem[] =>
      suggestedPrograms.map((p) => ({
        id: p.id,
        title: p.title,
        badges: p.tags ?? [],
        image: p.image,
      })),
    [suggestedPrograms],
  );

  const recommendedProductsRefreshRef = useRef<(() => Promise<void>) | null>(null);

  const refreshHome = useCallback(async () => {
    try {
      await Promise.all([
        refreshCommunities(),
        refreshSuggestedPrograms(),
        refreshPopularAdvertisers(),
        recommendedProductsRefreshRef.current?.() ?? Promise.resolve(),
      ]);
    } catch (cause) {
      logger.error('[SummaryScreen] Falha ao atualizar a home', { cause });
    }
  }, [refreshCommunities, refreshSuggestedPrograms, refreshPopularAdvertisers]);

  const {
    showIndicator: showPullIndicator,
    onScroll: onPullScroll,
    refreshControl: pullRefreshControl,
  } = usePullToRefresh(refreshHome);

  const menuItems = useMenuItems(navigation);
  const { setMenu } = useFloatingMenuActions();

  useFocusEffect(
    useCallback(() => {
      setMenu(menuItems, 'home');
    }, [menuItems, setMenu]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasSessionToken) {
        return;
      }
      let cancelled = false;
      notificationPreferenceService
        .shouldShowNotificationPrompt()
        .then((show) => {
          if (!cancelled) {
            setShowNotificationPrompt(show);
          }
        })
        .catch((error) => {
          logger.error('[SummaryScreen] Falha ao ler se o popup de notificações deve aparecer', error);
        });
      return () => {
        cancelled = true;
      };
    }, [hasSessionToken]),
  );

  const handleNotificationPromptClose = useCallback(() => {
    setShowNotificationPrompt(false);
    notificationPreferenceService.dismissPrompt().catch((error) => {
      logger.error('[SummaryScreen] Falha ao dispensar o popup de notificações', error);
    });
  }, []);

  const handleDefineNotifications = useCallback(() => {
    setShowNotificationPrompt(false);
    navigateRootStack(rootNavigation, 'NotificationPreferences');
  }, [rootNavigation]);

  const handleProviderPress = (provider: Provider) => {
    navigateToProviderProfile(rootNavigation, {
      providerId: provider.id,
      provider: { name: provider.name, avatar: provider.avatar },
    });
  };

  const handleJoinCommunity = useCallback(
    (community: JoinCardItem) => {
      navigateToCommunity(rootNavigation, {
        openFeedFromMenu: true,
        focusCommunityId: community.id,
      });
      void communityService.joinCommunity(community.id).catch((error) => {
        logger.error('[SummaryScreen] Falha ao entrar na comunidade em background', {
          communityId: community.id,
          cause: error,
        });
      });
    },
    [rootNavigation],
  );

  const handleProgramPress = useCallback(
    (program: JoinCardItem) => {
      navigateToProductDetailsScreen(rootNavigation, { productId: program.id });
    },
    [rootNavigation],
  );

  return (
    <>
      <ScreenWithHeader
        navigation={navigation}
        testID='e2e.summary.root'
        headerProps={{
          showBackButton: false,
          showMenuWithAvatar: true,
          onMenuPress: handleMenuPress,
          userAvatarUri,
          showCartButton: true,
          onCartPress: handleCartPress,
        }}
        contentContainerStyle={styles.content}
      >
        <View pointerEvents='none' style={styles.gradientBackground}>
          <GradientBackground />
        </View>
        <View style={styles.content}>
          <PullToRefreshIndicator visible={showPullIndicator} accessibilityLabel={t('common.loading')} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            scrollEventThrottle={16}
            onScroll={onPullScroll}
            refreshControl={pullRefreshControl}
          >
            <View style={styles.searchAndFilters}>
              <SearchBar
                placeholder={t('marketplace.searchPlaceholder')}
                value={homeSearchQuery}
                onChangeText={setHomeSearchQuery}
                onSearchPress={handleHomeSearchPress}
                showFilterButton={false}
              />
              <StickyFilterCarouselRow<MarketplaceSolutionTab>
                filterButtonLabel={categoryFilterButtonLabel}
                onFilterButtonPress={handleHomeFilterPress}
                carouselOptions={marketplaceCarouselOptions}
                selectedCarouselId={SOLUTION_TAB_ALL}
                onCarouselSelect={handleHomeCarouselSelect}
              />
            </View>

            {eventBanner ? (
              <View style={socialListStyles.eventBannerContainer}>
                <EventBanner
                  event={eventBanner}
                  onPress={handleEventBannerPress}
                  onCtaPress={handleEventBannerCtaPress}
                />
              </View>
            ) : null}

            {filteredJoinCommunities.length > 0 && (
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>{t('home.recommendedCommunitySectionTitle')}</Text>
                <View style={styles.sectionContainer}>
                  <JoinCardList
                    items={filteredJoinCommunities}
                    onItemPress={handleJoinCommunity}
                    layout={filteredJoinCommunities.length > 1 ? 'list' : 'carousel'}
                  />
                </View>
              </View>
            )}

            {recommendedProgramCards.length > 0 && (
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>{t('home.recommendedProgramSectionTitle')}</Text>
                <View style={styles.sectionContainer}>
                  <JoinCardList items={recommendedProgramCards} onItemPress={handleProgramPress} />
                </View>
              </View>
            )}
            {/* TODO: Avatar e Anamnese temporariamente desabilitados
          {(hasAnyAnamnesisAnswers || hasCompletedAnamnesis) && (
            <View style={styles.avatarContainer}>
              <AvatarSection
                hasAnswers={hasAnyAnamnesisAnswers || hasCompletedAnamnesis}
                mindPercentage={anamnesisScores?.mentalPercentage || 0}
                bodyPercentage={anamnesisScores?.physicalPercentage || 0}
                onSharePress={handleShareAvatar}
                onSeeMorePress={handleAvatarSeeMore}
              />
            </View>
          )}
          {!hasCompletedAnamnesis && (
            <View style={styles.anamnesisPromptContainer}>
              <AnamnesisPromptCard onStartPress={handleStartAnamnesis} />
            </View>
          )}
          {!hasAnyAnamnesisAnswers && !hasCompletedAnamnesis && (
            <View style={styles.avatarContainer}>
              <AvatarSection
                hasAnswers={false}
                mindPercentage={0}
                bodyPercentage={0}
                onSeeMorePress={handleAvatarSeeMore}
              />
            </View>
          )}
          */}
            {popularProviders.length > 0 && (
              <View style={[styles.sectionDivider]}>
                <PopularProvidersSection providers={popularProviders} onProviderPress={handleProviderPress} />
              </View>
            )}
            <RecommendedProductsSection
              navigation={rootNavigation as StackNavigationProp<RootStackParamList, keyof RootStackParamList>}
              analyticsScreenName='summary'
              enabled={hasSessionToken}
              refreshRef={recommendedProductsRefreshRef}
              style={[
                styles.productsContainer,
                styles.sectionDivider,
                styles.sectionContainer,
                styles.sectionRetreatedContainer,
              ]}
            />
          </ScrollView>
        </View>
        <ProfileFloatingMenu
          visible={isProfileMenuVisible}
          navigation={rootNavigation}
          onClose={() => setIsProfileMenuVisible(false)}
        />
        <FilterCategoryModal
          visible={isHomeFilterModalVisible}
          onClose={() => setIsHomeFilterModalVisible(false)}
          categories={categories}
          selectedCategoryId={undefined}
          onSelectCategory={() => {}}
          selectedSolutionIds={[]}
          solutionOptions={marketplaceSolutionOptions}
          onFilter={handleHomeFilterApply}
          onClear={handleHomeFilterClear}
        />
        {eventJoinUrl ? <EventWebViewSession url={eventJoinUrl} onClose={closeEventSession} /> : null}
      </ScreenWithHeader>
      <NotificationPreferencesPrompt
        visible={showNotificationPrompt}
        onClose={handleNotificationPromptClose}
        onDefine={handleDefineNotifications}
      />
    </>
  );
};

export default SummaryScreen;
