import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { EventBannerData } from '@/types/event';
import { createDeviceCalendarInstantEvent } from '@/utils/activity/addActivityToDeviceCalendar';
import { logger } from '@/utils/logger';

const DEVICE_CALENDAR_COMMUNITY_EVENT_KEY_PREFIX = '@likeme:device_calendar:community_event:';

export type VirtualLiveSchedule = {
  start: Date;
  end: Date;
};

export function virtualLiveScheduleFromBanner(banner: EventBannerData): VirtualLiveSchedule | null {
  const startRaw = banner.startTime?.trim();
  const endRaw = banner.endTime?.trim();
  if (!startRaw || !endRaw) {
    return null;
  }

  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  if (end.getTime() <= start.getTime()) {
    return null;
  }

  return { start, end };
}

export function virtualLiveCommunityDeepLink(communityId: string | undefined): string | null {
  const id = communityId?.trim();
  if (!id) {
    return null;
  }
  return `likeme://community/${encodeURIComponent(id)}`;
}

export function virtualLiveDeviceCalendarTitle(banner: EventBannerData): string {
  const title = banner.title?.trim() || 'Live Like:Me';
  const host = banner.host?.trim();
  if (!host) {
    return title;
  }
  return `${title} — ${host}`;
}

export function virtualLiveDeviceCalendarNotes(banner: EventBannerData, deepLink: string | null): string {
  const lines: string[] = [];
  const host = banner.host?.trim();
  if (host) {
    lines.push(host);
  }
  if (deepLink) {
    lines.push(deepLink);
  }
  return lines.join('\n');
}

function deviceCalendarStorageKey(eventId: string): string {
  return `${DEVICE_CALENDAR_COMMUNITY_EVENT_KEY_PREFIX}${eventId.trim()}`;
}

export async function hasVirtualLiveDeviceCalendarEntry(eventId: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(deviceCalendarStorageKey(eventId));
  return stored != null && stored.length > 0;
}

async function markVirtualLiveDeviceCalendarEntry(eventId: string, nativeCalendarEventId: string): Promise<void> {
  await AsyncStorage.setItem(deviceCalendarStorageKey(eventId), nativeCalendarEventId);
}

export async function addVirtualLiveBannerToDeviceCalendar(banner: EventBannerData): Promise<string> {
  const schedule = virtualLiveScheduleFromBanner(banner);
  if (!schedule) {
    throw new Error('Horário da live inválido para agenda');
  }

  const alreadyAdded = await hasVirtualLiveDeviceCalendarEntry(banner.id);
  if (alreadyAdded) {
    throw new Error('Live já incluída na agenda deste dispositivo');
  }

  const deepLink = virtualLiveCommunityDeepLink(banner.communityId);
  const nativeEventId = await createDeviceCalendarInstantEvent({
    title: virtualLiveDeviceCalendarTitle(banner),
    startDate: schedule.start,
    endDate: schedule.end,
    notes: virtualLiveDeviceCalendarNotes(banner, deepLink),
  });

  await markVirtualLiveDeviceCalendarEntry(banner.id, nativeEventId);
  return nativeEventId;
}

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

export function promptAddVirtualLiveToDeviceCalendar(banner: EventBannerData, t: TranslateFn): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => resolve();

    void hasVirtualLiveDeviceCalendarEntry(banner.id).then((alreadyAdded) => {
      if (alreadyAdded) {
        finish();
        return;
      }

      Alert.alert(
        t('community.eventBanner.addToCalendarTitle', { defaultValue: 'Adicionar à agenda?' }),
        t('community.eventBanner.addToCalendarMessage', {
          defaultValue: 'Inclua esta live na agenda do celular com o horário de início e término.',
        }),
        [
          {
            text: t('community.eventBanner.addToCalendarDecline', { defaultValue: 'Agora não' }),
            style: 'cancel',
            onPress: finish,
          },
          {
            text: t('community.eventBanner.addToCalendarConfirm', { defaultValue: 'Adicionar' }),
            onPress: () => {
              void addVirtualLiveBannerToDeviceCalendar(banner)
                .catch((error: unknown) => {
                  logger.error('[virtualLiveDeviceCalendar] Falha ao adicionar live à agenda', {
                    eventId: banner.id,
                    communityId: banner.communityId,
                    cause: error,
                  });
                  const message =
                    error instanceof Error && error.message.includes('negada')
                      ? t('community.eventBanner.addToCalendarPermissionDenied', {
                          defaultValue: 'Permissão de calendário negada. O lembrete no Like:Me continua ativo.',
                        })
                      : t('community.eventBanner.addToCalendarFailed', {
                          defaultValue: 'Não foi possível adicionar à agenda. O lembrete no Like:Me continua ativo.',
                        });
                  Alert.alert(t('errors.error'), message);
                })
                .finally(finish);
            },
          },
        ],
        { cancelable: true, onDismiss: finish },
      );
    });
  });
}
