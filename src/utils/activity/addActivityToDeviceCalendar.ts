import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { logger } from '@/utils/logger';

export type DeviceCalendarActivityInput = {
  name: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  description?: string;
};

function parseAmPmTimeToParts(timeString: string | undefined): { hours: number; minutes: number } | null {
  if (!timeString?.trim()) {
    return null;
  }

  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    return null;
  }

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  if (period === 'pm' && hours !== 12) {
    hours += 12;
  }
  if (period === 'am' && hours === 12) {
    hours = 0;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return { hours, minutes };
}

function combineLocalDateAndTime(dateYmd: string | undefined, timeString: string | undefined, fallback: Date): Date {
  const base = dateYmd && /^\d{4}-\d{2}-\d{2}$/.test(dateYmd) ? dateYmd : null;
  const timeParts = parseAmPmTimeToParts(timeString);

  if (!base) {
    const copy = new Date(fallback);
    if (timeParts) {
      copy.setHours(timeParts.hours, timeParts.minutes, 0, 0);
    }
    return copy;
  }

  const [year, month, day] = base.split('-').map(Number);
  const result = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (timeParts) {
    result.setHours(timeParts.hours, timeParts.minutes, 0, 0);
  } else {
    result.setHours(fallback.getHours(), fallback.getMinutes(), 0, 0);
  }
  return result;
}

async function writableCalendarId(): Promise<string> {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Permissão de calendário negada');
  }

  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    if (defaultCalendar?.id) {
      return defaultCalendar.id;
    }
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find(
    (calendar) =>
      calendar.allowsModifications &&
      (calendar.accessLevel === Calendar.CalendarAccessLevel.OWNER ||
        calendar.accessLevel === Calendar.CalendarAccessLevel.EDITOR ||
        calendar.accessLevel === Calendar.CalendarAccessLevel.ROOT),
  );

  if (writable?.id) {
    return writable.id;
  }

  if (Platform.OS === 'android') {
    const createdId = await Calendar.createCalendarAsync({
      title: 'Like:Me',
      color: '#0154f8',
      entityType: Calendar.EntityTypes.EVENT,
      source: { isLocalAccount: true, name: 'Like:Me', type: Calendar.SourceType.LOCAL },
      name: 'likeme',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return createdId;
  }

  throw new Error('Nenhuma agenda gravável encontrada no dispositivo');
}

export async function addActivityToDeviceCalendar(input: DeviceCalendarActivityInput): Promise<string> {
  const startDate = combineLocalDateAndTime(input.startDate, input.startTime, new Date());
  const endFallback = new Date(startDate.getTime() + 60 * 60 * 1000);
  const endDate = combineLocalDateAndTime(input.endDate ?? input.startDate, input.endTime, endFallback);

  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
  }

  const calendarId = await writableCalendarId();
  const eventId = await Calendar.createEventAsync(calendarId, {
    title: input.name.trim() || 'Atividade Like:Me',
    startDate,
    endDate,
    location: input.location?.trim() || undefined,
    notes: input.description?.trim() || undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  logger.debug('[addActivityToDeviceCalendar] evento criado', { eventId, calendarId });
  return eventId;
}
