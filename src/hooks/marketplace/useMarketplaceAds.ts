import { useState, useCallback, useEffect, useRef } from 'react';
import { adService } from '@/services';
import {
  isMarketplaceListingsCacheEntryFresh,
  useMarketplaceListingsCache,
} from '@/contexts/MarketplaceListingsCacheContext';
import { mapUICategoryToApiCategory } from '@/utils';
import { marketplaceAdsCacheKey } from '@/utils/marketplace/marketplaceListingsCacheKey';
import { appendUniqueAdsById, uniqueAdsById } from '@/utils/marketplace/uniqueAdsById';
import { logger } from '@/utils/logger';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import type { Ad, ListAdsParams } from '@/types/ad';

const MARKETPLACE_ADS_PREFETCH_FIRST_N = 6;
const LIST_LIMIT = 20;

interface UseMarketplaceAdsParams {
  selectedCategory?: string;
  selectedCategoryId?: string | null;
  page: number;
  searchQuery?: string;
  enabled?: boolean;
}

interface UseMarketplaceAdsReturn {
  ads: Ad[];
  loading: boolean;
  hasMore: boolean;
  loadAds: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useMarketplaceAds = ({
  selectedCategory,
  selectedCategoryId,
  page,
  searchQuery,
  enabled = true,
}: UseMarketplaceAdsParams): UseMarketplaceAdsReturn => {
  const listingsCache = useMarketplaceListingsCache();
  const cacheKey = marketplaceAdsCacheKey(searchQuery, { selectedCategory, selectedCategoryId });
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
    setAds([]);
    setHasMore(true);
    setLoading(true);
  }, [cacheKey, enabled, listingsCache]);

  const buildParams = useCallback((): ListAdsParams => {
    const params: ListAdsParams = {
      page,
      limit: LIST_LIMIT,
      activeOnly: true,
    };

    if (selectedCategoryId != null && selectedCategoryId !== '') {
      params.categoryId = selectedCategoryId;
    }

    const trimmedSearch = searchQuery?.trim();
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }
    const apiCategory = mapUICategoryToApiCategory(selectedCategory);
    if (apiCategory) {
      params.type = apiCategory;
    }

    return params;
  }, [selectedCategory, selectedCategoryId, page, searchQuery]);

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

        const params = { ...buildParams(), page: requestPage };
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
        void prefetchImageUris(adsArray.slice(0, MARKETPLACE_ADS_PREFETCH_FIRST_N).map((ad) => ad.product?.image));

        const nextAds = requestPage === 1 ? uniqueAdsById(adsArray) : appendUniqueAdsById(adsRef.current, adsArray);
        setAds(nextAds);

        let nextHasMore = false;
        const pagination = response.data.pagination;
        if (pagination) {
          nextHasMore = pagination.page < pagination.totalPages;
        } else {
          nextHasMore = adsArray.length >= LIST_LIMIT;
        }
        setHasMore(nextHasMore);
        persistCache(nextAds, nextHasMore);
      } catch (error) {
        logger.error('useMarketplaceAds: falha ao listar anúncios', {
          error,
          page: requestPage,
          search: searchQuery,
          categoryId: selectedCategoryId,
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
    [buildParams, cacheKey, enabled, listingsCache, persistCache, searchQuery, selectedCategory, selectedCategoryId],
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
