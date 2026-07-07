import type { UserActivity } from '@/types/activity';

/**
 * Item de activity formatado para exibição no frontend
 */
export interface ActivityItem {
  id: string;
  type: 'program' | 'appointment' | 'personal';
  title: string;
  description: string;
  dateTime?: string;
  providerName?: string;
  providerAvatar?: string;
  completed?: boolean;
  declined?: boolean;
  isFavorite?: boolean;
  meetUrl?: string;
}

/**
 * Opções de configuração do hook useActivities
 */
export interface UseActivitiesOptions {
  enabled?: boolean;
  includeDeleted?: boolean;
  autoLoad?: boolean;
}

/**
 * Retorno do hook useActivities
 */
export interface UseActivitiesReturn {
  activities: ActivityItem[];
  rawActivities: UserActivity[];
  loading: boolean;
  error: string | null;
  historyActivities: ActivityItem[];
  activeActivities: ActivityItem[];
  loadActivities: (includeDeleted?: boolean, options?: { silent?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  formatDate: (date: Date) => string;
  parseTimeString: (timeString: string, baseDate: Date) => Date;
  isToday: (date: Date) => boolean;
}
