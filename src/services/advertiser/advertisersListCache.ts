import type { Advertiser } from '@/types/ad';

export const ADVERTISERS_LIST_CACHE_STALE_MS = 5 * 60 * 1000;

type AdvertisersListCacheEntry = {
  advertisers: Advertiser[];
  fetchedAt: number;
};

const cache = new Map<string, AdvertisersListCacheEntry>();
const inflight = new Map<string, Promise<Advertiser[]>>();
let cacheGeneration = 0;

export function getAdvertisersListCacheGeneration(): number {
  return cacheGeneration;
}

export function getCachedAdvertisersList(key: string, now: number = Date.now()): Advertiser[] | undefined {
  const entry = cache.get(key);
  if (entry == null) {
    return undefined;
  }
  if (now - entry.fetchedAt >= ADVERTISERS_LIST_CACHE_STALE_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.advertisers;
}

export function setCachedAdvertisersList(
  key: string,
  advertisers: Advertiser[],
  now: number = Date.now(),
  generation: number = cacheGeneration,
): boolean {
  if (generation !== cacheGeneration) {
    return false;
  }
  cache.set(key, { advertisers, fetchedAt: now });
  return true;
}

export function getInflightAdvertisersList(key: string): Promise<Advertiser[]> | undefined {
  return inflight.get(key);
}

export function setInflightAdvertisersList(key: string, promise: Promise<Advertiser[]>): void {
  inflight.set(key, promise);
}

export function deleteInflightAdvertisersList(key: string): void {
  inflight.delete(key);
}

export function clearAdvertisersListCache(): void {
  cacheGeneration += 1;
  cache.clear();
  inflight.clear();
}
