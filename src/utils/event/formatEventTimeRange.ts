function normalizeRawTime(value: string): string {
  return value.trim();
}

export function formatEventTime(value: string, locale = 'pt-BR'): string {
  const normalizedValue = normalizeRawTime(value);
  if (!normalizedValue) {
    return '';
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue;
  }

  return parsedDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatEventTimeRange(startTime: string, endTime: string, locale = 'pt-BR'): string {
  const formattedStartTime = formatEventTime(startTime, locale);
  const formattedEndTime = formatEventTime(endTime, locale);

  if (formattedStartTime && formattedEndTime) {
    return `${formattedStartTime} - ${formattedEndTime}`;
  }

  return formattedStartTime || formattedEndTime;
}

export function formatEventScheduleLabel(startTime: string, endTime: string, locale = 'pt-BR'): string {
  const normalizedStart = normalizeRawTime(startTime);
  if (!normalizedStart) {
    return '';
  }

  const parsedStart = new Date(normalizedStart);
  if (Number.isNaN(parsedStart.getTime())) {
    return formatEventTimeRange(startTime, endTime, locale);
  }

  const datePart = parsedStart.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = formatEventTimeRange(startTime, endTime, locale);

  if (!timePart) {
    return datePart;
  }

  return `${datePart} · ${timePart}`;
}
