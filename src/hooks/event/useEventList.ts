import { useCallback, useEffect, useState } from 'react';
import { eventService } from '@/services';
import type { EventBannerFromApi, Event } from '@/types/event';
import { getReadableErrorMessage } from '@/utils/error/readableErrorMessage';

export interface UseEventListOptions {
  enabled?: boolean;
  communityId?: string;
}

export interface UseEventListReturn {
  events: Event[];
  banner: EventBannerFromApi | null;
  programProductId: string | null;
  hasProgramAccess: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useEventList = (options: UseEventListOptions = {}): UseEventListReturn => {
  const { enabled = true, communityId } = options;
  const [events, setEvents] = useState<Event[]>([]);
  const [banner, setBanner] = useState<EventBannerFromApi | null>(null);
  const [programProductId, setProgramProductId] = useState<string | null>(null);
  const [hasProgramAccess, setHasProgramAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setEvents([]);
      setBanner(null);
      setProgramProductId(null);
      setHasProgramAccess(false);
      return;
    }
    if (!communityId?.trim()) {
      setEvents([]);
      setBanner(null);
      setProgramProductId(null);
      setHasProgramAccess(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await eventService.listEvents(communityId);
      const isSuccess = response.success === true || response.status === 'success';
      if (!isSuccess) {
        throw new Error(response.message || 'Erro ao carregar eventos');
      }
      const nextEvents = Array.isArray(response.data?.events) ? response.data!.events! : [];
      setProgramProductId(
        typeof response.data?.programProductId === 'string' && response.data.programProductId.trim().length > 0
          ? response.data.programProductId.trim()
          : null,
      );
      setHasProgramAccess(response.data?.hasProgramAccess === true);
      setBanner(response.data?.banner ?? null);
      setEvents(nextEvents);
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Erro ao carregar eventos'));
      setEvents([]);
      setBanner(null);
      setProgramProductId(null);
      setHasProgramAccess(false);
    } finally {
      setLoading(false);
    }
  }, [communityId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { events, banner, programProductId, hasProgramAccess, loading, error, refresh };
};
