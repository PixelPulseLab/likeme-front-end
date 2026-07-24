import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ActivityListScope, UserActivity } from '@/types/activity';
import type { ActivityItem, UseActivitiesOptions, UseActivitiesReturn } from '@/types/activity/hooks';
import {
  fetchActivityList,
  isStaleActivityListRequestError,
  readCachedActivityList,
  shouldSkipActivityListFetch,
} from '@/utils/activity/activityListCache';
import { userActivitiesToItems } from '@/utils/activity/userActivityToItem';
import { logger } from '@/utils/logger';

export type LoadActivitiesOptions = {
  silent?: boolean;
};

type ScopeData = {
  rawActivities: UserActivity[];
  activities: ActivityItem[];
};

function buildScopeData(listScope: ActivityListScope): ScopeData {
  const rawActivities = readCachedActivityList(listScope) ?? [];
  return {
    rawActivities,
    activities: userActivitiesToItems(rawActivities),
  };
}

function emptyScopeData(): ScopeData {
  return {
    rawActivities: [],
    activities: [],
  };
}

function sameActivityLists(left: UserActivity[], right: UserActivity[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (item, index) =>
      item.id === right[index]?.id &&
      item.updatedAt === right[index]?.updatedAt &&
      item.deletedAt === right[index]?.deletedAt,
  );
}

/**
 * Hook para gerenciar activities
 * @param options - Opções de configuração do hook
 * @returns Objeto com activities, estados e funções auxiliares
 */
export const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const { enabled = true, listScope: defaultListScope = 'active', autoLoad = true } = options;

  const [dataByScope, setDataByScope] = useState<Record<ActivityListScope, ScopeData>>(() => ({
    active: buildScopeData('active'),
    history: buildScopeData('history'),
  }));
  const [displayedScope, setDisplayedScope] = useState<ActivityListScope>(defaultListScope);
  const [loading, setLoading] = useState(() => buildScopeData(defaultListScope).rawActivities.length === 0);
  const [error, setError] = useState<string | null>(null);

  const activities = dataByScope[displayedScope].activities;
  const rawActivities = dataByScope[displayedScope].rawActivities;

  const applyScopeData = useCallback((listScope: ActivityListScope, list: UserActivity[]) => {
    setDataByScope((current) => {
      if (sameActivityLists(current[listScope].rawActivities, list)) {
        return current;
      }

      return {
        ...current,
        [listScope]: {
          rawActivities: list,
          activities: userActivitiesToItems(list),
        },
      };
    });
  }, []);

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

  /**
   * Carrega activities do backend
   */
  const loadActivities = useCallback(
    async (listScope: ActivityListScope = defaultListScope, loadOptions?: LoadActivitiesOptions) => {
      if (!enabled) {
        return;
      }

      setDisplayedScope(listScope);

      const cachedList = readCachedActivityList(listScope);
      let hasDisplayedData = false;

      setDataByScope((current) => {
        hasDisplayedData = current[listScope].rawActivities.length > 0;
        if (cachedList && !sameActivityLists(current[listScope].rawActivities, cachedList)) {
          return {
            ...current,
            [listScope]: {
              rawActivities: cachedList,
              activities: userActivitiesToItems(cachedList),
            },
          };
        }
        return current;
      });

      const hasCachedData = cachedList != null;
      const silent = loadOptions?.silent === true || hasCachedData || hasDisplayedData;

      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        if (silent && shouldSkipActivityListFetch(listScope)) {
          setLoading(false);
          return;
        }

        const activitiesList = await fetchActivityList(listScope);
        applyScopeData(listScope, activitiesList);

        logger.debug('Activities loaded:', {
          count: activitiesList.length,
          listScope,
          silent,
        });
      } catch (err) {
        if (isStaleActivityListRequestError(err)) {
          logger.debug('Ignoring stale activities response after cache invalidation', { listScope });
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atividades';
        setError(errorMessage);
        if (!hasCachedData && !hasDisplayedData) {
          setDataByScope((current) => ({
            ...current,
            [listScope]: emptyScopeData(),
          }));
        }
        logger.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    },
    [applyScopeData, defaultListScope, enabled],
  );

  /**
   * Recarrega activities
   */
  const refresh = useCallback(async () => {
    await loadActivities(displayedScope);
  }, [displayedScope, loadActivities]);

  const removeActivityLocally = useCallback(
    (activityId: string, scopes: ActivityListScope[] = ['active', 'history']) => {
      setDataByScope((current) => {
        let next = current;

        for (const scope of scopes) {
          const currentRawActivities = current[scope].rawActivities;
          const nextRawActivities = currentRawActivities.filter((activity) => activity.id !== activityId);

          if (nextRawActivities.length === currentRawActivities.length) {
            continue;
          }

          if (next === current) {
            next = { ...current };
          }

          next[scope] = {
            rawActivities: nextRawActivities,
            activities: userActivitiesToItems(nextRawActivities),
          };
        }

        return next;
      });
    },
    [],
  );

  const historyActivities = useMemo(() => dataByScope.history.activities, [dataByScope.history.activities]);
  const activeActivities = useMemo(() => dataByScope.active.activities, [dataByScope.active.activities]);

  // Auto-load activities quando enabled e autoLoad são true
  useEffect(() => {
    if (enabled && autoLoad) {
      loadActivities(defaultListScope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, autoLoad, defaultListScope]);

  return {
    activities,
    rawActivities,
    loading,
    error,
    historyActivities,
    activeActivities,
    loadActivities,
    removeActivityLocally,
    refresh,
    formatDate,
    parseTimeString,
    isToday,
  };
};
