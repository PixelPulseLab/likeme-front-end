import { useState, useEffect, useCallback, useRef } from 'react';
import { advertiserService } from '@/services';
import { isAdvertisersCacheEntryFresh, useAdvertisersCache } from '@/contexts/AdvertisersCacheContext';
import { advertisersListCacheKey } from '@/utils/marketplace/advertisersCacheKey';
import { logger } from '@/utils/logger';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import type { Advertiser } from '@/types/ad';
import { ADVERTISER_STATUS, type AdvertiserType } from '@/constants';

const ADVERTISERS_PREFETCH_FIRST_N = 8;

type AdvertiserStatus = (typeof ADVERTISER_STATUS)[keyof typeof ADVERTISER_STATUS];

export interface UseAdvertisersListOptions {
  page?: number;
  limit?: number;
  status?: AdvertiserStatus;
  type?: AdvertiserType;
  search?: string;
  categoryId?: string;
}

export interface UseAdvertisersParams {
  advertiserId?: string | null;
  communityId?: string;
  listOptions?: UseAdvertisersListOptions;
  fetchAllPages?: boolean;
  enabled?: boolean;
}

export interface UseAdvertisersReturn {
  advertisers: Advertiser[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useAdvertisers = (params: UseAdvertisersParams = {}): UseAdvertisersReturn => {
  const { advertiserId, communityId, listOptions, fetchAllPages = false, enabled = true } = params;
  const advertisersCache = useAdvertisersCache();
  const listCacheKey =
    listOptions != null || (!advertiserId && !!communityId)
      ? advertisersListCacheKey({
          communityId,
          fetchAllPages,
          page: listOptions?.page,
          limit: listOptions?.limit,
          status: listOptions?.status,
          type: listOptions?.type,
          search: listOptions?.search,
          categoryId: listOptions?.categoryId,
        })
      : null;

  const initialCacheEntry = listCacheKey != null ? advertisersCache.read(listCacheKey) : undefined;
  const initialCacheIsFresh = initialCacheEntry != null && isAdvertisersCacheEntryFresh(initialCacheEntry);

  const [advertisers, setAdvertisers] = useState<Advertiser[]>(() =>
    initialCacheIsFresh ? initialCacheEntry.advertisers : [],
  );
  const [loading, setLoading] = useState(() => enabled && listCacheKey != null && !initialCacheIsFresh);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);
  const requestIdRef = useRef(0);
  const advertisersRef = useRef(advertisers);
  advertisersRef.current = advertisers;

  const hasListOptions = listOptions != null;
  const shouldLoadList = hasListOptions || (!advertiserId && !!communityId);
  const page = listOptions?.page ?? 1;
  const limit = listOptions?.limit ?? 50;
  const status = listOptions?.status ?? ADVERTISER_STATUS.ACTIVE;
  const type = listOptions?.type;
  const search = listOptions?.search?.trim() ?? '';
  const categoryId = listOptions?.categoryId?.trim() ?? '';

  const persistListCache = useCallback(
    (list: Advertiser[]) => {
      if (listCacheKey == null) {
        return;
      }
      advertisersCache.write(listCacheKey, {
        advertisers: list,
        fetchedAt: Date.now(),
      });
    },
    [advertisersCache, listCacheKey],
  );

  const startRequest = useCallback((requestId: number, options?: { clear?: boolean }) => {
    if (options?.clear !== false) {
      setAdvertisers([]);
    }
    setLoading(true);
    setError(null);
    return requestId;
  }, []);

  const finishRequest = useCallback((requestId: number) => {
    if (!cancelledRef.current && requestId === requestIdRef.current) {
      setLoading(false);
    }
  }, []);

  const loadById = useCallback(async () => {
    if (!advertiserId) {
      return Promise.resolve();
    }
    const requestId = ++requestIdRef.current;
    startRequest(requestId);
    try {
      const response = await advertiserService.getAdvertiserById(advertiserId);
      if (cancelledRef.current || requestId !== requestIdRef.current) return;
      if (response.success && response.data) {
        const next = [response.data];
        setAdvertisers(communityId ? next.filter((item) => item.communityId === communityId) : next);
      } else {
        setAdvertisers([]);
      }
    } catch (err) {
      if (cancelledRef.current || requestId !== requestIdRef.current) return;
      logger.error('Error loading advertiser:', err);
      setError(err instanceof Error ? err : new Error('Failed to load advertiser'));
      setAdvertisers([]);
    } finally {
      finishRequest(requestId);
    }
  }, [advertiserId, communityId, finishRequest, startRequest]);

  const loadList = useCallback(
    async (options?: { skipCache?: boolean }) => {
      if (!enabled || !shouldLoadList || listCacheKey == null) {
        return Promise.resolve();
      }

      const cachedEntry = advertisersCache.read(listCacheKey);
      const cachedFresh = cachedEntry != null && isAdvertisersCacheEntryFresh(cachedEntry) && !options?.skipCache;

      if (cachedFresh) {
        const cachedList = cachedEntry.advertisers;
        if (advertisersRef.current.length === 0 && cachedList.length > 0) {
          setAdvertisers(cachedList);
        }
        if (cachedList.length > 0 || advertisersRef.current.length > 0) {
          setLoading(false);
          setError(null);
          return;
        }
      }

      const requestId = ++requestIdRef.current;
      startRequest(requestId, { clear: !cachedFresh });
      const baseQuery = {
        limit,
        status,
        communityId,
        ...(type ? { type } : {}),
        ...(search ? { search } : {}),
        ...(categoryId ? { categoryId } : {}),
      };
      try {
        if (!fetchAllPages) {
          const response = await advertiserService.getAdvertisers({
            page,
            ...baseQuery,
          });
          if (cancelledRef.current || requestId !== requestIdRef.current) return;
          const list = response.success ? response.data?.advertisers ?? [] : [];
          setAdvertisers(list);
          persistListCache(list);
          void prefetchImageUris(list.slice(0, ADVERTISERS_PREFETCH_FIRST_N).map((a) => a.logo));
          return;
        }

        const first = await advertiserService.getAdvertisers({
          page: 1,
          ...baseQuery,
        });
        if (cancelledRef.current || requestId !== requestIdRef.current) return;
        if (!first.success || !first.data) {
          setAdvertisers([]);
          persistListCache([]);
          return;
        }

        const merged: Advertiser[] = [...(first.data.advertisers ?? [])];
        const seenIds = new Set(merged.map((a) => a.id).filter(Boolean));
        const totalPages = first.data.pagination?.totalPages ?? 1;

        for (let p = 2; p <= totalPages; p += 1) {
          if (cancelledRef.current || requestId !== requestIdRef.current) return;
          const next = await advertiserService.getAdvertisers({
            page: p,
            ...baseQuery,
          });
          if (cancelledRef.current || requestId !== requestIdRef.current) return;
          if (!next.success || !next.data) {
            break;
          }
          for (const adv of next.data.advertisers ?? []) {
            if (!adv.id || seenIds.has(adv.id)) {
              continue;
            }
            seenIds.add(adv.id);
            merged.push(adv);
          }
        }

        setAdvertisers(merged);
        persistListCache(merged);
        void prefetchImageUris(merged.slice(0, ADVERTISERS_PREFETCH_FIRST_N).map((a) => a.logo));
      } catch (err) {
        if (cancelledRef.current || requestId !== requestIdRef.current) return;
        logger.error('Error loading advertisers list:', err);
        setError(err instanceof Error ? err : new Error('Failed to load advertisers'));
        setAdvertisers([]);
        persistListCache([]);
      } finally {
        finishRequest(requestId);
      }
    },
    [
      enabled,
      shouldLoadList,
      listCacheKey,
      advertisersCache,
      fetchAllPages,
      page,
      limit,
      status,
      type,
      communityId,
      search,
      categoryId,
      finishRequest,
      startRequest,
      persistListCache,
    ],
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (shouldLoadList) {
      return loadList({ skipCache: true });
    }
    return loadById();
  }, [shouldLoadList, loadList, loadById]);

  useEffect(() => {
    if (!enabled || listCacheKey == null) {
      return;
    }
    const entry = advertisersCache.read(listCacheKey);
    const fresh = entry != null && isAdvertisersCacheEntryFresh(entry);
    if (fresh) {
      setAdvertisers(entry.advertisers);
      setLoading(false);
      return;
    }
    if (!shouldLoadList) {
      return;
    }
    setAdvertisers([]);
    setLoading(true);
  }, [advertisersCache, enabled, listCacheKey, shouldLoadList]);

  useEffect(() => {
    cancelledRef.current = false;

    if (!enabled) {
      setLoading(false);
      return () => {
        cancelledRef.current = true;
      };
    }

    if (shouldLoadList) {
      void loadList();
    } else if (advertiserId) {
      void loadById();
    } else {
      setAdvertisers([]);
      setError(null);
      setLoading(false);
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [
    enabled,
    shouldLoadList,
    advertiserId,
    communityId,
    page,
    limit,
    status,
    type,
    search,
    categoryId,
    fetchAllPages,
    loadList,
    loadById,
  ]);

  return {
    advertisers,
    loading,
    error,
    refresh,
  };
};
