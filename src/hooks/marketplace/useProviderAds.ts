import { useState, useCallback, useEffect, useRef } from 'react';
import {
  isMarketplaceListingsCacheEntryFresh,
  useMarketplaceListingsCache,
} from '@/contexts/MarketplaceListingsCacheContext';
import { adService } from '@/services';
import { mapUICategoryToApiCategory } from '@/utils';
import { providerAdsCacheKey } from '@/utils/marketplace/marketplaceListingsCacheKey';
import { logger } from '@/utils/logger';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import type { Ad, ListAdsParams } from '@/types/ad';

const PROVIDER_ADS_PREFETCH_FIRST_N = 6;

interface UseProviderAdsParams {
  advertiserId: string | undefined;
  page?: number;
  limit?: number;
  /** products | services | programs — mesmo mapeamento do marketplace */
  selectedCategory?: string;
  enabled?: boolean;
}

interface UseProviderAdsReturn {
  ads: Ad[];
  loading: boolean;
  hasMore: boolean;
  loadAds: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useProviderAds = ({
  advertiserId,
  page = 1,
  limit = 20,
  selectedCategory,
  enabled = true,
}: UseProviderAdsParams): UseProviderAdsReturn => {
  const listingsCache = useMarketplaceListingsCache();
  const cacheKey = providerAdsCacheKey(advertiserId, selectedCategory);
  const initialCacheEntry = listingsCache.read(cacheKey);
  const initialCacheIsFresh = initialCacheEntry != null && isMarketplaceListingsCacheEntryFresh(initialCacheEntry);

  const [ads, setAds] = useState<Ad[]>(() => (initialCacheIsFresh ? initialCacheEntry.ads : []));
  const [loading, setLoading] = useState(() => enabled && !initialCacheIsFresh);
  const [hasMore, setHasMore] = useState(() => (initialCacheIsFresh ? initialCacheEntry.hasMore : true));

  const adsRef = useRef(ads);
  adsRef.current = ads;
  const backgroundRefreshStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    backgroundRefreshStartedRef.current = false;
    if (!enabled) {
      return;
    }
    const entry = listingsCache.read(cacheKey);
    const fresh = entry != null && isMarketplaceListingsCacheEntryFresh(entry);
    if (fresh) {
      setAds(entry.ads);
      setHasMore(entry.hasMore);
      setLoading(false);
      return;
    }
    if (!advertiserId) {
      setAds([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setAds([]);
    setHasMore(true);
    setLoading(true);
  }, [advertiserId, cacheKey, enabled, listingsCache]);

  const persistCache = useCallback(
    (nextAds: Ad[], nextHasMore: boolean) => {
      listingsCache.write(cacheKey, {
        ads: nextAds,
        hasMore: nextHasMore,
        fetchedAt: Date.now(),
      });
    },
    [listingsCache, cacheKey],
  );

  const loadAdsAtPage = useCallback(
    async (requestPage: number) => {
      if (!enabled) {
        return;
      }

      if (!advertiserId) {
        setAds([]);
        setHasMore(false);
        return;
      }

      const cachedEntry = listingsCache.read(cacheKey);
      const cachedFresh = cachedEntry != null && isMarketplaceListingsCacheEntryFresh(cachedEntry);

      if (requestPage === 1 && cachedFresh) {
        const cachedAds = cachedEntry.ads;
        if (adsRef.current.length === 0 && cachedAds.length > 0) {
          setAds(cachedAds);
          setHasMore(cachedEntry.hasMore);
        }
        if (cachedAds.length > 0 || adsRef.current.length > 0) {
          setLoading(false);
          return;
        }
      }

      try {
        if (requestPage === 1 && adsRef.current.length > 0) {
          setLoading(false);
        } else {
          setLoading(true);
        }

        const params: ListAdsParams = {
          advertiserId,
          page: requestPage,
          limit,
          activeOnly: true,
        };
        const apiCategory = selectedCategory ? mapUICategoryToApiCategory(selectedCategory) : undefined;
        if (apiCategory) {
          params.type = apiCategory;
        }

        const response = await adService.listAds(params);

        if (!response.success || !response.data) {
          if (requestPage === 1) {
            setAds([]);
            persistCache([], false);
          }
          setHasMore(false);
          return;
        }

        const adsArray = response.data.ads || [];
        void prefetchImageUris(adsArray.slice(0, PROVIDER_ADS_PREFETCH_FIRST_N).map((ad) => ad.product?.image));

        const nextAds = requestPage === 1 ? adsArray : [...adsRef.current, ...adsArray];
        setAds(nextAds);

        let nextHasMore = false;
        const pagination = response.data.pagination;
        if (pagination) {
          nextHasMore = pagination.page < pagination.totalPages;
        } else {
          nextHasMore = adsArray.length >= limit;
        }
        setHasMore(nextHasMore);
        persistCache(nextAds, nextHasMore);
      } catch (error) {
        logger.error('useProviderAds: falha ao listar anúncios do provider', {
          error,
          advertiserId,
          page: requestPage,
          selectedCategory,
        });
        if (requestPage === 1) {
          setAds([]);
          persistCache([], false);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [advertiserId, cacheKey, enabled, limit, listingsCache, persistCache, selectedCategory],
  );

  const loadAds = useCallback(async () => {
    await loadAdsAtPage(page);
  }, [loadAdsAtPage, page]);

  const refresh = useCallback(async () => {
    listingsCache.invalidate(cacheKey);
    await loadAdsAtPage(1);
  }, [cacheKey, listingsCache, loadAdsAtPage]);

  useEffect(() => {
    if (!enabled || !initialCacheIsFresh || backgroundRefreshStartedRef.current) {
      return;
    }
    backgroundRefreshStartedRef.current = true;
    void loadAds();
  }, [enabled, initialCacheIsFresh, loadAds]);

  return {
    ads,
    loading,
    hasMore,
    loadAds,
    refresh,
  };
};
