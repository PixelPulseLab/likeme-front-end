import { useState, useCallback, useEffect, useRef } from 'react';
import { productService } from '@/services';
import {
  isMarketplaceListingsCacheEntryFresh,
  useMarketplaceListingsCache,
} from '@/contexts/MarketplaceListingsCacheContext';
import { marketplaceProgramsCacheKey } from '@/utils/marketplace/marketplaceListingsCacheKey';
import { appendUniqueAdsById, uniqueAdsById } from '@/utils/marketplace/uniqueAdsById';
import { logger } from '@/utils/logger';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import type { Ad } from '@/types/ad';
import type { Product } from '@/types/product';
import { PRODUCT_CATALOG_TYPE } from '@/types/product';
const PRODUCTS_PREFETCH_FIRST_N = 6;

const adIsUsableForListing = (ad: Ad): boolean => {
  if (ad.status !== 'active') {
    return false;
  }
  const now = new Date();
  if (ad.startDate != null && ad.startDate !== '' && new Date(ad.startDate) > now) {
    return false;
  }
  if (ad.endDate != null && ad.endDate !== '' && new Date(ad.endDate) < now) {
    return false;
  }
  return true;
};

const LIST_LIMIT = 20;

interface UseProductsParams {
  categoryId?: string | null;
  page: number;
  searchQuery?: string;
  enabled?: boolean;
}

interface UseProductsReturn {
  ads: Ad[];
  loading: boolean;
  hasMore: boolean;
  loadProducts: () => Promise<void>;
}

const catalogProductToSyntheticAd = (product: Product): Ad => {
  const createdAt = product.createdAt ?? new Date().toISOString();
  const updatedAt = product.updatedAt ?? createdAt;
  const adStatus: Ad['status'] = product.status === 'inactive' ? 'inactive' : 'active';

  return {
    id: `catalog-program-${product.id}`,
    productId: product.id,
    advertiserId: product.advertiserId,
    status: adStatus,
    product,
    createdAt,
    updatedAt,
  };
};

const listingAdFromProduct = (product: Product): Ad => {
  const embedded = product.ads ?? [];
  const picked = embedded.find(adIsUsableForListing) ?? embedded.find((a) => a.status === 'active') ?? embedded[0];

  if (picked != null) {
    const isFeatured = picked.isFeatured === true || product.isFeatured === true;
    return {
      ...picked,
      productId: picked.productId ?? product.id,
      product: picked.product ?? product,
      ...(isFeatured ? { isFeatured: true as const } : {}),
    };
  }

  return catalogProductToSyntheticAd(product);
};

export const useProducts = ({
  categoryId,
  page,
  searchQuery,
  enabled = true,
}: UseProductsParams): UseProductsReturn => {
  const listingsCache = useMarketplaceListingsCache();
  const cacheKey = marketplaceProgramsCacheKey(searchQuery, { categoryId });
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

  const persistCache = useCallback(
    (nextAds: Ad[], nextHasMore: boolean, cacheGeneration: number) => {
      listingsCache.writeIfFresh(
        cacheKey,
        {
          ads: nextAds,
          hasMore: nextHasMore,
          fetchedAt: Date.now(),
        },
        cacheGeneration,
      );
    },
    [listingsCache, cacheKey],
  );

  const loadProducts = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const cachedEntry = listingsCache.read(cacheKey);
    const cachedFresh = cachedEntry != null && isMarketplaceListingsCacheEntryFresh(cachedEntry);

    if (page === 1 && cachedFresh) {
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

    const cacheGeneration = listingsCache.generation();

    try {
      if (page === 1 && adsRef.current.length > 0) {
        setLoading(false);
      } else {
        setLoading(true);
      }

      const trimmedSearch = searchQuery?.trim();
      const response = await productService.listProducts({
        page,
        limit: LIST_LIMIT,
        status: 'active',
        type: PRODUCT_CATALOG_TYPE.PROGRAM,
        ...(categoryId != null && categoryId !== '' ? { categoryId } : {}),
        ...(trimmedSearch ? { search: trimmedSearch } : {}),
      });

      if (!response.success || !response.data) {
        if (page === 1) {
          setAds([]);
          persistCache([], false, cacheGeneration);
        }
        setHasMore(false);
        return;
      }

      const rows = (response.data.products ?? []).map(listingAdFromProduct);

      void prefetchImageUris(rows.slice(0, PRODUCTS_PREFETCH_FIRST_N).map((ad) => ad.product?.image));

      const nextAds = page === 1 ? uniqueAdsById(rows) : appendUniqueAdsById(adsRef.current, rows);
      setAds(nextAds);

      const pag = response.data.pagination;
      let nextHasMore = false;
      if (pag) {
        nextHasMore = pag.page < pag.totalPages;
      } else {
        nextHasMore = rows.length >= LIST_LIMIT;
      }
      setHasMore(nextHasMore);
      persistCache(nextAds, nextHasMore, cacheGeneration);
    } catch (error) {
      logger.error('useProducts: falha ao listar programas', {
        error,
        page,
        search: searchQuery,
        categoryId,
      });
      if (page === 1) {
        setAds([]);
        persistCache([], false, cacheGeneration);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, categoryId, enabled, listingsCache, page, persistCache, searchQuery]);

  useEffect(() => {
    if (!enabled || !initialCacheIsFresh || backgroundRefreshStartedRef.current) {
      return;
    }
    backgroundRefreshStartedRef.current = true;
    void loadProducts();
  }, [enabled, initialCacheIsFresh, loadProducts]);

  return {
    ads,
    loading,
    hasMore,
    loadProducts,
  };
};
