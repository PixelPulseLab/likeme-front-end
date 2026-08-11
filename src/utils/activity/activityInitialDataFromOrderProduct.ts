import type { Product } from '@/types/product';

export type ActivityFormInitialData = {
  name: string;
  type: 'task' | 'event';
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  description?: string;
  reminderEnabled: boolean;
  reminderMinutes?: number;
  addToDeviceCalendar: boolean;
};

function localDateYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTimeAmPm(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function activityInitialDataFromOrderProduct(product: Product | undefined | null): ActivityFormInitialData {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  if (start.getTime() <= now.getTime()) {
    start.setHours(start.getHours() + 1);
  }
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const dateYmd = localDateYmd(start);

  return {
    name: product?.name?.trim() || '',
    type: 'event',
    startDate: dateYmd,
    startTime: localTimeAmPm(start),
    endDate: dateYmd,
    endTime: localTimeAmPm(end),
    location: '',
    description: product?.description?.trim() || undefined,
    reminderEnabled: false,
    reminderMinutes: 5,
    addToDeviceCalendar: true,
  };
}
