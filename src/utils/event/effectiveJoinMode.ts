import { classifyExternalJoinUrl } from '@/utils/event/classifyExternalJoinUrl';
import type { EventBannerData, EventJoinMode } from '@/types/event';

export function effectiveJoinMode(banner: EventBannerData): EventJoinMode {
  if (banner.joinMode) {
    if (banner.joinMode === 'zoom_sdk') {
      return 'external_browser';
    }
    return banner.joinMode;
  }
  const how = classifyExternalJoinUrl(banner.externalUrl);
  if (how.kind === 'none') {
    return 'none';
  }
  if (how.kind === 'jitsi') {
    return 'jitsi_embed';
  }
  if (how.kind === 'zoom') {
    return 'external_browser';
  }
  return 'external_browser';
}
