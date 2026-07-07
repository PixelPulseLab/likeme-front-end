import { useState, useCallback, useMemo, useEffect } from 'react';
import { activityService } from '@/services';
import type { UserActivity } from '@/types/activity';
import type { ActivityItem, UseActivitiesOptions, UseActivitiesReturn } from '@/types/activity/hooks';
import { logger } from '@/utils/logger';

/**
 * Hook para gerenciar activities
 * @param options - Opções de configuração do hook
 * @returns Objeto com activities, estados e funções auxiliares
 */
export const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const { enabled = true, includeDeleted: defaultIncludeDeleted = false, autoLoad = true } = options;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [rawActivities, setRawActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
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

  /**
   * Converte UserActivity do backend para ActivityItem do frontend
   */
  const convertActivityToItem = useCallback(
    (activity: UserActivity): ActivityItem => {
      let dateTime: string | undefined;
      if (activity.startDate) {
        // Parsear a data como local (não UTC) para evitar problemas de timezone
        // O backend retorna como ISO string (UTC), precisamos extrair apenas a data
        const dateStr = activity.startDate;
        let date: Date;

        // Extrair apenas a parte da data (YYYY-MM-DD) da string ISO
        const dateOnly = dateStr.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
          // Formato YYYY-MM-DD - criar como data local para preservar o dia correto
          const [year, month, day] = dateOnly.split('-').map(Number);
          date = new Date(year, month - 1, day);
        } else {
          // Outro formato - usar new Date normalmente
          date = new Date(activity.startDate);
        }
        const formattedDate = formatDate(date);
        if (activity.startTime) {
          dateTime = `${formattedDate} at ${activity.startTime}`;
        } else {
          dateTime = formattedDate;
        }
      }

      const linkedDescription = activity.description ?? '';
      const description = linkedDescription.startsWith('community_event:')
        ? activity.location ?? ''
        : linkedDescription || activity.location || '';
      const isCompleted = activity.deletedAt !== null && description.startsWith('[COMPLETED]');
      const isDeclined = activity.deletedAt !== null && !isCompleted;

      // Verificar se location contém uma URL válida (link do meet)
      const isUrl = (str: string | null | undefined): boolean => {
        if (!str) return false;
        return (
          str.startsWith('http://') ||
          str.startsWith('https://') ||
          str.startsWith('www.') ||
          str.startsWith('meet.google')
        );
      };

      const meetUrl = activity.location && isUrl(activity.location) ? activity.location : undefined;
      const providerName =
        activity.location?.includes('Meet') && !isUrl(activity.location)
          ? activity.location.replace('Meet with ', '')
          : undefined;

      return {
        id: activity.id,
        type: activity.type === 'task' ? 'personal' : activity.type === 'event' ? 'appointment' : 'program',
        title: activity.name,
        description: description.replace(/^\[COMPLETED\]/, ''), // Remover marcador da descrição exibida
        dateTime,
        providerName,
        providerAvatar: providerName ? providerName.charAt(0) : undefined,
        completed: activity.deletedAt !== null,
        declined: isDeclined,
        isFavorite: false,
        meetUrl,
      };
    },
    [formatDate],
  );

  /**
   * Carrega activities do backend
   */
  const loadActivities = useCallback(
    async (includeDeleted: boolean = defaultIncludeDeleted) => {
      if (!enabled) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await activityService.listActivities({
          page: 1,
          limit: 100,
          includeDeleted,
        });

        // TypeScript workaround: response pode ter estrutura variável
        const responseTyped = response as any;
        const isSuccess = responseTyped.success === true;
        const responseData = responseTyped.data;
        const activitiesList = responseData?.activities || [];

        if (isSuccess && activitiesList.length > 0) {
          // Armazenar dados originais
          setRawActivities(activitiesList);

          // Converter UserActivity para ActivityItem
          const convertedActivities: ActivityItem[] = activitiesList.map(convertActivityToItem);
          setActivities(convertedActivities);

          logger.debug('Activities loaded:', {
            count: convertedActivities.length,
            includeDeleted,
          });
        } else {
          setActivities([]);
          setRawActivities([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atividades';
        setError(errorMessage);
        setActivities([]);
        setRawActivities([]);
        logger.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    },
    [enabled, defaultIncludeDeleted, convertActivityToItem],
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
