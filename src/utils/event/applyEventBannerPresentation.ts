import type { EventBannerFromApi, EventBannerData, EventBannerVariant, EventJoinModeFromApi } from '@/types/event';

export type ApplyEventBannerPresentationParams = {
  banner: EventBannerFromApi | null | undefined;
  communityAvatarUrl?: string | null;
  communityProviderName?: string | null;
  defaultThumbnailUrl: string;
  hasProgramAccess?: boolean;
  programProductId?: string | null;
};

function effectiveBannerVariant(
  apiVariant: EventBannerVariant,
  apiStatus: EventBannerFromApi['status'],
  externalUrl: string | undefined,
  joinMode: EventJoinModeFromApi | undefined,
  effectiveHasProgramAccess: boolean,
): EventBannerVariant {
  if (!effectiveHasProgramAccess) {
    return 'purchase';
  }
  if (apiVariant !== 'purchase') {
    return apiVariant;
  }
  const isLive = apiStatus === 'live';
  const canJoin = isLive && joinMode !== 'none' && Boolean(externalUrl?.trim());
  if (canJoin) {
    return 'live_join';
  }
  return 'reminder';
}

function uiStatusFromApi(status: EventBannerFromApi['status']): EventBannerData['status'] {
  return status === 'scheduled' ? 'Scheduled' : 'Live Now';
}

export function applyEventBannerPresentation(params: ApplyEventBannerPresentationParams): EventBannerData | undefined {
  const {
    banner,
    communityAvatarUrl,
    communityProviderName,
    defaultThumbnailUrl,
    hasProgramAccess = false,
    programProductId = null,
  } = params;

  if (!banner) {
    return undefined;
  }

  const communityThumb = communityAvatarUrl?.trim();
  const thumbnail = communityThumb && communityThumb.length > 0 ? communityThumb : defaultThumbnailUrl;
  const providerName = communityProviderName?.trim();
  const host = providerName && providerName.length > 0 ? providerName : banner.host;

  return {
    id: banner.id,
    title: banner.title,
    host,
    status: uiStatusFromApi(banner.status),
    startTime: banner.startsAt,
    endTime: banner.endsAt,
    thumbnail,
    externalUrl: banner.externalUrl,
    provider: banner.provider,
    joinMode: banner.joinMode,
    variant: effectiveBannerVariant(
      banner.variant,
      banner.status,
      banner.externalUrl,
      banner.joinMode,
      hasProgramAccess,
    ),
    communityId: banner.communityId,
    programProductId,
  };
}
