import type { EventBannerData, EventJoinMode } from '@/types/event';

export function effectiveJoinMode(banner: EventBannerData): EventJoinMode {
  const fromApi = banner.joinMode;
  if (fromApi === 'zoom_sdk') {
    return 'external_browser';
  }
  if (fromApi) {
    return fromApi;
  }
  if (!banner.externalUrl?.trim()) {
    return 'none';
  }
  return 'external_browser';
}
