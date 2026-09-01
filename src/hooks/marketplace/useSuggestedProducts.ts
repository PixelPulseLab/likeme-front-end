import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { productService } from '@/services';
import type { Product as CarouselProduct } from '@/components/sections/product';
import type { Product as ApiProduct } from '@/types/product';
import { useCategories } from '@/hooks/category/useCategories';
import { logger } from '@/utils/logger';
import { buildMarketplaceCategoryBadgeLabels } from '@/utils/marketplace/buildMarketplaceCategoryBadgeLabels';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import {
  deleteInflightSuggestedProducts,
  getCachedSuggestedProducts,
  getInflightSuggestedProducts,
  setCachedSuggestedProducts,
  setInflightSuggestedProducts,
  suggestedProductsCacheKey,
  type SuggestedProductsCacheQuery,
} from '@/services/product/suggestedProductsCache';

export const SUGGESTED_PRODUCTS_HOME_ACTIVITIES_DEFAULTS = {
  limit: 4,
  status: 'active' as const,
};

const SUGGESTED_PRODUCT_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';

function mapApiProductToCarouselProduct(product: ApiProduct, tags: string[]): CarouselProduct {
  const categoryLabel = tags[0] ?? '';
  return {
    id: product.id,
    title: product.name,
    price: product.price ?? null,
    tag: categoryLabel,
    tags,
    image: product.image || SUGGESTED_PRODUCT_PLACEHOLDER_IMAGE,
    likes: 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

interface UseSuggestedProductsOptions {
  limit?: number;
  status?: 'active' | 'inactive';
  enabled?: boolean;
  categoryId?: string | null;
  type?: string;
  excludeProductId?: string;
  fillWithOtherCategories?: boolean;
}

interface UseSuggestedProductsReturn {
  products: CarouselProduct[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

type SuggestedProductsQuery = SuggestedProductsCacheQuery & {
  status: 'active' | 'inactive';
};

async function fetchSuggestedProductList(
  query: SuggestedProductsQuery,
  options: { bypassCache?: boolean } = {},
): Promise<ApiProduct[]> {
  const key = suggestedProductsCacheKey(query);

  if (!options.bypassCache) {
    const cached = getCachedSuggestedProducts(key);
    if (cached) {
      return cached;
    }
    const pending = getInflightSuggestedProducts(key);
    if (pending) {
      return pending;
    }
  }

  const request = (async () => {
    const productsResponse = await productService.listProducts({
      limit: query.limit,
      status: query.status,
      ...(query.categoryId != null && query.categoryId !== '' ? { categoryId: query.categoryId } : {}),
      ...(query.type != null && query.type !== '' ? { type: query.type } : {}),
      ...(query.excludeProductId ? { excludeProductId: query.excludeProductId } : {}),
      ...(query.fillWithOtherCategories !== undefined
        ? { fillWithOtherCategories: query.fillWithOtherCategories }
        : {}),
    });

    if (productsResponse.success && productsResponse.data) {
      return productsResponse.data.products.slice(0, query.limit);
    }
    return [];
  })();

  setInflightSuggestedProducts(key, request);
  try {
    const products = await request;
    setCachedSuggestedProducts(key, products);
    return products;
  } finally {
    deleteInflightSuggestedProducts(key);
  }
}

export const useSuggestedProducts = (options: UseSuggestedProductsOptions = {}): UseSuggestedProductsReturn => {
  const {
    limit = 4,
    status = 'active',
    enabled = true,
    categoryId,
    type,
    excludeProductId,
    fillWithOtherCategories,
  } = options;
  const { categories } = useCategories({ enabled });
  const query = useMemo<SuggestedProductsQuery>(
    () => ({
      limit,
      status,
      categoryId,
      type,
      excludeProductId,
      fillWithOtherCategories,
    }),
    [limit, status, categoryId, type, excludeProductId, fillWithOtherCategories],
  );
  const cacheKey = suggestedProductsCacheKey(query);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>(() => getCachedSuggestedProducts(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => enabled && getCachedSuggestedProducts(cacheKey) == null);
  const [error, setError] = useState<Error | null>(null);
  const visibleCountRef = useRef(0);
  visibleCountRef.current = apiProducts.length;

  const products = useMemo<CarouselProduct[]>(
    () =>
      apiProducts.map((p) => {
        const tags = buildMarketplaceCategoryBadgeLabels(p, categories);
        return mapApiProductToCarouselProduct(p, tags);
      }),
    [apiProducts, categories],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const cached = getCachedSuggestedProducts(cacheKey);
    if (cached) {
      setApiProducts(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    if (visibleCountRef.current === 0) {
      setLoading(true);
    }
    setError(null);

    void fetchSuggestedProductList(query)
      .then((nextProducts) => {
        if (!cancelled) {
          setApiProducts(nextProducts);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        logger.error('[useSuggestedProducts] Erro ao carregar produtos sugeridos', err);
        setError(err instanceof Error ? err : new Error('Failed to load suggested products'));
        if (visibleCountRef.current === 0) {
          setApiProducts([]);
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
  }, [enabled, cacheKey, query]);

  useEffect(() => {
    void prefetchImageUris(products.map((p) => p.image));
  }, [products]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    if (visibleCountRef.current === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const nextProducts = await fetchSuggestedProductList(query, { bypassCache: true });
      setApiProducts(nextProducts);
    } catch (err) {
      logger.error('[useSuggestedProducts] Erro ao carregar produtos sugeridos', err);
      setError(err instanceof Error ? err : new Error('Failed to load suggested products'));
      if (visibleCountRef.current === 0) {
        setApiProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, query]);

  return {
    products,
    loading,
    error,
    refresh,
  };
};
