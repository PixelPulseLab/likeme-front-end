import { useState, useEffect, useCallback, useRef } from 'react';
import { communityService } from '@/services';
import type { Community } from '@/types/community';
import { logger } from '@/utils/logger';

export type UseCommunityOptions = {
  communityId: string | undefined;
};

export type UseCommunityReturn = {
  community: Community | null;
  loading: boolean;
  error: string | null;
  termsAccepted: boolean | null;
  toggleTermsAccepted: () => void;
};

export function useCommunity({ communityId }: UseCommunityOptions): UseCommunityReturn {
  const trimmedCommunityId = communityId?.trim() || undefined;
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(Boolean(trimmedCommunityId));
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const latestCommunityIdRef = useRef(trimmedCommunityId);
  latestCommunityIdRef.current = trimmedCommunityId;

  useEffect(() => {
    if (!trimmedCommunityId) {
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
        logger.warn('[useCommunity] falha ao carregar comunidade', {
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
  }, [trimmedCommunityId]);

  useEffect(() => {
    if (!trimmedCommunityId) {
      setTermsAccepted(null);
      return;
    }
    setTermsAccepted(null);
    let cancelled = false;
    void (async () => {
      try {
        const accepted = await communityService.getMyCommunityTermsAccepted(trimmedCommunityId);
        if (cancelled) return;
        setTermsAccepted(accepted);
      } catch (error) {
        logger.error('Falha ao carregar aceite dos termos da comunidade', {
          communityId: trimmedCommunityId,
          cause: error,
        });
        if (!cancelled) {
          setTermsAccepted(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trimmedCommunityId]);

  const toggleTermsAccepted = useCallback(() => {
    if (!trimmedCommunityId) return;
    const targetCommunityId = trimmedCommunityId;
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
  }, [trimmedCommunityId]);

  return { community, loading, error, termsAccepted, toggleTermsAccepted };
}
