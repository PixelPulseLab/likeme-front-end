import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CachedImage } from '@/components/ui/media/CachedImage';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HeroImage, ScreenWithHeader } from '@/components/ui/layout';
import { ToggleTabs } from '@/components/ui/tabs';
import { IconButton, SecondaryButton } from '@/components/ui/buttons';
import { EmptyState, ShareContentUnavailable } from '@/components/ui/feedback';
import type { ButtonCarouselOption } from '@/components/ui/carousel';
import { type JoinCardItem } from '@/components/ui/cards';
import { JoinCardList } from '@/components/ui/lists/JoinCardList';
import { AdsList } from '@/components/sections/marketplace';
import { Product } from '@/components/sections/product';
import { useAdvertiser, useAdvertisers, useProviderAds, useCommunities, useFeatureFlag, useMenuItems } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import type { RootStackParamList } from '@/types/navigation';
import { useAnalyticsScreen } from '@/analytics';
import { styles } from './styles';
import { styles as communityShopListStyles } from '@/components/sections/community/ShoppingList/styles';
import { communityService, advertiserService } from '@/services';
import type { Advertiser, AdvertiserProfile } from '@/types/ad';
import { COLORS, FEATURE_FLAGS } from '@/constants';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import { DEFAULT_MARKETPLACE_SORT_ORDER, type MarketplaceSortOrderId } from '@/constants/marketplaceSortOrder';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { logger } from '@/utils/logger';
import { ContactButtonsRow } from '@/components/sections/advertiser/ContactButtonsRow';
import { formatAdvertiserDocumentsLine } from '@/utils/advertiser/documents';
import { resolveCommunityHeroImageUri } from '@/utils/community/mappers';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { navigateRootStack, rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import { navigateToProviderProfile } from '@/utils/navigation/marketplaceNavigation';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';
import { goBackOrShareHome, navigateToShareHome } from '@/utils/navigation/shareHomeNavigation';
import { navigateToShareDiscover } from '@/utils/navigation/shareDiscoverNavigation';
import { shareContent } from '@/utils/share/shareContent';
import { getProductModeTranslationKey } from '@/utils';
import { filterAdsForProviderProfile } from '@/utils/marketplace/filterAdsForProviderProfile';
import { getMarketplaceSortOptions } from '@/utils/marketplace/sortOptions';
import { sortShopProductsByMarketplaceOrder } from '@/utils/marketplace/sorting';

const JOIN_CARD_COMMUNITY_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400';
const CATALOG_PRODUCT_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';

type ProviderProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ProviderProfile'>;
  route: {
    params: {
      providerId: string;
      provider?: {
        name: string;
        avatar?: string;
        title?: string;
        description?: string;
        rating?: number;
        specialties?: string[];
        followers?: number;
      };
    };
  };
};

const ProviderProfileScreen: React.FC<ProviderProfileScreenProps> = ({ navigation, route }) => {
  useAnalyticsScreen({ screenName: 'ProviderProfile', screenClass: 'ProviderProfileScreen' });
  const { t } = useTranslation();
  const { isEnabled: isChatEnabled } = useFeatureFlag(FEATURE_FLAGS.CHAT_ENABLED);
  const { providerId, provider: providerFromParams } = route.params;
  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'marketplace');
  const [activeTab, setActiveTab] = useState<'about' | 'communities'>('about');
  const [_isFavorite, _setIsFavorite] = useState(false);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(new Set());
  const [productsPage, setProductsPage] = useState(1);
  const [profiles, setProfiles] = useState<AdvertiserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [communityShopSortOrder, setCommunityShopSortOrder] =
    useState<MarketplaceSortOrderId>(DEFAULT_MARKETPLACE_SORT_ORDER);

  const toggleSection = useCallback((profileId: string) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }, []);

  const {
    ads: providerAds,
    loading: loadingAds,
    hasMore: hasMoreAds,
    loadAds: loadProviderAds,
  } = useProviderAds({
    advertiserId: providerId || undefined,
    page: productsPage,
    limit: 20,
  });

  React.useEffect(() => {
    setProductsPage(1);
  }, [providerId]);

  React.useEffect(() => {
    if (providerId) loadProviderAds();
  }, [providerId, productsPage, loadProviderAds]);

  React.useEffect(() => {
    const loadProfiles = async () => {
      if (!providerId) return;
      setLoadingProfiles(true);
      try {
        const response = await advertiserService.getAdvertiserProfiles(providerId, 'pt-BR');
        if (response.success && response.data?.profiles) {
          setProfiles(response.data.profiles);
        } else {
          setProfiles([]);
        }
      } catch (error) {
        logger.error('[ProviderProfileScreen] Erro ao carregar perfis do anunciante', error);
        setProfiles([]);
      } finally {
        setLoadingProfiles(false);
      }
    };

    loadProfiles();
  }, [providerId]);

  const { advertiser, loading: loadingProvider } = useAdvertiser({
    advertiserId: providerId || undefined,
  });

  const filteredProviderAds = useMemo(
    () => filterAdsForProviderProfile(providerAds, providerId, advertiser?.userId),
    [providerAds, providerId, advertiser?.userId],
  );

  const providerData = useMemo(() => {
    if (advertiser) {
      return {
        name: advertiser.name ?? '',
        avatar: advertiser.logo ?? '',
        title: '',
        description: advertiser.description ?? '',
        rating: undefined as number | undefined,
        specialties: [] as string[],
        followers: undefined as number | undefined,
      };
    }
    if (providerFromParams) {
      return {
        name: providerFromParams.name ?? '',
        avatar: providerFromParams.avatar ?? '',
        title: providerFromParams.title ?? '',
        description: providerFromParams.description ?? '',
        rating: providerFromParams.rating,
        specialties: providerFromParams.specialties ?? [],
        followers: providerFromParams.followers,
      };
    }
    return null;
  }, [advertiser, providerFromParams]);

  const positioningProfile = useMemo(
    () => profiles.find((profile) => profile.key === 'profile.positioning'),
    [profiles],
  );

  const heroTitle = providerData?.description || undefined;
  const documentsLine = useMemo(() => formatAdvertiserDocumentsLine(advertiser?.documents), [advertiser?.documents]);

  const visibleProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.key !== 'profile.positioning' &&
          profile.key !== 'profile.categories' &&
          profile.key !== 'profile.mainImage',
      ),
    [profiles],
  );

  const hasProfileSections = visibleProfiles.length > 0;

  React.useEffect(() => {
    if (visibleProfiles.length > 0) {
      setExpandedSectionIds(new Set([visibleProfiles[0].id]));
    } else {
      setExpandedSectionIds(new Set());
    }
  }, [visibleProfiles]);

  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;

  const loadCommunityShop = activeTab === 'communities';

  const { advertisers: communityShopAdvertisers } = useAdvertisers(
    loadCommunityShop ? { listOptions: { limit: 50 }, fetchAllPages: true } : {},
  );

  const communityShopProfessionals = useMemo(() => {
    const filtered = communityShopAdvertisers.filter((a) => a.id !== providerId);
    const seen = new Set<string>();
    return filtered.filter((a) => {
      if (!a.id || seen.has(a.id)) {
        return false;
      }
      seen.add(a.id);
      return true;
    });
  }, [communityShopAdvertisers, providerId]);

  const communityShopCatalogFlat = useMemo(() => {
    if (!loadCommunityShop) {
      return [];
    }
    const seenIds = new Set<string>();
    const rows: Product[] = [];

    for (const ad of filteredProviderAds) {
      const p = ad.product;
      if (!p?.id || seenIds.has(p.id)) {
        continue;
      }
      seenIds.add(p.id);

      const catalogType = typeof p.type === 'string' ? p.type : '';
      const solutionsKey =
        catalogType === PRODUCT_CATALOG_TYPE.PROGRAM
          ? ('filterCategory.solutions.programs' as const)
          : catalogType === PRODUCT_CATALOG_TYPE.SERVICE
          ? ('filterCategory.solutions.services' as const)
          : ('filterCategory.solutions.products' as const);

      const primaryTag = t(solutionsKey);
      const modeKey = getProductModeTranslationKey(p);
      const modeLabel = modeKey ? t(`marketplace.productMode.${modeKey}`) : '';
      const tags = [primaryTag, modeLabel].filter(Boolean);

      rows.push({
        id: p.id,
        title: p.name ?? '',
        price: p.price ?? 0,
        image: p.image ?? CATALOG_PRODUCT_IMAGE_FALLBACK,
        tag: primaryTag,
        tags,
        likes: 0,
        createdAt: p.createdAt ?? ad.createdAt ?? '',
        updatedAt: p.updatedAt ?? ad.updatedAt ?? '',
      });
    }

    return rows;
  }, [loadCommunityShop, filteredProviderAds, t]);

  const communityShopCatalogSorted = useMemo(
    () => sortShopProductsByMarketplaceOrder(communityShopCatalogFlat, communityShopSortOrder),
    [communityShopCatalogFlat, communityShopSortOrder],
  );

  const communityShopOrderOptions: ButtonCarouselOption<string>[] = useMemo(() => getMarketplaceSortOptions(t), [t]);

  const handleCommunityShopProductPress = useCallback(
    (product: Product) => {
      navigateToProductDetailsScreen(rootNavigation, { productId: product.id });
    },
    [rootNavigation],
  );

  const handleCommunityShopProfessionalPress = useCallback(
    (professional: Advertiser) => {
      navigateToProviderProfile(rootNavigation, { providerId: professional.id });
    },
    [rootNavigation],
  );

  const {
    communities: rawCommunities,
    categories,
    communityFiles,
  } = useCommunities({
    enabled: activeTab === 'communities',
    pageSize: 10,
  });

  const joinCommunities = useMemo((): JoinCardItem[] => {
    const targetCommunityId = advertiser?.communityId?.trim();
    if (!targetCommunityId) {
      return [];
    }

    const filteredCommunities = rawCommunities.filter((community) => community.communityId === targetCommunityId);

    const names = categories
      .map((category) => category.name.trim())
      .filter(Boolean)
      .slice(0, 2);
    const badges = names.length > 0 ? names : ['Community'];

    return filteredCommunities.map((community) => ({
      id: community.communityId,
      title: community.displayName,
      badges,
      image: resolveCommunityHeroImageUri(community, communityFiles, JOIN_CARD_COMMUNITY_IMAGE_FALLBACK),
    }));
  }, [rawCommunities, categories, advertiser, communityFiles]);

  const handleJoinCommunity = useCallback(
    async (community: JoinCardItem) => {
      try {
        await communityService.joinCommunity(community.id);
        navigateToCommunity(rootNavigation);
      } catch {
        Alert.alert(t('common.error'), t('home.joinCommunityError'));
      }
    },
    [rootNavigation, t],
  );

  const handleBackPress = () => {
    goBackOrShareHome(navigation);
  };

  const handleGoHome = () => {
    navigateToShareHome(navigation);
  };

  const handleDiscover = () => {
    navigateToShareDiscover(navigation);
  };

  const handleSharePress = async () => {
    if (!providerId) {
      return;
    }
    await shareContent({ contentType: SHARE_CONTENT_TYPES.PROVIDER, providerId }, { screenName: 'provider_profile' });
  };

  const handleTalkToProvider = () => {
    if (!providerData) return;
    if (!isChatEnabled) {
      Alert.alert('Chat indisponivel', 'Esta funcionalidade esta desativada no momento.');
      return;
    }

    navigateRootStack(rootNavigation, 'Chat', {
      screen: 'ChatConversation',
      params: {
        targetAdvertiserId: providerId,
        channelName: providerData.name,
        channelAvatar: providerData.avatar,
        initialMessage: t('marketplace.chatInitialMessage'),
      },
    });
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBackPress,
      }}
      contentContainerStyle={styles.container}
    >
      {loadingProvider && !providerData && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#001137' />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
      {!loadingProvider && !providerData && (
        <ShareContentUnavailable
          contentType={SHARE_CONTENT_TYPES.PROVIDER}
          itemId={providerId}
          screenName='provider_profile'
          onDiscover={handleDiscover}
          onGoHome={handleGoHome}
        />
      )}
      {providerData && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <HeroImage imageUri={providerData.avatar} badges={[t('marketplace.specialistLabel')]}>
            <View style={styles.heroContent}>
              <View style={styles.heroTextGroup}>
                {heroTitle ? <Text style={styles.heroTitle}>{heroTitle}</Text> : null}
                <Text style={styles.heroName}>{providerData.name}</Text>
                {documentsLine ? <Text style={styles.heroDocuments}>{documentsLine}</Text> : null}
              </View>
            </View>
          </HeroImage>
          <View style={styles.content}>
            <View style={styles.tabsContainer}>
              <ToggleTabs
                tabs={[
                  { id: 'about', label: t('marketplace.about') },
                  { id: 'communities', label: t('marketplace.myCommunities') },
                ]}
                selectedId={activeTab}
                onSelect={(id) => setActiveTab(id as 'about' | 'communities')}
              />
            </View>
            {activeTab === 'about' ? (
              <ContactButtonsRow
                contacts={advertiser?.contacts}
                providerId={providerId}
                onSharePress={handleSharePress}
                testID='provider-profile-contacts'
              />
            ) : null}

            {activeTab === 'about' && (
              <>
                <View style={styles.aboutSection}>
                  {positioningProfile && (
                    <View style={styles.highlightContainer}>
                      <Text style={styles.highlightQuote}>{positioningProfile.value}</Text>
                      <Text style={styles.highlightSubtitle}>Conheça meu impacto dentro dos pilares Like:Me</Text>
                    </View>
                  )}
                  {loadingProfiles && <Text style={styles.descriptionText}>{t('common.loading')}</Text>}
                  {!loadingProfiles && !hasProfileSections && providerData.description && (
                    <Text style={styles.descriptionText}>{providerData.description}</Text>
                  )}
                  {!loadingProfiles &&
                    visibleProfiles.map((profile) => {
                      const isExpanded = expandedSectionIds.has(profile.id);
                      const sectionTitle = profile.title || profile.key || '';
                      return (
                        <View key={profile.id} style={styles.profileSection}>
                          <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(profile.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                            <Icon
                              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                              size={24}
                              color='#001137'
                            />
                          </TouchableOpacity>
                          {isExpanded && <Text style={styles.descriptionText}>{profile.value}</Text>}
                        </View>
                      );
                    })}
                </View>

                <AdsList
                  navigation={navigation}
                  ads={filteredProviderAds}
                  loading={loadingAds}
                  hasMore={hasMoreAds}
                  onLoadMore={() => setProductsPage((p) => p + 1)}
                  title={t('marketplace.allProducts')}
                />

                {isChatEnabled && (
                  <View style={styles.talkButtonContainer}>
                    <SecondaryButton
                      label={t('marketplace.talkToProvider', { provider: providerData.name })}
                      onPress={handleTalkToProvider}
                      icon='arrow-forward'
                      iconPosition='right'
                      style={styles.talkButton}
                    />
                  </View>
                )}
              </>
            )}

            {activeTab === 'communities' && (
              <View style={styles.communityPreviewContainer}>
                <Text style={styles.communitiesSectionTitle}>{t('marketplace.curatedSpecialty')}</Text>
                <JoinCardList items={joinCommunities} onItemPress={handleJoinCommunity} />
                {communityShopCatalogSorted.length > 0 ? (
                  <AdsList
                    products={communityShopCatalogSorted}
                    onProductPress={(item) => handleCommunityShopProductPress(item as Product)}
                    orderOptions={communityShopOrderOptions}
                    selectedOrder={communityShopSortOrder}
                    onOrderSelect={(id) => setCommunityShopSortOrder(id as MarketplaceSortOrderId)}
                  />
                ) : loadCommunityShop ? (
                  <View style={communityShopListStyles.emptySection}>
                    <EmptyState description={t('marketplace.providerCuratedComingSoon')} />
                  </View>
                ) : null}
                {communityShopProfessionals.length > 0 ? (
                  <View style={communityShopListStyles.list}>
                    {communityShopProfessionals.map((prof) => (
                      <View key={prof.id} style={communityShopListStyles.professionalCardWrapper}>
                        <View style={communityShopListStyles.professionalCardContent}>
                          {prof.logo ? (
                            <CachedImage
                              source={{ uri: prof.logo }}
                              style={communityShopListStyles.professionalAvatar}
                            />
                          ) : (
                            <View style={communityShopListStyles.professionalAvatarPlaceholder}>
                              <Icon name='person' size={32} color={COLORS.NEUTRAL.LOW.MEDIUM} />
                            </View>
                          )}
                          <View style={communityShopListStyles.professionalInfo}>
                            <Text style={communityShopListStyles.professionalName} numberOfLines={1}>
                              {prof.name ?? ''}
                            </Text>
                            {prof.description ? (
                              <Text style={communityShopListStyles.professionalProfession} numberOfLines={1}>
                                Especialista
                              </Text>
                            ) : null}
                          </View>
                          <SecondaryButton
                            label={t('community.viewProfile')}
                            onPress={() => handleCommunityShopProfessionalPress(prof)}
                            size='medium'
                            style={communityShopListStyles.professionalViewProfileButton}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
                {isChatEnabled && (
                  <View style={styles.talkButtonContainer}>
                    <SecondaryButton
                      label={t('marketplace.talkToProvider', { provider: providerData.name })}
                      onPress={handleTalkToProvider}
                      icon='arrow-forward'
                      iconPosition='right'
                      style={styles.talkButton}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </ScreenWithHeader>
  );
};

export default ProviderProfileScreen;
