import { useState, useEffect, useCallback, useRef } from 'react';
import { communityService } from '@/services';
import type { Community } from '@/types/community';
import { logger } from '@/utils/logger';

export type UseCommunityOptions = {
  communityId: string | undefined;
};

export type UseCommunityReturn = {
  termsAccepted: boolean | null;
  toggleTermsAccepted: () => void;
};

export type UseCommunityByIdOptions = {
  communityId: string | undefined;
  enabled?: boolean;
};

export type UseCommunityByIdReturn = {
  community: Community | null;
  loading: boolean;
  error: string | null;
};

function useCommunityHook({ communityId }: UseCommunityOptions): UseCommunityReturn {
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const latestCommunityIdRef = useRef(communityId);
  latestCommunityIdRef.current = communityId;

  useEffect(() => {
    if (!communityId) {
      setTermsAccepted(null);
      return;
    }
    setTermsAccepted(null);
    let cancelled = false;
    void (async () => {
      try {
        const accepted = await communityService.getMyCommunityTermsAccepted(communityId);
        if (cancelled) return;
        setTermsAccepted(accepted);
      } catch (error) {
        logger.error('Falha ao carregar aceite dos termos da comunidade', { communityId, cause: error });
        if (!cancelled) {
          setTermsAccepted(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const toggleTermsAccepted = useCallback(() => {
    if (!communityId) return;
    const targetCommunityId = communityId;
    setTermsAccepted((prev) => {
      if (prev === null) return prev;
      const next = !prev;
      void communityService
        .updateMyCommunityTermsAccepted(targetCommunityId, next)
        .then((acceptedFromServer) => {
          if (latestCommunityIdRef.current !== targetCommunityId) return;
          setTermsAccepted(acceptedFromServer);
        })
        .catch((error) => {
          setTermsAccepted(prev);
          logger.error('Falha ao persistir aceite dos termos da comunidade', {
            communityId: targetCommunityId,
            attemptedValue: next,
            cause: error,
          });
        });
      return next;
    });
  }, [communityId]);

  return { termsAccepted, toggleTermsAccepted };
}

function useCommunityById({ communityId, enabled = true }: UseCommunityByIdOptions): UseCommunityByIdReturn {
  const trimmedCommunityId = communityId?.trim() || undefined;
  const shouldFetch = enabled && Boolean(trimmedCommunityId);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(null);
  const latestCommunityIdRef = useRef(trimmedCommunityId);
  latestCommunityIdRef.current = trimmedCommunityId;

  useEffect(() => {
    if (!shouldFetch || !trimmedCommunityId) {
      setCommunity(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const fetchedCommunity = await communityService.getCommunity(trimmedCommunityId);
        if (cancelled || latestCommunityIdRef.current !== trimmedCommunityId) {
          return;
        }
        setCommunity(fetchedCommunity);
      } catch (cause) {
        if (cancelled || latestCommunityIdRef.current !== trimmedCommunityId) {
          return;
        }
        logger.warn('[useCommunity.byId] falha ao carregar comunidade', {
          communityId: trimmedCommunityId,
          cause,
        });
        setCommunity(null);
        setError(cause instanceof Error ? cause.message : 'Comunidade não encontrada');
      } finally {
        if (!cancelled && latestCommunityIdRef.current === trimmedCommunityId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, trimmedCommunityId]);

  return { community, loading, error };
}

type UseCommunityFn = typeof useCommunityHook & {
  byId: typeof useCommunityById;
};

export const useCommunity: UseCommunityFn = Object.assign(useCommunityHook, {
  byId: useCommunityById,
});
