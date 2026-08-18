import { productService } from '@/services';
import type { ListProductsParams, Product as ApiProduct } from '@/types/product';

const CACHE_MAX_AGE_MS = 120_000;
const CACHE_FRESH_SKIP_MS = 5_000;

export type SuggestedProductsCacheQuery = {
  limit: number;
  status: 'active' | 'inactive';
  categoryId?: string | null;
  type?: string;
  excludeProductId?: string;
  fillWithOtherCategories?: boolean;
};

type SuggestedProductsCacheEntry = {
  products: ApiProduct[];
  fetchedAt: number;
};

const caches = new Map<string, SuggestedProductsCacheEntry>();
let inflightKey: string | null = null;
let inflightPromise: Promise<ApiProduct[]> | null = null;

export function suggestedProductsCacheKey(query: SuggestedProductsCacheQuery): string {
  return [
    'suggested-products',
    String(query.limit),
    query.status,
    query.categoryId ?? '',
    query.type ?? '',
    query.excludeProductId ?? '',
    query.fillWithOtherCategories == null ? '' : String(query.fillWithOtherCategories),
  ].join('::');
}

export function readCachedSuggestedProducts(query: SuggestedProductsCacheQuery): ApiProduct[] | null {
  const key = suggestedProductsCacheKey(query);
  const cache = caches.get(key);
  if (!cache) {
    return null;
  }
  if (Date.now() - cache.fetchedAt > CACHE_MAX_AGE_MS) {
    return null;
  }
  return cache.products;
}

export function writeSuggestedProductsCache(query: SuggestedProductsCacheQuery, products: ApiProduct[]): void {
  caches.set(suggestedProductsCacheKey(query), {
    products,
    fetchedAt: Date.now(),
  });
}

export function invalidateSuggestedProductsCache(query?: SuggestedProductsCacheQuery): void {
  if (query) {
    caches.delete(suggestedProductsCacheKey(query));
    return;
  }
  caches.clear();
}

export function shouldSkipSuggestedProductsFetch(query: SuggestedProductsCacheQuery): boolean {
  const cache = caches.get(suggestedProductsCacheKey(query));
  if (!cache) {
    return false;
  }
  return Date.now() - cache.fetchedAt < CACHE_FRESH_SKIP_MS;
}

function toListParams(query: SuggestedProductsCacheQuery): ListProductsParams {
  return {
    limit: query.limit,
    status: query.status,
    ...(query.categoryId != null && query.categoryId !== '' ? { categoryId: query.categoryId } : {}),
    ...(query.type != null && query.type !== '' ? { type: query.type } : {}),
    ...(query.excludeProductId ? { excludeProductId: query.excludeProductId } : {}),
    ...(query.fillWithOtherCategories !== undefined ? { fillWithOtherCategories: query.fillWithOtherCategories } : {}),
  };
}

export async function fetchSuggestedProducts(query: SuggestedProductsCacheQuery): Promise<ApiProduct[]> {
  const key = suggestedProductsCacheKey(query);
  if (inflightPromise && inflightKey === key) {
    return inflightPromise;
  }

  inflightKey = key;
  inflightPromise = productService
    .listProducts(toListParams(query))
    .then((productsResponse) => {
      if (productsResponse.success && productsResponse.data) {
        const list = productsResponse.data.products.slice(0, query.limit);
        writeSuggestedProductsCache(query, list);
        return list;
      }
      return readCachedSuggestedProducts(query) ?? [];
    })
    .catch((error) => {
      const cached = readCachedSuggestedProducts(query);
      if (cached) {
        return cached;
      }
      throw error;
    })
    .finally(() => {
      inflightKey = null;
      inflightPromise = null;
    });

  return inflightPromise;
}
