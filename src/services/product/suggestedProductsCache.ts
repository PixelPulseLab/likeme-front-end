import { productService } from '@/services';
import type { Product } from '@/types/product';

export type SuggestedProductsCacheQuery = {
  limit: number;
  status: string;
  categoryId?: string | null;
  type?: string;
  excludeProductId?: string;
  fillWithOtherCategories?: boolean;
};

export const SUGGESTED_PRODUCTS_CACHE_STALE_MS = 5 * 60 * 1000;

type SuggestedProductsCacheEntry = {
  products: Product[];
  fetchedAt: number;
};

const cache = new Map<string, SuggestedProductsCacheEntry>();
const inflight = new Map<string, Promise<Product[]>>();

export function suggestedProductsCacheKey(query: SuggestedProductsCacheQuery): string {
  const fill = query.fillWithOtherCategories === true ? '1' : query.fillWithOtherCategories === false ? '0' : '';
  return [
    String(query.limit),
    query.status,
    query.categoryId ?? '',
    query.type ?? '',
    query.excludeProductId ?? '',
    fill,
  ].join('|');
}

export function getCachedSuggestedProducts(key: string, now: number = Date.now()): Product[] | undefined {
  const entry = cache.get(key);
  if (entry == null) {
    return undefined;
  }
  if (now - entry.fetchedAt >= SUGGESTED_PRODUCTS_CACHE_STALE_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.products;
}

export function setCachedSuggestedProducts(key: string, products: Product[], now: number = Date.now()): void {
  cache.set(key, { products, fetchedAt: now });
}

export function getInflightSuggestedProducts(key: string): Promise<Product[]> | undefined {
  return inflight.get(key);
}

export function setInflightSuggestedProducts(key: string, promise: Promise<Product[]>): void {
  inflight.set(key, promise);
}

export function deleteInflightSuggestedProducts(key: string): void {
  inflight.delete(key);
}

export function clearSuggestedProductsCache(): void {
  cache.clear();
  inflight.clear();
}

type FetchSuggestedProductsOptions = {
  bypassCache?: boolean;
};

export async function fetchSuggestedProducts(
  query: SuggestedProductsCacheQuery,
  options: FetchSuggestedProductsOptions = {},
): Promise<Product[]> {
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
