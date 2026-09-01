import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { advertiserService } from '@/services';
import { advertisersListCacheKey } from '@/utils/marketplace/advertisersCacheKey';
import {
  deleteInflightAdvertisersList,
  getCachedAdvertisersList,
  getInflightAdvertisersList,
  setCachedAdvertisersList,
  setInflightAdvertisersList,
} from '@/services/advertiser/advertisersListCache';
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

type AdvertisersListQuery = {
  communityId?: string;
  fetchAllPages: boolean;
  page: number;
  limit: number;
  status: AdvertiserStatus;
  type?: AdvertiserType;
  search: string;
  categoryId: string;
};

async function requestAdvertisersPage(query: AdvertisersListQuery, page: number): Promise<Advertiser[]> {
  const response = await advertiserService.getAdvertisers({
    page,
    limit: query.limit,
    status: query.status,
    communityId: query.communityId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.search ? { search: query.search } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
  });
  if (!response.success) {
    return [];
  }
  return response.data?.advertisers ?? [];
}

async function fetchAdvertisersList(
  query: AdvertisersListQuery,
  options: { bypassCache?: boolean } = {},
): Promise<Advertiser[]> {
  const key = advertisersListCacheKey(query);

  if (!options.bypassCache) {
    const cached = getCachedAdvertisersList(key);
    if (cached) {
      return cached;
    }
    const pending = getInflightAdvertisersList(key);
    if (pending) {
      return pending;
    }
  }

  const request = (async () => {
    if (!query.fetchAllPages) {
      return requestAdvertisersPage(query, query.page);
    }

    const firstResponse = await advertiserService.getAdvertisers({
      page: 1,
      limit: query.limit,
      status: query.status,
      communityId: query.communityId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { search: query.search } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    });
    if (!firstResponse.success || !firstResponse.data) {
      return [];
    }

    const merged: Advertiser[] = [...(firstResponse.data.advertisers ?? [])];
    const seenIds = new Set(merged.map((advertiser) => advertiser.id).filter(Boolean));
    const totalPages = firstResponse.data.pagination?.totalPages ?? 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const next = await advertiserService.getAdvertisers({
        page,
        limit: query.limit,
        status: query.status,
        communityId: query.communityId,
        ...(query.type ? { type: query.type } : {}),
        ...(query.search ? { search: query.search } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      });
      if (!next.success || !next.data) {
        break;
      }
      for (const advertiser of next.data.advertisers ?? []) {
        if (!advertiser.id || seenIds.has(advertiser.id)) {
          continue;
        }
        seenIds.add(advertiser.id);
        merged.push(advertiser);
      }
    }

    return merged;
  })();

  setInflightAdvertisersList(key, request);
  try {
    const advertisers = await request;
    setCachedAdvertisersList(key, advertisers);
    return advertisers;
  } finally {
    deleteInflightAdvertisersList(key);
  }
}

export const useAdvertisers = (params: UseAdvertisersParams = {}): UseAdvertisersReturn => {
  const { advertiserId, communityId, listOptions, fetchAllPages = false, enabled = true } = params;
  const hasListOptions = listOptions != null;
  const shouldLoadList = hasListOptions || (!advertiserId && !!communityId);
  const query = useMemo<AdvertisersListQuery>(
    () => ({
      communityId,
      fetchAllPages,
      page: listOptions?.page ?? 1,
      limit: listOptions?.limit ?? 50,
      status: listOptions?.status ?? ADVERTISER_STATUS.ACTIVE,
      type: listOptions?.type,
      search: listOptions?.search?.trim() ?? '',
      categoryId: listOptions?.categoryId?.trim() ?? '',
    }),
    [
      communityId,
      fetchAllPages,
      listOptions?.page,
      listOptions?.limit,
      listOptions?.status,
      listOptions?.type,
      listOptions?.search,
      listOptions?.categoryId,
    ],
  );
  const listCacheKey = shouldLoadList ? advertisersListCacheKey(query) : null;
  const [advertisers, setAdvertisers] = useState<Advertiser[]>(() =>
    listCacheKey != null ? getCachedAdvertisersList(listCacheKey) ?? [] : [],
  );
  const [loading, setLoading] = useState(
    () => enabled && listCacheKey != null && getCachedAdvertisersList(listCacheKey) == null,
  );
  const [error, setError] = useState<Error | null>(null);
  const visibleCountRef = useRef(0);
  visibleCountRef.current = advertisers.length;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (listCacheKey != null) {
      const cached = getCachedAdvertisersList(listCacheKey);
      if (cached) {
        setAdvertisers(cached);
        setLoading(false);
        setError(null);
        void prefetchImageUris(cached.slice(0, ADVERTISERS_PREFETCH_FIRST_N).map((item) => item.logo));
        return;
      }

      let cancelled = false;
      if (visibleCountRef.current === 0) {
        setLoading(true);
      }
      setError(null);

      void fetchAdvertisersList(query)
        .then((nextAdvertisers) => {
          if (cancelled) {
            return;
          }
          setAdvertisers(nextAdvertisers);
          void prefetchImageUris(nextAdvertisers.slice(0, ADVERTISERS_PREFETCH_FIRST_N).map((item) => item.logo));
        })
        .catch((err) => {
          if (cancelled) {
            return;
          }
          logger.error('Error loading advertisers list:', err);
          setError(err instanceof Error ? err : new Error('Failed to load advertisers'));
          if (visibleCountRef.current === 0) {
            setAdvertisers([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    if (!advertiserId) {
      setAdvertisers([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    if (visibleCountRef.current === 0) {
      setLoading(true);
    }
    setError(null);

    void advertiserService
      .getAdvertiserById(advertiserId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.success && response.data) {
          const next = [response.data];
          setAdvertisers(communityId ? next.filter((item) => item.communityId === communityId) : next);
        } else if (visibleCountRef.current === 0) {
          setAdvertisers([]);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        logger.error('Error loading advertiser:', err);
        setError(err instanceof Error ? err : new Error('Failed to load advertiser'));
        if (visibleCountRef.current === 0) {
          setAdvertisers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [advertiserId, communityId, enabled, listCacheKey, query]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    if (visibleCountRef.current === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      if (listCacheKey != null) {
        const nextAdvertisers = await fetchAdvertisersList(query, { bypassCache: true });
        setAdvertisers(nextAdvertisers);
        void prefetchImageUris(nextAdvertisers.slice(0, ADVERTISERS_PREFETCH_FIRST_N).map((item) => item.logo));
        return;
      }
      if (!advertiserId) {
        setAdvertisers([]);
        return;
      }
      const response = await advertiserService.getAdvertiserById(advertiserId);
      if (response.success && response.data) {
        const next = [response.data];
        setAdvertisers(communityId ? next.filter((item) => item.communityId === communityId) : next);
      } else if (visibleCountRef.current === 0) {
        setAdvertisers([]);
      }
    } catch (err) {
      logger.error(listCacheKey != null ? 'Error loading advertisers list:' : 'Error loading advertiser:', err);
      setError(
        err instanceof Error
          ? err
          : new Error(listCacheKey != null ? 'Failed to load advertisers' : 'Failed to load advertiser'),
      );
      if (visibleCountRef.current === 0) {
        setAdvertisers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [advertiserId, communityId, enabled, listCacheKey, query]);

  return {
    advertisers,
    loading,
    error,
    refresh,
  };
};
