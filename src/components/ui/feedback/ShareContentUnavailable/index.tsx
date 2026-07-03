import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '@/components/ui/buttons/Primary';
import SecondaryButton from '@/components/ui/buttons/Secondary';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import type { ShareContentType } from '@/constants/share';
import { useTranslation } from '@/hooks/i18n';
import { styles } from './styles';

export type ShareContentUnavailableProps = {
  contentType?: ShareContentType;
  itemId?: string;
  screenName?: string;
  onDiscover?: () => void;
  onGoHome?: () => void;
};

const ShareContentUnavailable: React.FC<ShareContentUnavailableProps> = ({
  contentType,
  itemId,
  screenName,
  onDiscover,
  onGoHome,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    logEvent(GA4_EVENTS.SELECT_CONTENT, {
      [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_content_unavailable',
      ...(contentType && { [ANALYTICS_PARAMS.CONTENT_TYPE]: contentType }),
      ...(itemId && { [ANALYTICS_PARAMS.ITEM_ID]: itemId }),
      ...(screenName && { [ANALYTICS_PARAMS.SCREEN_NAME]: screenName }),
    });
  }, [contentType, itemId, screenName]);

  return (
    <View style={styles.container}>
      <View style={styles.messageBlock}>
        <Text style={styles.title}>{t('share.exclusiveContentTitle')}</Text>
        <Text style={styles.description}>{t('share.exclusiveContentDescription')}</Text>
      </View>
      {(onDiscover || onGoHome) && (
        <View style={styles.actions}>
          {onDiscover ? (
            <PrimaryButton label={t('share.discover')} onPress={onDiscover} size='large' style={styles.primaryButton} />
          ) : null}
          {onGoHome ? (
            <SecondaryButton
              label={t('share.goToHome')}
              onPress={onGoHome}
              size='large'
              style={styles.secondaryButton}
            />
          ) : null}
        </View>
      )}
    </View>
  );
};

export default ShareContentUnavailable;
