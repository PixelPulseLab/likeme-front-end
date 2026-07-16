import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWithHeader } from '@/components/ui/layout';
import { SearchBar } from '@/components/ui/inputs';
import { EmptyState } from '@/components/ui/feedback';
import { JoinCard } from '@/components/ui/cards';
import { JoinCardList } from '@/components/ui/lists/JoinCardList';
import ProtocolList from '@/components/sections/subscription/ProtocolList';
import { useSubscriptionList } from '@/hooks/subscription/useSubscriptionList';
import {
  useMemberProtocolCommunities,
  type MemberProtocolCardItem,
} from '@/hooks/community/useMemberProtocolCommunities';
import { useMenuItems } from '@/hooks';
import { useFloatingMenuActions } from '@/contexts/FloatingMenuContext';
import { useTranslation } from '@/hooks/i18n';
import { useAnalyticsScreen } from '@/analytics';
import type { SubscriptionListItem } from '@/types/subscription/subscription';
import type { RootStackParamList } from '@/types/navigation';
import { COLORS } from '@/constants';
import { styles } from './styles';

const SEARCH_DEBOUNCE_MS = 450;

type Props = StackScreenProps<RootStackParamList, 'SubscriptionList'>;

const SubscriptionListScreen: React.FC<Props> = ({ navigation }) => {
  useAnalyticsScreen({ screenName: 'SubscriptionList', screenClass: 'SubscriptionListScreen' });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  const { setMenu } = useFloatingMenuActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const {
    loading: subscriptionLoading,
    protocols: subscriptionProtocols,
    services,
    hasContent: hasSubscriptionContent,
  } = useSubscriptionList(appliedSearchQuery);

  const {
    loading: communityLoading,
    protocols: communityProtocols,
    hasContent: hasCommunityContent,
  } = useMemberProtocolCommunities(appliedSearchQuery);

  useFocusEffect(
    useCallback(() => {
      setMenu(menuItems, 'profile');
    }, [menuItems, setMenu]),
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const openSubscriptionItem = useCallback(
    (item: SubscriptionListItem) => {
      navigation.navigate('ProtocolDetail', {
        protocol: {
          id: item.productId,
          name: item.title,
          image: item.image,
          badges: item.badges,
          communityId: item.communityId,
          productId: item.productId,
          subscriptionId: item.subscriptionId,
          subscriptionStatus: item.status,
          cancelAtPeriodEnd: item.cancelAtPeriodEnd,
          canceledAt: item.canceledAt,
          cancelRequestedAt: item.cancelRequestedAt,
          accessValidUntil: item.accessValidUntil,
          description: item.description ?? undefined,
          agreements: item.agreements ?? undefined,
        },
      });
    },
    [navigation],
  );

  const openCommunityProtocol = useCallback(
    (item: MemberProtocolCardItem) => {
      navigation.navigate('ProtocolDetail', {
        protocol: {
          id: item.communityId,
          communityId: item.communityId,
          name: item.title,
          image: item.image,
          badges: item.badges,
          description: item.description ?? undefined,
        },
      });
    },
    [navigation],
  );

  const handleExploreMarketplace = useCallback(() => {
    navigation.navigate('Marketplace' as never);
  }, [navigation]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setAppliedSearchQuery('');
  }, []);

  const loading = subscriptionLoading || communityLoading;

  const subscriptionCommunityIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of subscriptionProtocols) {
      const communityId = item.communityId?.trim();
      if (communityId) {
        ids.add(communityId);
      }
    }
    return ids;
  }, [subscriptionProtocols]);

  const communityProtocolsWithoutSubscription = useMemo(
    () => communityProtocols.filter((item) => !subscriptionCommunityIds.has(item.communityId.trim())),
    [communityProtocols, subscriptionCommunityIds],
  );

  const hasCommunityProtocols = communityProtocolsWithoutSubscription.length > 0;
  const isFullyEmpty = !loading && !hasSubscriptionContent && !hasCommunityContent;
  const hasSearchResults =
    !loading && !isFullyEmpty && (subscriptionProtocols.length > 0 || services.length > 0 || hasCommunityProtocols);

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{ showBackButton: true, onBackPress: handleBack }}
      contentContainerStyle={styles.screenContent}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <Text style={styles.screenTitle}>
          {t('profile.acquisitionList.title', { defaultValue: 'Meus Programas e Serviços' })}
        </Text>

        {!isFullyEmpty && (
          <View style={styles.searchWrap}>
            <SearchBar
              placeholder={t('profile.memberProtocols.searchPlaceholder', { defaultValue: 'Buscar' })}
              value={searchQuery}
              onChangeText={setSearchQuery}
              showFilterButton={false}
            />
          </View>
        )}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size='large' color={COLORS.PRIMARY.PURE} />
          </View>
        ) : isFullyEmpty ? (
          <View style={styles.emptyWrap}>
            <ProtocolList
              subscriptions={[]}
              onSubscriptionPress={() => undefined}
              onExplorePress={handleExploreMarketplace}
            />
          </View>
        ) : !hasSearchResults ? (
          <View style={styles.searchEmptyWrap}>
            <EmptyState
              title={t('marketplace.noAdsFound')}
              description={t('marketplace.noAdsFoundDescription')}
              iconName='storefront'
              actionLabel={t('home.clearFilters')}
              onActionPress={handleClearSearch}
            />
          </View>
        ) : (
          <>
            {subscriptionProtocols.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Protocolos</Text>
                <View style={styles.cardsList}>
                  <JoinCardList layout='list' items={subscriptionProtocols} onItemPress={openSubscriptionItem} />
                </View>
              </View>
            )}

            {services.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Serviços</Text>
                <View style={styles.cardsList}>
                  <JoinCardList layout='list' items={services} onItemPress={openSubscriptionItem} />
                </View>
              </View>
            )}

            {hasCommunityProtocols && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('profile.memberProtocols.communitySectionTitle', {
                    defaultValue: 'Protocolos na comunidade',
                  })}
                </Text>
                <View style={styles.cardsList}>
                  <JoinCardList
                    layout='list'
                    items={communityProtocolsWithoutSubscription.map((item) => ({
                      id: item.communityId,
                      title: item.title,
                      badges: item.badges,
                      image: item.image,
                    }))}
                    onItemPress={(card) => {
                      const item = communityProtocolsWithoutSubscription.find(
                        (protocol) => protocol.communityId === card.id,
                      );
                      if (item) {
                        openCommunityProtocol(item);
                      }
                    }}
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWithHeader>
  );
};

export default SubscriptionListScreen;
