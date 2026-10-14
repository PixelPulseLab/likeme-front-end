import React from 'react';
import { View, Text, Pressable, type ImageSourcePropType } from 'react-native';
import Icon from '@/components/ui/layout/Icon';
import type { EventBannerData, EventBannerVariant } from '@/types/event';
import { useTranslation } from '@/hooks/i18n';
import { formatEventScheduleLabel } from '@/utils/event/formatEventTimeRange';
import { CachedImage } from '@/components/ui/media/CachedImage';
import { styles } from './styles';

type Props = {
  event: EventBannerData;
  onPress: (event: EventBannerData) => void;
  /** Toque no botão de CTA; quando ausente, usa `onPress`. */
  onCtaPress?: (event: EventBannerData) => void;
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

function EventScheduleLabel({ label }: { label: string }) {
  const separator = ' · ';
  const separatorIndex = label.indexOf(separator);
  if (separatorIndex === -1) {
    return <Text style={styles.time}>{label}</Text>;
  }

  const datePart = label.slice(0, separatorIndex);
  const timePart = label.slice(separatorIndex + separator.length);

  return (
    <Text style={styles.time}>
      <Text style={styles.scheduleDate}>{datePart}</Text>
      <Text style={styles.scheduleDot}>{separator}</Text>
      <Text style={styles.scheduleTime}>{timePart}</Text>
    </Text>
  );
}

function ctaLabelKey(variant: EventBannerVariant | undefined): string {
  switch (variant) {
    case 'purchase':
      return 'community.eventBanner.guaranteeSpot';
    case 'reminder':
      return 'community.eventBanner.createReminder';
    case 'reminder_created':
      return 'community.eventBanner.viewReminder';
    case 'live_join':
      return 'community.eventBanner.joinLive';
    default:
      return 'community.eventBanner.goToEvent';
  }
}

const EventBanner: React.FC<Props> = ({ event, onPress, onCtaPress }) => {
  const { t } = useTranslation();
  const isImageUri = typeof event.thumbnail === 'string';
  const eventScheduleLabel =
    formatEventScheduleLabel(event.startTime, event.endTime) || t('community.eventBanner.todayFallback');
  const variant = event.variant;
  const title = variant === 'live_join' ? t(titleKey(variant)) : `${t(titleKey(variant))} ${event.title}`.trim();

  const handleCtaPress = () => {
    (onCtaPress ?? onPress)(event);
  };

  return (
    <Pressable style={styles.container} onPress={() => onPress(event)} accessibilityRole='button'>
      <View style={styles.imageSide} pointerEvents='box-none'>
        {isImageUri ? (
          <CachedImage pointerEvents='none' source={{ uri: event.thumbnail as string }} style={styles.image} />
        ) : (
          <CachedImage pointerEvents='none' source={event.thumbnail as ImageSourcePropType} style={styles.image} />
        )}
        <View style={styles.imageOverlay} pointerEvents='box-none'>
          <Pressable
            style={styles.ctaButton}
            onPress={handleCtaPress}
            accessibilityRole='button'
            accessibilityLabel={t(ctaLabelKey(variant))}
          >
            <Text style={styles.ctaButtonText}>{t(ctaLabelKey(variant))}</Text>
          </Pressable>
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
                <EventScheduleLabel label={eventScheduleLabel} />
              </>
            ) : null}
            {event.status === 'Scheduled' && variant !== 'live_join' ? (
              <EventScheduleLabel label={eventScheduleLabel} />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default EventBanner;
