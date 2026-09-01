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
let cacheGeneration = 0;

export function getSuggestedProductsCacheGeneration(): number {
  return cacheGeneration;
}

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

export function setCachedSuggestedProducts(
  key: string,
  products: Product[],
  now: number = Date.now(),
  generation: number = cacheGeneration,
): boolean {
  if (generation !== cacheGeneration) {
    return false;
  }
  cache.set(key, { products, fetchedAt: now });
  return true;
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
  cacheGeneration += 1;
  cache.clear();
  inflight.clear();
}
