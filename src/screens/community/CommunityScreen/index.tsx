import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, ScrollView, FlatList, Text, ActivityIndicator, type ListRenderItem, type ViewToken } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  ShoppingList,
  EventBanner,
  PostCard,
  NextEventsSection,
  CommunityDescriptionSection,
  FeaturedPostsSection,
  type CommunityDescriptionSpecialist,
} from '@/components/sections/community';
import { styles as socialListStyles } from '@/components/sections/community/SocialList/styles';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import { EmptyState, ShareContentUnavailable } from '@/components/ui';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import type { Post } from '@/types';
import { type ButtonCarouselOption } from '@/components/ui/carousel';
import InfoSectionTabsRow from '@/components/ui/carousel/InfoSectionTabsRow';
import { HeroImage, ScreenWithHeader } from '@/components/ui/layout';
import type { FeedEvent } from '@/types/event';
import { SPACING, COMMUNITY_FEED_POSTS_PAGE_SIZE, ADVERTISER_STATUS } from '@/constants';
import { styles } from './styles';
import type { CommunityStackParamList, RootStackParamList } from '@/types/navigation';
import {
  useUserFeed,
  useCommunityFeaturedPost,
  useCommunities,
  useCommunity,
  useAdvertisers,
  useProviderAds,
  useMenuItems,
  useCommunityEventBanner,
} from '@/hooks';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen, logTabSelect } from '@/analytics';
import { storageService } from '@/services';
import { logger } from '@/utils/logger';
import { resolveCommunityHeroImageUri } from '@/utils/community/mappers';
import { navigateToProviderProfile } from '@/utils/navigation/marketplaceNavigation';
import { goBackOrShareHome, navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';
import { navigateToShareDiscover } from '@/utils/navigation/shareDiscoverNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { shareContent } from '@/utils/share/shareContent';
import { filterAdsForProviderProfile } from '@/utils/marketplace/filterAdsForProviderProfile';
import type { Advertiser } from '@/types/ad';
import type { ShopTabId } from '@/components/sections/community/ShoppingList';
import Toggle from '@/components/ui/buttons/Toggle';
import { Checkbox } from '@/components/ui/inputs';
import { EventWebViewSession } from '@/components/infrastructure/webview/EventWebViewSession';

type CommunityInfoTabId = 'posts' | 'about' | 'agreements';

const COMMUNITY_VIEW = {
  FEED: 'feed',
  SOLUTIONS: 'solutions',
} as const;

type CommunityViewId = (typeof COMMUNITY_VIEW)[keyof typeof COMMUNITY_VIEW];

type NavigationProp = StackNavigationProp<CommunityStackParamList, 'CommunityList'>;
type Props = { navigation: NavigationProp };

/** Imagem padrão do hero quando a comunidade não tem avatar. */
const DEFAULT_COMMUNITY_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400';

const CommunityScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'CommunityList', screenClass: 'CommunityScreen' });
  const route = useRoute<RouteProp<CommunityStackParamList, 'CommunityList'>>();
  const { t } = useTranslation();
  const toggleOptions = useMemo(() => [t('community.social'), t('community.solutions')] as const, [t]);
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const handleCartPress = () => {
    navigateRootStack(rootNavigation, 'Cart');
  };
  const [selectedMode, setSelectedMode] = useState<CommunityViewId>(COMMUNITY_VIEW.FEED);
  const [activeInfoTab, setActiveInfoTab] = useState<CommunityInfoTabId>('posts');
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);
  const [shoppingTipDismissed, setShoppingTipDismissed] = useState(true);
  const [isCommunityFavorite, setIsCommunityFavorite] = useState(false);

  const toggleSelectedLabel = useMemo(
    () => (selectedMode === COMMUNITY_VIEW.FEED ? toggleOptions[0] : toggleOptions[1]),
    [selectedMode, toggleOptions],
  );

  useEffect(() => {
    if (!route.params?.openFeedFromMenu) return;
    setSelectedMode(COMMUNITY_VIEW.FEED);
    navigation.setParams({ openFeedFromMenu: undefined });
  }, [navigation, route.params?.openFeedFromMenu]);

  const focusCommunityId = route.params?.focusCommunityId?.trim() || undefined;

  useEffect(() => {
    if (!focusCommunityId) return;
    setSelectedMode(COMMUNITY_VIEW.FEED);
    setActiveInfoTab('posts');
  }, [focusCommunityId]);

  useEffect(() => {
    storageService.getCommunityWelcomeDismissed().then(setWelcomeDismissed);
  }, []);

  useEffect(() => {
    storageService.getCommunityShoppingTipDismissed().then(setShoppingTipDismissed);
  }, []);

  const handleWelcomeClose = useCallback(() => {
    setWelcomeDismissed(true);
    storageService.setCommunityWelcomeDismissed(true);
  }, []);

  const handleShoppingTipClose = useCallback(() => {
    setShoppingTipDismissed(true);
    storageService.setCommunityShoppingTipDismissed(true);
  }, []);

  const isFeedMode = selectedMode === COMMUNITY_VIEW.FEED;
  const loadCommunityEvents = isFeedMode;

  const {
    communities: rawCommunities,
    categories,
    loading: communitiesLoading,
    loadingMore: _communitiesLoadingMore,
    error: _communitiesError,
    hasMore: _communitiesHasMore,
    loadMore: _loadMoreCommunities,
    refresh: _refreshCommunities,
    feedEvents,
    communityFiles,
  } = useCommunities({
    enabled: true,
    pageSize: 10,
    params: {
      sortBy: 'createdAt',
      includeDeleted: false,
    },
  });

  const selectedCommunity = useMemo(() => {
    if (focusCommunityId) {
      return rawCommunities.find((community) => community.communityId === focusCommunityId) ?? null;
    }
    return rawCommunities[0] ?? null;
  }, [rawCommunities, focusCommunityId]);

  const selectedCommunityId = focusCommunityId ?? selectedCommunity?.communityId;

  const focusCommunityUnavailable = Boolean(
    focusCommunityId &&
      !communitiesLoading &&
      !rawCommunities.some((community) => community.communityId === focusCommunityId),
  );

  const handleGoHome = useCallback(() => {
    navigateToShareHome(rootNavigation ?? navigation);
  }, [navigation, rootNavigation]);

  const handleDiscover = useCallback(() => {
    navigateToShareDiscover(rootNavigation ?? navigation);
  }, [navigation, rootNavigation]);

  const handleSharePress = useCallback(async () => {
    const communityId = selectedCommunityId?.trim();
    if (!communityId) {
      return;
    }
    await shareContent({ contentType: SHARE_CONTENT_TYPES.COMMUNITY, communityId }, { screenName: 'community_list' });
  }, [selectedCommunityId]);

  const { termsAccepted: communityTermsAccepted, toggleTermsAccepted: toggleCommunityTermsAccepted } = useCommunity({
    communityId: activeInfoTab === 'agreements' ? selectedCommunityId : undefined,
  });

  useEffect(() => {
    if (!selectedCommunityId) {
      setIsCommunityFavorite(false);
      return;
    }
    let cancelled = false;
    storageService.isCommunityFavorite(selectedCommunityId).then((fav) => {
      if (!cancelled) setIsCommunityFavorite(fav);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCommunityId]);

  const solutionsMode = selectedMode === COMMUNITY_VIEW.SOLUTIONS;
  const feedParams = useMemo(
    () => (selectedCommunityId?.trim() ? { communityId: selectedCommunityId.trim() } : {}),
    [selectedCommunityId],
  );
  const {
    posts,
    loading: feedLoading,
    loadingMore,
    error,
    hasMore: feedHasMore,
    loadMore,
  } = useUserFeed({
    enabled: isFeedMode && Boolean(selectedCommunityId?.trim()),
    searchQuery: '',
    pageSize: COMMUNITY_FEED_POSTS_PAGE_SIZE,
    params: feedParams,
  });

  const { post: featuredPost } = useCommunityFeaturedPost({
    communityId: selectedCommunityId,
    enabled: isFeedMode && activeInfoTab === 'posts' && Boolean(selectedCommunityId?.trim()),
  });

  const feedLoadMoreLockedRef = useRef(false);
  const feedHasMoreRef = useRef(feedHasMore);
  const feedLoadingRef = useRef(feedLoading);
  const feedLoadingMoreRef = useRef(loadingMore);
  feedHasMoreRef.current = feedHasMore;
  feedLoadingRef.current = feedLoading;
  feedLoadingMoreRef.current = loadingMore;

  const communityAdvertiserFetchEnabled = !!selectedCommunityId && (solutionsMode || !feedLoading || posts.length > 0);

  const { advertisers: communityAdvertisers, loading: communityAdvertisersLoading } = useAdvertisers({
    communityId: selectedCommunityId,
    listOptions: { page: 1, limit: 20, status: ADVERTISER_STATUS.ACTIVE },
    fetchAllPages: false,
    enabled: communityAdvertiserFetchEnabled,
  });
  const advertiser = communityAdvertisers[0] ?? null;
  const communityProviderId = advertiser?.id;
  const communityProviderName = advertiser?.name?.trim() ?? null;

  const { eventBanner, eventJoinUrl, closeEventSession, handleEventBannerPress, handleEventBannerCtaPress } =
    useCommunityEventBanner({
      enabled: loadCommunityEvents,
      communityId: selectedCommunityId,
      communityAvatarUrl: selectedCommunity?.avatarUrl,
      communityProviderName,
      navigation: rootNavigation as StackNavigationProp<RootStackParamList>,
    });

  const handleProfessionalPress = (advertiser: Advertiser) => {
    if (!rootNavigation) return;
    navigateToProviderProfile(rootNavigation, { providerId: advertiser.id });
  };

  const feedRecommendationsEnabled =
    isFeedMode && (activeInfoTab === 'posts' || activeInfoTab === 'about') && (!feedLoading || posts.length > 0);

  const [selectedShopTabId, setSelectedShopTabId] = useState<ShopTabId>('products');
  const [shopProductsPage, setShopProductsPage] = useState(1);
  const [shopServicesPage, setShopServicesPage] = useState(1);
  const [shopProgramsPage, setShopProgramsPage] = useState(1);

  const communityShopSolutionsActive = solutionsMode;
  const communityShopTabsEnabled = solutionsMode && !!communityProviderId;
  const shopTabsPrefetchForProviderRef = useRef<string | null>(null);

  const { advertisers: shopProfessionals, loading: shopProfessionalsLoading } = useAdvertisers({
    listOptions: { page: 1, limit: 50, status: ADVERTISER_STATUS.ACTIVE },
    fetchAllPages: true,
    enabled: communityShopSolutionsActive,
  });

  const {
    ads: shopProductsAdsRaw,
    loading: shopProductsLoading,
    hasMore: shopProductsHasMore,
    loadAds: loadShopProductsAds,
  } = useProviderAds({
    advertiserId: communityProviderId,
    selectedCategory: 'products',
    page: shopProductsPage,
    enabled: communityShopTabsEnabled,
  });
  const {
    ads: shopServicesAdsRaw,
    loading: shopServicesLoading,
    hasMore: shopServicesHasMore,
    loadAds: loadShopServicesAds,
  } = useProviderAds({
    advertiserId: communityProviderId,
    selectedCategory: 'services',
    page: shopServicesPage,
    enabled: communityShopTabsEnabled,
  });
  const {
    ads: shopProgramsAdsRaw,
    loading: shopProgramsLoading,
    hasMore: shopProgramsHasMore,
    loadAds: loadShopProgramsAds,
  } = useProviderAds({
    advertiserId: communityProviderId,
    selectedCategory: 'programs',
    page: shopProgramsPage,
    enabled: communityShopTabsEnabled,
  });

  const filterShopAdsByCommunityProvider = useCallback(
    (ads: typeof shopProductsAdsRaw) => {
      if (!communityProviderId) {
        return [];
      }
      return filterAdsForProviderProfile(ads, communityProviderId, advertiser?.userId);
    },
    [communityProviderId, advertiser?.userId],
  );

  const shopProductsAds = useMemo(
    () => filterShopAdsByCommunityProvider(shopProductsAdsRaw),
    [filterShopAdsByCommunityProvider, shopProductsAdsRaw],
  );
  const shopServicesAds = useMemo(
    () => filterShopAdsByCommunityProvider(shopServicesAdsRaw),
    [filterShopAdsByCommunityProvider, shopServicesAdsRaw],
  );
  const shopProgramsAds = useMemo(
    () => filterShopAdsByCommunityProvider(shopProgramsAdsRaw),
    [filterShopAdsByCommunityProvider, shopProgramsAdsRaw],
  );

  useEffect(() => {
    setShopProductsPage(1);
    setShopServicesPage(1);
    setShopProgramsPage(1);
    shopTabsPrefetchForProviderRef.current = null;
  }, [communityProviderId]);

  useEffect(() => {
    if (!communityShopTabsEnabled || !communityProviderId) {
      return;
    }
    if (shopTabsPrefetchForProviderRef.current === communityProviderId) {
      return;
    }
    shopTabsPrefetchForProviderRef.current = communityProviderId;
    if (selectedShopTabId !== 'products') {
      void loadShopProductsAds();
    }
    if (selectedShopTabId !== 'services') {
      void loadShopServicesAds();
    }
    if (selectedShopTabId !== 'programs') {
      void loadShopProgramsAds();
    }
  }, [
    communityShopTabsEnabled,
    communityProviderId,
    selectedShopTabId,
    loadShopProductsAds,
    loadShopServicesAds,
    loadShopProgramsAds,
  ]);

  useEffect(() => {
    if (!communityShopTabsEnabled || selectedShopTabId !== 'products') return;
    loadShopProductsAds();
  }, [communityShopTabsEnabled, selectedShopTabId, shopProductsPage, loadShopProductsAds]);

  useEffect(() => {
    if (!communityShopTabsEnabled || selectedShopTabId !== 'services') return;
    loadShopServicesAds();
  }, [communityShopTabsEnabled, selectedShopTabId, shopServicesPage, loadShopServicesAds]);

  useEffect(() => {
    if (!communityShopTabsEnabled || selectedShopTabId !== 'programs') return;
    loadShopProgramsAds();
  }, [communityShopTabsEnabled, selectedShopTabId, shopProgramsPage, loadShopProgramsAds]);

  const shopTabState = useMemo(() => {
    switch (selectedShopTabId) {
      case 'products':
        return { ads: shopProductsAds, loading: shopProductsLoading, hasMore: shopProductsHasMore };
      case 'services':
        return { ads: shopServicesAds, loading: shopServicesLoading, hasMore: shopServicesHasMore };
      case 'programs':
        return { ads: shopProgramsAds, loading: shopProgramsLoading, hasMore: shopProgramsHasMore };
      case 'professionals':
      default:
        return { ads: [], loading: false, hasMore: false };
    }
  }, [
    selectedShopTabId,
    shopProductsAds,
    shopProductsLoading,
    shopProductsHasMore,
    shopServicesAds,
    shopServicesLoading,
    shopServicesHasMore,
    shopProgramsAds,
    shopProgramsLoading,
    shopProgramsHasMore,
  ]);

  const shopListLoading =
    selectedShopTabId === 'professionals'
      ? shopProfessionalsLoading && shopProfessionals.length === 0
      : (!communityProviderId && communityAdvertisersLoading) || shopTabState.loading;

  const handleShopLoadMore = useCallback(() => {
    if (selectedShopTabId === 'products') {
      setShopProductsPage((prev) => prev + 1);
    } else if (selectedShopTabId === 'services') {
      setShopServicesPage((prev) => prev + 1);
    } else if (selectedShopTabId === 'programs') {
      setShopProgramsPage((prev) => prev + 1);
    }
  }, [selectedShopTabId]);

  // Navegação raiz para ProductDetails/ProviderProfile a partir do ShoppingList.
  const shopNavigation = (rootNavigation ?? navigation) as unknown as StackNavigationProp<
    RootStackParamList,
    keyof RootStackParamList
  >;

  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'community');

  const handleModeSelect = useCallback(
    (label: string) => {
      if (label === toggleOptions[0]) {
        setSelectedMode(COMMUNITY_VIEW.FEED);
      } else {
        setSelectedMode(COMMUNITY_VIEW.SOLUTIONS);
      }
    },
    [toggleOptions],
  );

  const handleEventPress = useCallback((event: FeedEvent) => {
    logger.debug('[CommunityScreen] event press (stub)', { eventId: event.id });
  }, []);

  const handleEventSave = useCallback((event: FeedEvent) => {
    logger.debug('[CommunityScreen] event save (stub)', { eventId: event.id });
  }, []);

  const tryLoadMoreFeed = useCallback(() => {
    if (selectedMode !== COMMUNITY_VIEW.FEED) {
      return;
    }
    if (
      feedLoadMoreLockedRef.current ||
      feedLoadingRef.current ||
      feedLoadingMoreRef.current ||
      !feedHasMoreRef.current
    ) {
      return;
    }
    feedLoadMoreLockedRef.current = true;
    loadMore();
  }, [loadMore, selectedMode]);

  useEffect(() => {
    if (!feedLoading && !loadingMore) {
      feedLoadMoreLockedRef.current = false;
    }
  }, [feedLoading, loadingMore]);

  const feedPostsCountRef = useRef(0);
  const tryLoadMoreFeedRef = useRef(tryLoadMoreFeed);
  tryLoadMoreFeedRef.current = tryLoadMoreFeed;

  const feedViewabilityConfig = useRef({ itemVisiblePercentThreshold: 20 }).current;

  const onFeedViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const lastIndex = feedPostsCountRef.current - 1;
    if (lastIndex < 0) {
      return;
    }
    const lastPostVisible = viewableItems.some((token) => token.index === lastIndex && token.isViewable);
    if (lastPostVisible) {
      tryLoadMoreFeedRef.current();
    }
  }).current;

  const handleLoadMore = useCallback(() => {
    tryLoadMoreFeed();
  }, [tryLoadMoreFeed]);

  const handlePostCardPress = useCallback(
    (selectedPost: Post) => {
      navigation.navigate('PostDetail' as never, { post: selectedPost } as never);
    },
    [navigation],
  );

  const handlePostSharePress = useCallback(async (post: Post) => {
    const postId = post.id?.trim();
    if (!postId) {
      return;
    }
    await shareContent({ contentType: SHARE_CONTENT_TYPES.COMMUNITY_POST, postId }, { screenName: 'community_list' });
  }, []);

  const renderPostItem = useCallback<ListRenderItem<Post>>(
    ({ item }) => (
      <View style={styles.feedItemWrapper}>
        <PostCard post={item} onPress={handlePostCardPress} onSharePress={handlePostSharePress} />
      </View>
    ),
    [handlePostCardPress, handlePostSharePress],
  );

  const renderPostSeparator = useCallback(() => <View style={styles.feedItemSeparator} />, []);

  const postKeyExtractor = useCallback((post: Post) => post.id, []);

  const communityHeroBadges = useMemo(() => {
    const firstTwo = categories?.slice(0, 2) ?? [];
    return firstTwo.map((c) => c.name).filter(Boolean);
  }, [categories]);

  const primaryCommunity = selectedCommunity;

  const communityHeroImageUri = useMemo(
    () => resolveCommunityHeroImageUri(primaryCommunity, communityFiles, DEFAULT_COMMUNITY_IMAGE),
    [primaryCommunity, communityFiles],
  );

  const communityInfoTabOptions: ButtonCarouselOption<CommunityInfoTabId>[] = useMemo(
    () => [
      { id: 'posts', label: t('community.tabPosts') },
      { id: 'about', label: t('community.tabAbout') },
      { id: 'agreements', label: t('community.tabAgreements') },
    ],
    [t],
  );

  const aboutDescription = primaryCommunity?.description ?? '';
  const heroDescription = primaryCommunity?.socialDescription?.trim() ?? '';

  const agreementLines = useMemo(() => {
    const body = primaryCommunity?.agreement ?? '';
    return body.split('\n').filter((line) => line.trim().length > 0);
  }, [primaryCommunity?.agreement]);

  const specialistData: CommunityDescriptionSpecialist | null = useMemo(() => {
    if (!advertiser) return null;
    const advertiserName = advertiser.name?.trim();
    if (!advertiserName) return null;
    return {
      name: advertiserName,
      subtitle: advertiser.description?.trim() || t('community.specialistLabel'),
      tags: [],
      avatarUri: advertiser.logo ?? undefined,
    };
  }, [advertiser, t]);

  const feedInformationSlot = useMemo(
    () => (
      <>
        <View style={styles.tabsContainerInCard}>
          <Text style={styles.sectionTitle}>{t('community.informationTitle')}</Text>
          <InfoSectionTabsRow
            options={communityInfoTabOptions}
            selectedId={activeInfoTab}
            onSelect={(tabId) => {
              logTabSelect({ screen_name: 'community_list', tab_id: tabId });
              setActiveInfoTab(tabId);
            }}
            onSharePress={handleSharePress}
          />
        </View>
        {activeInfoTab === 'about' ? (
          <View style={styles.tabContent}>
            {aboutDescription.trim().length > 0 ? (
              <Text style={styles.aboutBodyText}>{aboutDescription}</Text>
            ) : (
              <Text style={styles.aboutBodyText}>{t('community.aboutEmpty')}</Text>
            )}
          </View>
        ) : null}
        {activeInfoTab === 'agreements' ? (
          <View style={styles.tabContent}>
            <View style={styles.descriptionContainer}>
              {agreementLines.map((line, index) => (
                <View key={index} style={styles.descriptionItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.descriptionText}>{line.trim()}</Text>
                </View>
              ))}
            </View>
            <View style={styles.agreementsCheckboxRow}>
              <Checkbox
                label={t('community.agreementsParticipationTermsCheckbox')}
                checked={communityTermsAccepted === true}
                onPress={toggleCommunityTermsAccepted}
                disabled={communityTermsAccepted === null}
                containerStyle={styles.agreementsTermsCheckboxContainer}
                labelStyle={styles.agreementsTermsCheckboxLabel}
              />
            </View>
          </View>
        ) : null}
      </>
    ),
    [
      t,
      communityInfoTabOptions,
      activeInfoTab,
      aboutDescription,
      agreementLines,
      communityTermsAccepted,
      toggleCommunityTermsAccepted,
    ],
  );

  const handleCommunityFavoritePress = useCallback(() => {
    if (!selectedCommunityId) return;
    const next = !isCommunityFavorite;
    setIsCommunityFavorite(next);
    storageService.setCommunityFavorite(selectedCommunityId, next).catch((error) => {
      logger.error('Falha ao persistir favorito da comunidade', {
        communityId: selectedCommunityId,
        favorite: next,
        cause: error,
      });
      setIsCommunityFavorite(!next);
    });
  }, [selectedCommunityId, isCommunityFavorite]);

  const showVirtualizedFeed = isFeedMode && activeInfoTab === 'posts';
  const feedPosts = useMemo(() => {
    if (!featuredPost?.id) {
      return posts;
    }
    return posts.filter((post) => post.id !== featuredPost.id);
  }, [posts, featuredPost?.id]);
  feedPostsCountRef.current = feedPosts.length;
  const showFeedInitialLoading = showVirtualizedFeed && feedLoading && posts.length === 0;
  const showFeedRecommendations = isFeedMode && (activeInfoTab === 'posts' || activeInfoTab === 'about');

  const heroBlock = useMemo(
    () =>
      primaryCommunity?.displayName != null ? (
        <HeroImage
          imageUri={communityHeroImageUri}
          name={primaryCommunity.displayName}
          badges={communityHeroBadges}
          footer={
            heroDescription ? (
              <View style={styles.heroFooter}>
                <Text style={styles.heroDescription}>{heroDescription}</Text>
              </View>
            ) : undefined
          }
        />
      ) : null,
    [primaryCommunity?.displayName, communityHeroImageUri, communityHeroBadges, heroDescription],
  );

  const toggleBlock = useMemo(
    () => (
      <View style={styles.toggleRow}>
        <View style={styles.toggleContainer}>
          <Toggle options={[...toggleOptions]} selected={toggleSelectedLabel} onSelect={handleModeSelect} />
        </View>
      </View>
    ),
    [toggleOptions, toggleSelectedLabel, handleModeSelect],
  );

  const feedAuxiliaryBlock = useMemo(
    () => (
      <>
        {eventBanner ? (
          <View style={socialListStyles.eventBannerContainer}>
            <EventBanner event={eventBanner} onPress={handleEventBannerPress} onCtaPress={handleEventBannerCtaPress} />
          </View>
        ) : null}
        <CommunityDescriptionSection
          variant='feed'
          specialist={specialistData}
          welcomeDismissed={welcomeDismissed}
          onWelcomeClose={handleWelcomeClose}
        />
        {feedInformationSlot}
      </>
    ),
    [
      eventBanner,
      handleEventBannerPress,
      handleEventBannerCtaPress,
      specialistData,
      welcomeDismissed,
      handleWelcomeClose,
      feedInformationSlot,
    ],
  );

  const feedRecommendationsBlock = useMemo(
    () =>
      showFeedRecommendations ? (
        <>
          {feedEvents && feedEvents.length > 0 && (
            <View style={socialListStyles.sectionContainer}>
              <NextEventsSection events={feedEvents} onEventPress={handleEventPress} onEventSave={handleEventSave} />
            </View>
          )}
          {rootNavigation ? (
            <RecommendedProductsSection
              navigation={rootNavigation as StackNavigationProp<RootStackParamList, keyof RootStackParamList>}
              analyticsScreenName='community'
              enabled={feedRecommendationsEnabled}
              style={socialListStyles.recommendedSection}
            />
          ) : null}
        </>
      ) : null,
    [
      showFeedRecommendations,
      feedEvents,
      handleEventPress,
      handleEventSave,
      rootNavigation,
      feedRecommendationsEnabled,
    ],
  );

  const feedListHeader = useMemo(
    () => (
      <View style={styles.feedListHeader}>
        {heroBlock}
        {toggleBlock}
        {feedAuxiliaryBlock}
        {activeInfoTab === 'posts' && featuredPost ? (
          <FeaturedPostsSection post={featuredPost} onPostPress={handlePostCardPress} />
        ) : null}
      </View>
    ),
    [heroBlock, toggleBlock, feedAuxiliaryBlock, activeInfoTab, featuredPost, handlePostCardPress],
  );

  const feedListFooter = useMemo(
    () => (
      <View style={styles.feedListFooter}>
        {loadingMore && feedPosts.length > 0 ? (
          <View
            style={styles.feedLoadingFooter}
            accessibilityRole='progressbar'
            accessibilityLabel={t('community.loadingMorePosts')}
          >
            <ActivityIndicator size='small' color='#4CAF50' />
            <Text style={styles.feedLoadingFooterLabel}>{t('community.loadingMorePosts')}</Text>
          </View>
        ) : null}
        {feedRecommendationsBlock}
      </View>
    ),
    [loadingMore, feedPosts.length, t, feedRecommendationsBlock],
  );

  const feedListEmpty = useMemo(() => {
    if (error) {
      return (
        <View style={styles.feedEmptyContainer}>
          <Text style={styles.feedEmptyText}>{`Erro: ${error}`}</Text>
        </View>
      );
    }
    return <EmptyState title={t('community.noPostsFound')} description={t('community.noPostsFoundDescription')} />;
  }, [error, t]);

  if (focusCommunityUnavailable) {
    return (
      <View style={styles.screenRoot}>
        <ScreenWithHeader
          navigation={rootNavigation}
          headerProps={{
            showBackButton: true,
            showMenuWithAvatar: false,
            onBackPress: () => goBackOrShareHome(navigation),
          }}
          contentContainerStyle={styles.container}
        >
          <ShareContentUnavailable
            contentType={SHARE_CONTENT_TYPES.COMMUNITY}
            itemId={focusCommunityId}
            screenName='community_list'
            onDiscover={handleDiscover}
            onGoHome={handleGoHome}
          />
        </ScreenWithHeader>
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      {eventJoinUrl ? <EventWebViewSession url={eventJoinUrl} onClose={closeEventSession} /> : null}
      <ScreenWithHeader
        navigation={rootNavigation}
        headerProps={{
          showBackButton: true,
          showMenuWithAvatar: false,
          onBackPress: () => goBackOrShareHome(navigation),
          showCartButton: true,
          onCartPress: handleCartPress,
        }}
        contentContainerStyle={styles.container}
      >
        {showFeedInitialLoading ? (
          <View style={styles.feedLoadingContainer}>
            <ActivityIndicator size='large' color='#2196F3' />
            <Text style={styles.feedLoadingText}>{t('common.loading')}</Text>
          </View>
        ) : showVirtualizedFeed ? (
          <FlatList
            style={[{ flex: 1 }, { zIndex: 1 }]}
            contentContainerStyle={styles.feedContentContainer}
            showsVerticalScrollIndicator={false}
            data={feedPosts}
            keyExtractor={postKeyExtractor}
            renderItem={renderPostItem}
            ItemSeparatorComponent={renderPostSeparator}
            ListHeaderComponent={feedListHeader}
            ListFooterComponent={feedListFooter}
            ListEmptyComponent={feedListEmpty}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            viewabilityConfig={feedViewabilityConfig}
            onViewableItemsChanged={onFeedViewableItemsChanged}
            onMomentumScrollBegin={() => {
              feedLoadMoreLockedRef.current = false;
            }}
            removeClippedSubviews
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={7}
          />
        ) : (
          <ScrollView
            style={[{ flex: 1 }, { zIndex: 1 }]}
            contentContainerStyle={{ paddingBottom: SPACING.XL }}
            showsVerticalScrollIndicator={false}
          >
            {heroBlock}
            <View>
              {toggleBlock}
              {isFeedMode ? (
                <>
                  {feedAuxiliaryBlock}
                  {feedRecommendationsBlock}
                </>
              ) : (
                <>
                  <CommunityDescriptionSection
                    variant='solutions'
                    specialist={specialistData}
                    shoppingTipDismissed={shoppingTipDismissed}
                    onShoppingTipClose={handleShoppingTipClose}
                  />
                  <ShoppingList
                    selectedTabId={selectedShopTabId}
                    onTabChange={setSelectedShopTabId}
                    ads={shopTabState.ads}
                    loading={shopListLoading}
                    hasMore={shopTabState.hasMore}
                    onLoadMore={handleShopLoadMore}
                    navigation={shopNavigation}
                    professionals={shopProfessionals}
                    onProfessionalPress={handleProfessionalPress}
                    providerName={communityProviderName}
                    embedInParentScroll
                  />
                </>
              )}
            </View>
          </ScrollView>
        )}
      </ScreenWithHeader>
    </View>
  );
};

export default CommunityScreen;
