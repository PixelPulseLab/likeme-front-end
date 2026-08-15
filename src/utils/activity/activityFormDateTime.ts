const LOCAL_DATE_YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const AM_PM_TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i;

export function activityDateValueFromYmd(dateYmd: string | undefined, fallback = new Date()): Date {
  const value = dateYmd?.trim();
  if (!value) {
    return new Date(fallback);
  }

  const match = value.match(LOCAL_DATE_YMD_PATTERN);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(fallback) : parsed;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const localDate = new Date(year, month - 1, day);

  if (localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day) {
    return new Date(fallback);
  }

  return localDate;
}

export function activityTimeValueFromAmPm(timeString: string | undefined, fallback = new Date()): Date {
  const date = new Date(fallback);
  const value = timeString?.trim();
  if (!value) {
    return date;
  }

  const match = value.match(AM_PM_TIME_PATTERN);
  if (!match) {
    return date;
  }

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return date;
  }

  if (period === 'pm' && hours !== 12) {
    hours += 12;
  }
  if (period === 'am' && hours === 12) {
    hours = 0;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}
