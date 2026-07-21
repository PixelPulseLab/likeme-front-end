import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StatusBar, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScreenWithHeader, ProgressHeaderLogo } from '@/components/ui/layout';
import { SecondaryButton, IconButton } from '@/components/ui/buttons';
import { PeriodSelector } from '@/components/ui/inputs';
import { CTACard } from '@/components/ui/cards';
import ProgressBar from '@/components/ui/feedback/ProgressBar';
import { useMenuItems, useCommunities, useAnamnesisScores } from '@/hooks';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { mapChannelsToEvents } from '@/utils';
import { chatService, communityService, anamnesisService, userService } from '@/services';
import type { UserMarker } from '@/types/anamnesis';
import { getMarkerColor, getMarkerGradient, hasMarkerGradient, MARKER_NAMES } from '@/constants/markers';
import { COLORS } from '@/constants';
import { useTranslation } from '@/hooks/i18n';
import type { FeedEvent } from '@/types/event';
import { NextEventsSection, PopularProvidersSection, type Provider } from '@/components/sections/community';
import { type JoinCardItem } from '@/components/ui/cards';
import { JoinCardList } from '@/components/ui/lists/JoinCardList';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import Carousel from '@/components/sections/product/Carousel';
import { useAnalyticsScreen } from '@/analytics';
import { logger } from '@/utils/logger';
import { navigateToCommunity } from '@/utils/navigation/communityNavigation';
import { rootStackNavigationFrom } from '@/utils/navigation/rootStackNavigation';
import type { RootStackParamList } from '@/types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';
import { styles } from './styles';

type Props = {
  navigation: any;
  route: any;
};

const AvatarProgressScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'AvatarProgress', screenClass: 'AvatarProgressScreen' });
  const { t } = useTranslation();
  const rootNavigation = rootStackNavigationFrom(navigation) ?? navigation;
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [popularProviders, setPopularProviders] = useState<Provider[]>([]);
  const [markers, setMarkers] = useState<UserMarker[]>([]);
  const [_loadingEvents, setLoadingEvents] = useState(false);
  const [_loadingProviders, setLoadingProviders] = useState(false);
  const [loadingMarkers, setLoadingMarkers] = useState(true);
  const [markerRowWidth, setMarkerRowWidth] = useState(0);
  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'home');

  const TREND_ICON_WIDTH = 34;

  const onMarkerRowLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = e.nativeEvent.layout;
    setMarkerRowWidth(width);
  }, []);
  const { scores: anamnesisScores } = useAnamnesisScores();

  const { communities: rawCommunities, categories } = useCommunities({
    enabled: true,
    pageSize: 2,
    params: {
      sortBy: 'createdAt',
      includeDeleted: false,
    },
  });

  const joinCommunities = useMemo((): JoinCardItem[] => {
    const names = categories
      .map((category) => category.name.trim())
      .filter(Boolean)
      .slice(0, 2);
    const badges = names.length > 0 ? names : ['Community'];

    return rawCommunities.map((community) => ({
      id: community.communityId,
      title: community.displayName,
      badges,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    }));
  }, [rawCommunities, categories]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await chatService.getChannels({
          types: ['live', 'broadcast'],
        });

        if (response.success && response.data?.channels) {
          const mappedEvents = mapChannelsToEvents(response.data.channels);
          setEvents(mappedEvents.slice(0, 2));
        } else {
          setEvents([]);
        }
      } catch (error) {
        logger.error('[AvatarProgressScreen] Erro ao carregar eventos', error);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const loadPopularProviders = async () => {
      try {
        setLoadingProviders(true);
        const userFeedResponse = await communityService.getUserFeed({
          page: 1,
          limit: 20,
        });

        const isSuccess =
          userFeedResponse.success === true ||
          userFeedResponse.status === 'ok' ||
          userFeedResponse.data?.status === 'ok';

        let feedData:
          | {
              communityUsers?: Array<{
                userId: string;
                roles?: string[];
                communityMembership?: string;
              }>;
              users?: Array<{ userId: string; displayName?: string; avatarFileId?: string }>;
              files?: Array<{ fileId: string; fileUrl?: string }>;
            }
          | undefined;
        if (userFeedResponse.data?.data) {
          feedData = userFeedResponse.data.data as typeof feedData;
        } else if (userFeedResponse.data && 'posts' in userFeedResponse.data) {
          feedData = userFeedResponse.data as typeof feedData;
        }

        if (!isSuccess || !feedData) {
          setPopularProviders([]);
          return;
        }

        const communityUsers = feedData.communityUsers || [];
        const users = feedData.users || [];
        const files = feedData.files || [];

        const ownerUserIds = new Set<string>();
        communityUsers.forEach((relation) => {
          const roles = relation.roles || [];
          if (
            roles.includes('community-moderator') ||
            roles.includes('community-admin') ||
            roles.includes('owner') ||
            relation.communityMembership === 'owner'
          ) {
            ownerUserIds.add(relation.userId);
          }
        });

        if (ownerUserIds.size === 0) {
          const uniqueUserIds = new Set<string>();
          communityUsers.forEach((relation) => {
            if (relation.userId) {
              uniqueUserIds.add(relation.userId);
            }
          });
          uniqueUserIds.forEach((userId) => ownerUserIds.add(userId));
        }

        const providers: Provider[] = Array.from(ownerUserIds)
          .slice(0, 6)
          .map((userId) => {
            const user = users.find((u) => u.userId === userId);
            if (!user || !user.displayName) {
              return null;
            }

            const avatarUrl = user.avatarFileId
              ? files.find((f) => f.fileId === user.avatarFileId)?.fileUrl
              : undefined;

            return {
              id: user.userId,
              name: user.displayName,
              avatar: avatarUrl,
            };
          })
          .filter((provider) => provider !== null) as Provider[];

        setPopularProviders(providers);
      } catch (error) {
        logger.error('[AvatarProgressScreen] Erro ao carregar provedores populares', error);
        setPopularProviders([]);
      } finally {
        setLoadingProviders(false);
      }
    };

    loadPopularProviders();
  }, []);

  const handleBackPress = () => {
    rootNavigation.goBack();
  };

  const handleSharePress = async () => {
    try {
      const mindPct = anamnesisScores?.mentalPercentage ?? 0;
      const bodyPct = anamnesisScores?.physicalPercentage ?? 0;
      const message = t('avatar.shareMessage', {
        mindPercentage: mindPct,
        bodyPercentage: bodyPct,
      });
      await Share.share({ message });
    } catch (error) {
      logger.warn('[AvatarProgressScreen] Share cancelado ou falhou', { cause: error });
    }
  };

  const handleSeeMarker = (marker?: UserMarker) => {
    const markerToShow = marker || (markers.length > 0 ? markers[0] : null);
    if (markerToShow) {
      navigation.navigate('MarkerDetails', {
        marker: markerToShow,
      });
    }
  };

  const handleEventPress = (event: FeedEvent) => {
    logger.debug('[AvatarProgressScreen] event press (stub)', { eventId: event.id });
  };

  const handleEventSave = (event: FeedEvent) => {
    logger.debug('[AvatarProgressScreen] event save (stub)', { eventId: event.id });
  };

  const handleProviderPress = (provider: Provider) => {
    logger.debug('[AvatarProgressScreen] provider press (stub)', { providerId: provider.id });
  };

  const handleJoinCommunityPress = (_community: JoinCardItem) => {
    navigateToCommunity(rootNavigation);
  };

  useEffect(() => {
    const loadMarkers = async () => {
      try {
        setLoadingMarkers(true);
        const profileResponse = await userService.getProfile();
        const userId = profileResponse.success ? profileResponse.data?.id : null;

        if (!userId) {
          setMarkers([]);
          return;
        }

        const markersResponse = await anamnesisService.getUserMarkers({ userId });

        if (markersResponse.success && markersResponse.data) {
          setMarkers(markersResponse.data);
        } else {
          const fallbackIds = [
            'activity',
            'connection',
            'environment',
            'nutrition',
            'purpose-vision',
            'self-esteem',
            'sleep',
            'smile',
            'spirituality',
            'stress',
          ] as const;
          setMarkers(
            fallbackIds.map((id) => ({
              id,
              name: t(`avatar.marker_${id.replace(/-/g, '_')}`),
              trend: 'stable' as const,
              percentage: 0,
            })),
          );
        }
      } catch (error) {
        logger.error('[AvatarProgressScreen] Erro ao carregar marcadores', error);
        const fallbackIds = [
          'activity',
          'connection',
          'environment',
          'nutrition',
          'purpose-vision',
          'self-esteem',
          'sleep',
          'smile',
          'spirituality',
          'stress',
        ] as const;
        setMarkers(
          fallbackIds.map((id) => ({
            id,
            name: t(`avatar.marker_${id.replace(/-/g, '_')}`),
            trend: 'stable' as const,
            percentage: 0,
          })),
        );
      } finally {
        setLoadingMarkers(false);
      }
    };

    loadMarkers();
  }, []);

  const biomarkerCards = useMemo(() => {
    const increasingMarkers = markers.filter((marker) => marker.trend === 'increasing');

    if (increasingMarkers.length === 0) {
      return markers.map((marker) => {
        const markerName = MARKER_NAMES[marker.id] || marker.name;
        const improvementPercentage = marker.percentage > 0 ? Math.round(marker.percentage / 10) : 0;

        return {
          id: marker.id,
          markerId: marker.id,
          percentage: marker.percentage,
          title: `${markerName.toUpperCase()} : +${improvementPercentage}%`,
          message: t('avatar.youveImproved'),
          description: `${t('avatar.niceJobBody')}\n${t('avatar.improveMind')}`,
        };
      });
    }

    return increasingMarkers.map((marker) => {
      const markerName = MARKER_NAMES[marker.id] || marker.name;
      const improvementPercentage = marker.percentage > 0 ? Math.round(marker.percentage / 10) : 0;

      return {
        id: marker.id,
        markerId: marker.id,
        percentage: marker.percentage,
        title: `${markerName.toUpperCase()} : +${improvementPercentage}%`,
        message: t('avatar.youveImproved'),
        description: `${t('avatar.niceJobBody')}\n${t('avatar.improveMind')}`,
      };
    });
  }, [markers, t]);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ showBackButton: true, onBackPress: handleBackPress, customLogo: <ProgressHeaderLogo /> }}
      contentContainerStyle={styles.container}
    >
      <StatusBar barStyle='dark-content' backgroundColor={COLORS.BACKGROUND} />
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.topSection}>
            <View style={styles.headerContainer}>
              <PeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={(period) => setSelectedPeriod(period as 'week' | 'month')}
                options={['week', 'month']}
              />
            </View>

            <View style={styles.markersListContainer}>
              {loadingMarkers ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.TEXT_LIGHT }}>{t('avatar.loadingMarkers')}</Text>
                </View>
              ) : markers.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.TEXT_LIGHT }}>{t('avatar.noMarkersFound')}</Text>
                  <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, marginTop: 8 }}>
                    {t('avatar.checkAnamnesisMessage')}
                  </Text>
                </View>
              ) : (
                markers.map((marker) => {
                  return (
                    <View key={marker.id} style={styles.markerItem}>
                      <TouchableOpacity
                        style={styles.markerHeader}
                        onPress={() => handleSeeMarker(marker)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.markerName}>{marker.name}</Text>
                        <Icon name='chevron-right' size={20} color={COLORS.TEXT} />
                      </TouchableOpacity>
                      <View style={styles.markerContent} onLayout={onMarkerRowLayout}>
                        <View style={[styles.markerProgressContainer, markerRowWidth > 0 && { flex: undefined }]}>
                          <ProgressBar
                            current={Math.max(marker.percentage, 1)}
                            total={100}
                            color={getMarkerColor(marker.id)}
                            gradientColors={
                              hasMarkerGradient(marker.id) ? getMarkerGradient(marker.id) || undefined : undefined
                            }
                            height={30}
                            showRemaining={false}
                            containerWidth={
                              markerRowWidth > 0
                                ? Math.max(
                                    8,
                                    (markerRowWidth - TREND_ICON_WIDTH) * (Math.max(marker.percentage, 1) / 100),
                                  )
                                : undefined
                            }
                          />
                        </View>
                        <View style={styles.markerTrend}>
                          <Icon
                            name={
                              marker.trend === 'increasing'
                                ? 'trending-up'
                                : marker.trend === 'decreasing'
                                ? 'trending-down'
                                : 'remove'
                            }
                            size={20}
                            color={COLORS.TEXT_LIGHT}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.shareButtonContainer}>
              <IconButton
                icon='share'
                onPress={handleSharePress}
                label={t('avatar.share')}
                backgroundTintColor={COLORS.SECONDARY.PURE}
              />
            </View>
          </View>

          <CTACard
            title={t('avatar.insights')}
            highlightText={t('avatar.didYouRunMarathon')}
            description={[t('avatar.greatForBody'), t('avatar.regenerativeTraining')]}
            primaryButtonLabel={t('avatar.seeMarker')}
            primaryButtonOnPress={() => handleSeeMarker(markers[0])}
            secondaryButtonLabel={t('avatar.share')}
            secondaryButtonOnPress={handleSharePress}
            secondaryButtonIcon='share'
            backgroundColor={COLORS.SECONDARY.PURE}
          />

          {biomarkerCards.length > 0 && (
            <View style={styles.biomarkersSection}>
              <Text style={styles.biomarkersTitle}>{t('avatar.biomarkers')}</Text>
              <Carousel
                data={biomarkerCards}
                renderItem={(card) => (
                  <View key={card.id} style={styles.biomarkerCard}>
                    <Text style={styles.biomarkerCardTitle}>{card.title}</Text>
                    <Text style={styles.biomarkerCardMessage}>{card.message}</Text>
                    <Text style={styles.biomarkerCardDescription}>{card.description}</Text>
                    <View style={styles.biomarkerProgressContainer}>
                      <ProgressBar
                        current={Math.max(card.percentage, 1)}
                        total={100}
                        color={getMarkerColor(card.markerId)}
                        gradientColors={
                          hasMarkerGradient(card.markerId) ? getMarkerGradient(card.markerId) || undefined : undefined
                        }
                        height={30}
                        showRemaining={false}
                      />
                    </View>
                  </View>
                )}
                keyExtractor={(card) => card.id}
                itemWidth={307}
                gap={8}
                showPagination={true}
                paginationSize='Large'
              />
            </View>
          )}

          <NextEventsSection events={events} onEventPress={handleEventPress} onEventSave={handleEventSave} />

          <PopularProvidersSection providers={popularProviders} onProviderPress={handleProviderPress} />

          <RecommendedProductsSection
            navigation={rootNavigation as StackNavigationProp<RootStackParamList, keyof RootStackParamList>}
            analyticsScreenName='avatar_progress'
            style={styles.productsSection}
          />

          <JoinCardList items={joinCommunities} onItemPress={handleJoinCommunityPress} />

          <View style={styles.addWidgetsContainer}>
            <SecondaryButton
              label={t('avatar.addWidgets')}
              onPress={() => logger.debug('[AvatarProgressScreen] add widgets (stub)')}
              size='large'
              style={styles.addWidgetsButton}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWithHeader>
  );
};

export default AvatarProgressScreen;
