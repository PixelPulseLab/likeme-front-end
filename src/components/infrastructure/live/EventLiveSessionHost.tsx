import React from 'react';
import { EventWebViewSession } from '@/components/infrastructure/webview/EventWebViewSession';

export type EventLiveSessionHostProps = {
  webViewUrl: string | null;
  onClose: () => void;
};

export const EventLiveSessionHost: React.FC<EventLiveSessionHostProps> = ({ webViewUrl, onClose }) => {
  if (!webViewUrl) {
    return null;
  }
  return <EventWebViewSession url={webViewUrl} onClose={onClose} />;
};
