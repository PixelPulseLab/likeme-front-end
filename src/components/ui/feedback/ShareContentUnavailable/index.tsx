import React, { useEffect } from 'react';
import EmptyState from '@/components/ui/feedback/EmptyState';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import type { ShareContentType } from '@/constants/share';
import { useTranslation } from '@/hooks/i18n';

export type ShareContentUnavailableProps = {
  contentType?: ShareContentType;
  itemId?: string;
  screenName?: string;
  onGoHome?: () => void;
};

const ShareContentUnavailable: React.FC<ShareContentUnavailableProps> = ({
  contentType,
  itemId,
  screenName,
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
    <EmptyState
      title={t('share.contentUnavailable')}
      description={t('share.contentUnavailableDescription')}
      iconName='link-off'
      actionLabel={onGoHome ? t('share.goToHome') : undefined}
      onActionPress={onGoHome}
    />
  );
};

export default ShareContentUnavailable;
