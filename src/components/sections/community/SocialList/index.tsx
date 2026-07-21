import React, { type ReactNode } from 'react';
import { View, ScrollView } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { EventBanner, PostsSection, NextEventsSection } from '@/components/sections/community';
import { RecommendedProductsSection } from '@/components/sections/marketplace/RecommendedProductsSection';
import type { EventBannerData, FeedEvent } from '@/types/event';
import type { Post } from '@/types';
import type { RootStackParamList } from '@/types/navigation';
import { styles } from './styles';

type Props = {
  eventBanner?: EventBannerData | null;
  onEventBannerPress?: (event: EventBannerData) => void;
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  events?: FeedEvent[];
  onEventPress?: (event: FeedEvent) => void;
  onEventSave?: (event: FeedEvent) => void;
  navigation?: StackNavigationProp<RootStackParamList, keyof RootStackParamList>;
  analyticsScreenName?: string;
  recommendedProductsEnabled?: boolean;
  /** Quando true, não usa ScrollView próprio; o conteúdo é renderizado para ficar dentro do scroll do pai. */
  embedInParentScroll?: boolean;
  /** Renderizado antes do feed de posts (ex.: menu Informações), após CommunityDescriptionSection no pai. */
  betweenSpecialistAndPosts?: ReactNode;
  /** Quando false, omite a lista de posts (PostsSection). */
  renderPostsFeed?: boolean;
  /**
   * Próximos eventos e carrossel de produtos recomendados.
   * Se omitido, segue `renderPostsFeed` (comportamento anterior).
   */
  renderFeedRecommendations?: boolean;
};

const SocialList: React.FC<Props> = ({
  eventBanner,
  onEventBannerPress,
  posts,
  loading,
  loadingMore,
  error,
  onLoadMore,
  events,
  onEventPress,
  onEventSave,
  navigation,
  analyticsScreenName = 'community',
  recommendedProductsEnabled = true,
  embedInParentScroll = false,
  betweenSpecialistAndPosts,
  renderPostsFeed = true,
  renderFeedRecommendations: renderFeedRecommendationsProp,
}) => {
  const showFeedRecommendations = renderFeedRecommendationsProp ?? renderPostsFeed;

  const listContent = (
    <View style={styles.scrollContent}>
      {betweenSpecialistAndPosts}
      {renderPostsFeed ? (
        <PostsSection posts={posts} loading={loading} loadingMore={loadingMore} error={error} onLoadMore={onLoadMore} />
      ) : null}

      {showFeedRecommendations ? (
        <>
          {events && events.length > 0 && (
            <View style={styles.sectionContainer}>
              <NextEventsSection events={events} onEventPress={onEventPress} onEventSave={onEventSave} />
            </View>
          )}

          {navigation ? (
            <RecommendedProductsSection
              navigation={navigation}
              analyticsScreenName={analyticsScreenName}
              enabled={recommendedProductsEnabled}
              style={styles.recommendedSection}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {eventBanner && onEventBannerPress && (
        <View style={styles.eventBannerContainer}>
          <EventBanner event={eventBanner} onPress={onEventBannerPress} />
        </View>
      )}
      {embedInParentScroll ? (
        listContent
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {listContent}
        </ScrollView>
      )}
    </View>
  );
};

export default SocialList;
