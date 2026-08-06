import React from 'react';
import { ActivityIndicator, FlatList, Text, View, type ImageStyle, type ListRenderItem } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SecondaryButton } from '@/components/ui/buttons';
import { ScreenWithHeader } from '@/components/ui/layout';
import { CachedImage } from '@/components/ui/media/CachedImage';
import {
  ADVERTISER_RECOMMENDATION_TARGET_TYPE,
  type AdvertiserRecommendationTargetType,
} from '@/constants/recommendation/advertiserRecommendationTargetType';
import { useAdvertiserRecommendation, useMenuItems } from '@/hooks';
import { useTranslation } from '@/hooks/i18n';
import { useSetFloatingMenu } from '@/contexts/FloatingMenuContext';
import { useAnalyticsScreen } from '@/analytics';
import type { RootStackParamList } from '@/types/navigation';
import type { AdvertiserRecommenderPreview } from '@/types/recommendation/advertiserRecommendation';
import { navigateToProviderProfile } from '@/utils/navigation/marketplaceNavigation';
import { goBackOrShareHome } from '@/utils/navigation/shareHomeNavigation';
import { styles } from './styles';

type ProductRecommendersScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ProductRecommenders'>;
  route: {
    params: {
      targetId: string;
      targetType?: AdvertiserRecommendationTargetType;
    };
  };
};

function RecommenderAvatar({ uri }: { uri?: string }) {
  if (uri) {
    return <CachedImage source={{ uri }} style={styles.avatar as ImageStyle} />;
  }
  return <View style={[styles.avatar, styles.avatarPlaceholder]} />;
}

export default function ProductRecommendersScreen({ navigation, route }: ProductRecommendersScreenProps) {
  useAnalyticsScreen({
    screenName: 'ProductRecommenders',
    screenClass: 'ProductRecommendersScreen',
  });
  const { t } = useTranslation();
  const menuItems = useMenuItems(navigation);
  useSetFloatingMenu(menuItems, 'marketplace');

  const targetId = route.params?.targetId?.trim() || '';
  const targetType = route.params?.targetType ?? ADVERTISER_RECOMMENDATION_TARGET_TYPE.product;

  const { recommenders, loading } = useAdvertiserRecommendation({
    targetId,
    targetType,
    enabled: Boolean(targetId),
  });

  const handleBackPress = () => {
    goBackOrShareHome(navigation);
  };

  const openProviderProfile = (advertiserId: string) => {
    const providerId = advertiserId.trim();
    if (!providerId) {
      return;
    }
    navigateToProviderProfile(navigation, { providerId });
  };

  const renderItem: ListRenderItem<AdvertiserRecommenderPreview> = ({ item }) => {
    const specialty = item.specialty?.trim() || '';
    return (
      <View style={styles.row}>
        <View style={styles.identity}>
          <RecommenderAvatar uri={item.avatar} />
          <View style={styles.textBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {specialty ? (
              <Text style={styles.specialty} numberOfLines={1}>
                {specialty}
              </Text>
            ) : null}
          </View>
        </View>
        <SecondaryButton
          label={t('marketplace.seePartnerProfile')}
          onPress={() => openProviderProfile(item.advertiserId)}
          size='medium'
          style={styles.profileButton}
        />
      </View>
    );
  };

  return (
    <ScreenWithHeader
      navigation={navigation}
      headerProps={{
        showBackButton: true,
        onBackPress: handleBackPress,
      }}
    >
      <FlatList
        data={recommenders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.title}>{t('marketplace.recommendedByListTitle')}</Text>}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('marketplace.recommendedByListEmpty')}</Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
    </ScreenWithHeader>
  );
}
