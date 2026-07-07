import React from 'react';
import { View, Text, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { EventBannerData, EventBannerVariant } from '@/types/event';
import { useTranslation } from '@/hooks/i18n';
import { formatEventScheduleLabel } from '@/utils/event/formatEventTimeRange';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { styles } from './styles';

type Props = {
  event: EventBannerData;
  onPress: (event: EventBannerData) => void;
};

function titleKey(variant: EventBannerVariant | undefined): string {
  switch (variant) {
    case 'purchase':
      return 'community.eventBanner.purchaseTitlePrefix';
    case 'reminder':
    case 'reminder_created':
      return 'community.eventBanner.reminderTitlePrefix';
    case 'live_join':
      return 'community.eventBanner.liveStartedTitle';
    default:
      return 'community.eventBanner.withHost';
  }
}

function ctaLabelKey(variant: EventBannerVariant | undefined): string {
  switch (variant) {
    case 'purchase':
      return 'community.eventBanner.guaranteeSpot';
    case 'reminder':
      return 'community.eventBanner.createReminder';
    case 'reminder_created':
      return 'community.eventBanner.reminderCreated';
    case 'live_join':
      return 'community.eventBanner.joinLive';
    default:
      return 'community.eventBanner.goToEvent';
  }
}

const EventBanner: React.FC<Props> = ({ event, onPress }) => {
  const { t } = useTranslation();
  const isImageUri = typeof event.thumbnail === 'string';
  const eventScheduleLabel =
    formatEventScheduleLabel(event.startTime, event.endTime) || t('community.eventBanner.todayFallback');
  const variant = event.variant;
  const ctaDisabled = variant === 'reminder_created';
  const title = variant === 'live_join' ? t(titleKey(variant)) : `${t(titleKey(variant))} ${event.title}`.trim();

  return (
    <View style={styles.container}>
      <View style={styles.imageSide}>
        {isImageUri ? (
          <CachedImage source={{ uri: event.thumbnail as string }} style={styles.image} />
        ) : (
          <CachedImage source={event.thumbnail as ImageSourcePropType} style={styles.image} />
        )}
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={[styles.ctaButton, ctaDisabled ? styles.ctaButtonDisabled : null]}
            onPress={() => onPress(event)}
            activeOpacity={0.8}
            disabled={ctaDisabled}
          >
            <Text style={styles.ctaButtonText}>{t(ctaLabelKey(variant))}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.titleSection}>
            <View style={styles.cameraIcon}>
              <Icon name='videocam' size={24} color='#001137' />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>
          <View style={styles.timeContainer}>
            {event.status === 'Live Now' && variant !== 'purchase' ? (
              <>
                <Text style={styles.timeLabel}>{t('community.eventBanner.statusLiveNow')}</Text>
                <Text style={styles.time}>{eventScheduleLabel}</Text>
              </>
            ) : null}
            {event.status === 'Scheduled' && variant !== 'live_join' ? (
              <Text style={styles.time}>{eventScheduleLabel}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export default EventBanner;
