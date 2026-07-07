import { activityService } from '@/services';
import type { UserActivity } from '@/types/activity';

const CACHE_MAX_AGE_MS = 120_000;
const CACHE_FRESH_SKIP_MS = 5_000;

type ActivityListCacheEntry = {
  includeDeleted: boolean;
  rawActivities: UserActivity[];
  fetchedAt: number;
};

let cache: ActivityListCacheEntry | null = null;
let inflightKey: string | null = null;
let inflightPromise: Promise<UserActivity[]> | null = null;

function cacheKey(includeDeleted: boolean): string {
  return includeDeleted ? 'with-deleted' : 'active-only';
}

export function readCachedActivityList(includeDeleted: boolean): UserActivity[] | null {
  if (!cache || cache.includeDeleted !== includeDeleted) {
    return null;
  }
  if (Date.now() - cache.fetchedAt > CACHE_MAX_AGE_MS) {
    return null;
  }
  return cache.rawActivities;
}

export function writeActivityListCache(includeDeleted: boolean, rawActivities: UserActivity[]): void {
  cache = {
    includeDeleted,
    rawActivities,
    fetchedAt: Date.now(),
  };
}

export function invalidateActivityListCache(): void {
  cache = null;
}

export function shouldSkipActivityListFetch(includeDeleted: boolean): boolean {
  if (!cache || cache.includeDeleted !== includeDeleted) {
    return false;
  }
  return Date.now() - cache.fetchedAt < CACHE_FRESH_SKIP_MS;
}

export async function fetchActivityList(includeDeleted = false): Promise<UserActivity[]> {
  const key = cacheKey(includeDeleted);
  if (inflightPromise && inflightKey === key) {
    return inflightPromise;
  }

  inflightKey = key;
  inflightPromise = activityService
    .listActivities({
      page: 1,
      limit: 100,
      includeDeleted,
    })
    .then((response) => {
      const typed = response as { success?: boolean; data?: { activities?: UserActivity[] } };
      if (typed.success !== true) {
        return readCachedActivityList(includeDeleted) ?? [];
      }
      const list = typed.data?.activities ?? [];
      writeActivityListCache(includeDeleted, list);
      return list;
    })
    .catch((error) => {
      const cached = readCachedActivityList(includeDeleted);
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

export async function prefetchActivityList(includeDeleted = false): Promise<UserActivity[]> {
  return fetchActivityList(includeDeleted);
}
