import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { eventService } from '@/services';
import { logger } from '@/utils/logger';
import { effectiveJoinMode } from '@/utils/event/effectiveJoinMode';
import { applyCommunityEventBannerPresentation } from '@/utils/event/applyCommunityEventBannerPresentation';
import { useEventList } from '@/hooks/event/useEventList';
import { navigateToActivitiesActives } from '@/utils/navigation/activitiesNavigation';
import { prefetchActivityList } from '@/utils/activity/activityListCache';
import { navigateToProductDetailsScreen } from '@/utils/navigation/productNavigation';
import { useTranslation } from '@/hooks/i18n';
import type { EventBannerData } from '@/types/event';
import type { RootStackParamList } from '@/types/navigation';

const DEFAULT_EVENT_BANNER_THUMB = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800';

function eventBannerIsOnToday(banner: EventBannerData): boolean {
  if (banner.status === 'Live Now') {
    return true;
  }
  const startsAt = banner.startTime?.trim();
  if (!startsAt) {
    return false;
  }
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.toDateString() === new Date().toDateString();
}

export type UseCommunityEventBannerOptions = {
  enabled?: boolean;
  communityId?: string;
  communityAvatarUrl?: string | null;
  communityProviderName?: string | null;
  programProductId?: string | null;
  hasProgramAccess?: boolean;
  defaultThumbnailUrl?: string;
  navigation?: StackNavigationProp<RootStackParamList>;
  /** Quando true, oculta o banner se o evento não for hoje (ex.: home). Live Now sempre conta como hoje. */
  onlyOnEventDay?: boolean;
};

export type UseCommunityEventBannerReturn = {
  eventBanner: EventBannerData | undefined;
  eventJoinUrl: string | null;
  closeEventSession: () => void;
  handleEventBannerPress: (banner: EventBannerData) => Promise<void>;
  refreshReminderState: () => Promise<void>;
};

export function useCommunityEventBanner(options: UseCommunityEventBannerOptions = {}): UseCommunityEventBannerReturn {
  const { t } = useTranslation();
  const {
    enabled = false,
    communityId,
    communityAvatarUrl,
    communityProviderName,
    programProductId: programProductIdOption,
    hasProgramAccess: hasProgramAccessOption,
    defaultThumbnailUrl = DEFAULT_EVENT_BANNER_THUMB,
    navigation,
    onlyOnEventDay = false,
  } = options;

  const communityIdTrimmed = communityId?.trim() ?? '';
  const eventsEnabled = enabled && communityIdTrimmed.length > 0;

  const {
    banner: apiBanner,
    programProductId: programProductIdFromApi,
    hasProgramAccess: hasProgramAccessFromApi,
    refresh: refreshEvents,
  } = useEventList({
    enabled: eventsEnabled,
    communityId: communityIdTrimmed,
  });

  const programProductId = programProductIdOption ?? programProductIdFromApi;
  const hasProgramAccess = hasProgramAccessOption ?? hasProgramAccessFromApi;

  const [eventJoinUrl, setEventJoinUrl] = useState<string | null>(null);

  const banner = useMemo(() => {
    if (!eventsEnabled) {
      return undefined;
    }
    const presented = applyCommunityEventBannerPresentation({
      banner: apiBanner,
      communityAvatarUrl,
      communityProviderName,
      defaultThumbnailUrl,
      hasProgramAccess,
      programProductId,
    });
    if (!presented) {
      return undefined;
    }
    if (onlyOnEventDay && !eventBannerIsOnToday(presented)) {
      return undefined;
    }
    return presented;
  }, [
    eventsEnabled,
    apiBanner,
    communityAvatarUrl,
    communityProviderName,
    defaultThumbnailUrl,
    hasProgramAccess,
    programProductId,
    onlyOnEventDay,
  ]);

  const refreshReminderState = useCallback(async () => {
    if (!enabled) {
      return;
    }
    await refreshEvents();
  }, [enabled, refreshEvents]);

  const closeEventSession = useCallback(() => {
    setEventJoinUrl(null);
  }, []);

  const openLiveSession = useCallback(async (bannerData: EventBannerData) => {
    const mode = effectiveJoinMode(bannerData);
    const url = bannerData.externalUrl?.trim();
    if (mode === 'none' || !url) {
      return;
    }
    if (mode === 'external_browser') {
      Linking.openURL(url).catch((linkError: Error) => {
        logger.error('[useCommunityEventBanner] Falha ao abrir link do evento', { url, cause: linkError });
      });
      return;
    }
    setEventJoinUrl(url);
  }, []);

  const handleEventBannerPress = useCallback(
    async (bannerData: EventBannerData) => {
      const variant = bannerData.variant ?? 'live_join';

      if (variant === 'purchase') {
        const productId = bannerData.programProductId?.trim();
        if (!productId || !navigation) {
          logger.warn('[useCommunityEventBanner] PDP indisponível para banner de compra', {
            communityId: bannerData.communityId,
            programProductId: productId,
          });
          return;
        }
        navigateToProductDetailsScreen(navigation, { productId });
        return;
      }

      if (variant === 'reminder_created') {
        return;
      }

      if (variant === 'reminder') {
        const startsAt = bannerData.startTime?.trim();
        if (!startsAt) {
          Alert.alert(t('errors.error'), t('community.eventBanner.reminderMissingSchedule'));
          return;
        }

        try {
          const response = await eventService.registerScheduledCommunityEventReminder({
            eventId: bannerData.id,
            title: bannerData.title,
            startsAt,
            communityId: bannerData.communityId,
          });

          if (response.data?.registered === false && response.data?.reason === 'already_sent') {
            await refreshReminderState();
            Alert.alert(
              t('community.eventBanner.reminderCreatedTitle'),
              t('community.eventBanner.reminderAlreadySent'),
            );
            return;
          }

          await Promise.all([refreshReminderState(), prefetchActivityList('active')]);
          if (navigation) {
            navigateToActivitiesActives(navigation);
          } else {
            Alert.alert(
              t('community.eventBanner.reminderCreatedTitle'),
              t('community.eventBanner.reminderCreatedBody'),
            );
          }
        } catch (error) {
          logger.error('[useCommunityEventBanner] Falha ao registrar lembrete do evento', {
            eventId: bannerData.id,
            communityId: bannerData.communityId,
            cause: error,
          });
          Alert.alert(t('errors.error'), t('community.eventBanner.reminderCreateError'));
        }
        return;
      }

      await openLiveSession(bannerData);
    },
    [navigation, openLiveSession, refreshReminderState, t],
  );

  return {
    eventBanner: banner,
    eventJoinUrl,
    closeEventSession,
    handleEventBannerPress,
    refreshReminderState,
  };
}
