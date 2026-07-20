import type { ImageSourcePropType } from 'react-native';

/** Evento exibido em cards do feed (ex.: canais / próximos eventos na UI legada). */
export interface FeedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  thumbnail: string;
  participants: EventParticipant[];
  participantsCount: number;
}

export interface EventParticipant {
  id: string;
  avatar?: string;
  name?: string;
  color?: 'Blue' | 'Light Pink' | 'Pink' | 'Green';
}

export type EventBannerStatus = 'Live Now' | 'Scheduled';

export type EventBannerVariant = 'purchase' | 'reminder' | 'reminder_created' | 'live_join';

export type EventJoinMode = 'external_browser' | 'none';

/** Valor legado ainda aceito na API; tratado como `external_browser`. */
export type EventJoinModeFromApi = EventJoinMode | 'zoom_sdk';

export interface EventBannerData {
  id: string;
  title: string;
  host: string;
  status: EventBannerStatus;
  startTime: string;
  endTime: string;
  thumbnail: ImageSourcePropType | string;
  externalUrl?: string;
  provider?: 'zoom' | 'unknown';
  joinMode?: EventJoinModeFromApi;
  variant?: EventBannerVariant;
  communityId?: string;
  programProductId?: string | null;
}

/** Banner de evento retornado pela API (domínio; sem thumbnail da tela). */
export interface CommunityEventBannerFromApi {
  id: string;
  title: string;
  host: string;
  status: 'scheduled' | 'live';
  startsAt: string;
  endsAt: string;
  externalUrl?: string;
  provider: 'zoom' | 'unknown';
  joinMode: EventJoinModeFromApi;
  variant: EventBannerVariant;
  communityId: string;
  programProductId: string | null;
}

/** Evento retornado pela API (Social Plus / comunidade). */
export interface Event {
  id: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'error' | 'unknown';
  provider: 'zoom' | 'unknown';
  externalUrl?: string;
  source: 'social_plus';
  joinMode?: EventJoinModeFromApi;
  displayHost?: string;
}

export interface ListEventsApiResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: {
    events?: Event[];
    programProductId?: string | null;
    hasProgramAccess?: boolean;
    banner?: CommunityEventBannerFromApi | null;
  };
}

export interface ScheduledCommunityEventRemindersListApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    eventIds?: string[];
  };
}

export interface RegisterScheduledCommunityEventReminderApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    registered?: boolean;
    reason?: string;
  };
}
