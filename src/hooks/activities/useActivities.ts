import { useState, useCallback, useMemo, useEffect } from 'react';
import type { UserActivity } from '@/types/activity';
import type { ActivityItem, UseActivitiesOptions, UseActivitiesReturn } from '@/types/activity/hooks';
import {
  fetchActivityList,
  readCachedActivityList,
  shouldSkipActivityListFetch,
} from '@/utils/activity/activityListCache';
import { userActivitiesToItems } from '@/utils/activity/userActivityToItem';
import { logger } from '@/utils/logger';

export type LoadActivitiesOptions = {
  silent?: boolean;
};

function initialRawActivities(includeDeleted: boolean): UserActivity[] {
  return readCachedActivityList(includeDeleted) ?? [];
}

/**
 * Hook para gerenciar activities
 * @param options - Opções de configuração do hook
 * @returns Objeto com activities, estados e funções auxiliares
 */
export const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const { enabled = true, includeDeleted: defaultIncludeDeleted = false, autoLoad = true } = options;

  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    userActivitiesToItems(initialRawActivities(defaultIncludeDeleted)),
  );
  const [rawActivities, setRawActivities] = useState<UserActivity[]>(() => initialRawActivities(defaultIncludeDeleted));
  const [loading, setLoading] = useState(() => initialRawActivities(defaultIncludeDeleted).length === 0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Formata uma data para exibição (ex: "13 Nov.")
   */
  const formatDate = useCallback((date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}.`;
  }, []);

  /**
   * Parseia uma string de tempo (ex: "8:15 pm") para Date
   */
  const parseTimeString = useCallback((timeString: string, baseDate: Date): Date => {
    const date = new Date(baseDate);
    const time = timeString.toLowerCase().trim();
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours, 10);
    const min = parseInt(minutes || '0', 10);

    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }

    date.setHours(hour, min, 0, 0);
    return date;
  }, []);

  /**
   * Verifica se uma data é hoje
   */
  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const applyActivityList = useCallback((list: UserActivity[]) => {
    setRawActivities(list);
    setActivities(userActivitiesToItems(list));
  }, []);

  /**
   * Carrega activities do backend
   */
  const loadActivities = useCallback(
    async (includeDeleted: boolean = defaultIncludeDeleted, loadOptions?: LoadActivitiesOptions) => {
      if (!enabled) {
        return;
      }

      const silent = loadOptions?.silent === true;
      const hasCachedData = readCachedActivityList(includeDeleted) != null;

      try {
        if (!silent && !hasCachedData) {
          setLoading(true);
        }
        setError(null);

        if (silent && shouldSkipActivityListFetch(includeDeleted)) {
          const cachedList = readCachedActivityList(includeDeleted);
          if (cachedList) {
            applyActivityList(cachedList);
            setLoading(false);
            return;
          }
        }

        const activitiesList = await fetchActivityList(includeDeleted);
        applyActivityList(activitiesList);

        logger.debug('Activities loaded:', {
          count: activitiesList.length,
          includeDeleted,
          silent,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atividades';
        setError(errorMessage);
        if (!hasCachedData) {
          setActivities([]);
          setRawActivities([]);
        }
        logger.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    },
    [applyActivityList, defaultIncludeDeleted, enabled],
  );

  /**
   * Recarrega activities
   */
  const refresh = useCallback(async () => {
    await loadActivities(defaultIncludeDeleted);
  }, [loadActivities, defaultIncludeDeleted]);

  // Computed values
  const historyActivities = useMemo(() => {
    return activities.filter((a) => a.completed);
  }, [activities]);

  const activeActivities = useMemo(() => {
    return activities.filter((a) => !a.completed);
  }, [activities]);

  // Auto-load activities quando enabled e autoLoad são true
  useEffect(() => {
    if (enabled && autoLoad) {
      loadActivities(defaultIncludeDeleted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, autoLoad, defaultIncludeDeleted]);

  return {
    activities,
    rawActivities,
    loading,
    error,
    historyActivities,
    activeActivities,
    loadActivities,
    refresh,
    formatDate,
    parseTimeString,
    isToday,
  };
};
