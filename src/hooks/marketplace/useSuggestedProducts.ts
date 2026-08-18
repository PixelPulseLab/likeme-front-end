import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product as CarouselProduct } from '@/components/sections/product';
import type { Product as ApiProduct } from '@/types/product';
import { useCategories } from '@/hooks/category/useCategories';
import { logger } from '@/utils/logger';
import { buildMarketplaceCategoryBadgeLabels } from '@/utils/marketplace/buildMarketplaceCategoryBadgeLabels';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import {
  fetchSuggestedProducts,
  readCachedSuggestedProducts,
  shouldSkipSuggestedProductsFetch,
  suggestedProductsCacheKey,
  type SuggestedProductsCacheQuery,
} from '@/utils/marketplace/suggestedProductsCache';

/** Lista padrão de produtos sugeridos (Home Summary, Activities, Comunidade sem filtro extra). */
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

function sameSuggestedProductLists(left: ApiProduct[], right: ApiProduct[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (item, index) =>
      item.id === right[index]?.id && item.updatedAt === right[index]?.updatedAt && item.name === right[index]?.name,
  );
}

interface UseSuggestedProductsOptions {
  limit?: number;
  status?: 'active' | 'inactive';
  enabled?: boolean;
  categoryId?: string | null; // domain category filter (Estresse, Sono, etc.)
  /** Filtro por `Product.type` (catálogo ou ex.: `service`). */
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

  const query = useMemo<SuggestedProductsCacheQuery>(
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
  const queryKey = suggestedProductsCacheKey(query);

  const initialCached = enabled ? readCachedSuggestedProducts(query) : null;
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>(() => initialCached ?? []);
  const [loading, setLoading] = useState(() => enabled && initialCached == null);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(
    async (loadOptions?: { silent?: boolean; skipCache?: boolean }) => {
      if (!enabled) {
        return;
      }

      const cachedList = loadOptions?.skipCache ? null : readCachedSuggestedProducts(query);
      let hasDisplayedData = false;

      setApiProducts((current) => {
        hasDisplayedData = current.length > 0;
        if (cachedList && !sameSuggestedProductLists(current, cachedList)) {
          return cachedList;
        }
        return current;
      });

      const hasCachedData = cachedList != null;
      const silent = loadOptions?.silent === true || hasCachedData || hasDisplayedData;

      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        if (silent && !loadOptions?.skipCache && shouldSkipSuggestedProductsFetch(query)) {
          setLoading(false);
          return;
        }

        const products = await fetchSuggestedProducts(query);
        setApiProducts((current) => (sameSuggestedProductLists(current, products) ? current : products));
      } catch (err) {
        logger.error('[useSuggestedProducts] Erro ao carregar produtos sugeridos', err);
        setError(err instanceof Error ? err : new Error('Failed to load suggested products'));
        if (!hasCachedData && !hasDisplayedData) {
          setApiProducts([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [enabled, query],
  );

  /**
   * Tags vêm de `categoryNames` na resposta da API (join no banco).
   * Mantemos o mapping em `useMemo` para que a chegada tardia de `categories` não
   * dispare um segundo fetch — antes ela estava nas deps de `loadProducts`.
   */
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
      setApiProducts([]);
      setLoading(false);
      return;
    }

    const cached = readCachedSuggestedProducts(query);
    setApiProducts(cached ?? []);
    setLoading(cached == null);
  }, [enabled, query, queryKey]);

  useEffect(() => {
    void loadProducts({ silent: true });
  }, [loadProducts]);

  useEffect(() => {
    void prefetchImageUris(products.map((p) => p.image));
  }, [products]);

  return {
    products,
    loading,
    error,
    refresh: () => loadProducts({ skipCache: true }),
  };
};
