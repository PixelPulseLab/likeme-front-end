import activityService from '@/services/activity/activityService';
import type { ActivityListScope, UserActivity } from '@/types/activity';

const CACHE_MAX_AGE_MS = 120_000;
const CACHE_FRESH_SKIP_MS = 5_000;

type ActivityListCacheEntry = {
  rawActivities: UserActivity[];
  fetchedAt: number;
};

const caches: Partial<Record<ActivityListScope, ActivityListCacheEntry>> = {};
let inflightKey: string | null = null;
let inflightPromise: Promise<UserActivity[]> | null = null;

function cacheKey(listScope: ActivityListScope): string {
  return listScope;
}

export function readCachedActivityList(listScope: ActivityListScope): UserActivity[] | null {
  const cache = caches[listScope];
  if (!cache) {
    return null;
  }
  if (Date.now() - cache.fetchedAt > CACHE_MAX_AGE_MS) {
    return null;
  }
  return cache.rawActivities;
}

export function writeActivityListCache(listScope: ActivityListScope, rawActivities: UserActivity[]): void {
  caches[listScope] = {
    rawActivities,
    fetchedAt: Date.now(),
  };
}

export function invalidateActivityListCache(listScope?: ActivityListScope): void {
  if (listScope) {
    delete caches[listScope];
    return;
  }
  for (const scope of Object.keys(caches) as ActivityListScope[]) {
    delete caches[scope];
  }
}

export function shouldSkipActivityListFetch(listScope: ActivityListScope): boolean {
  const cache = caches[listScope];
  if (!cache) {
    return false;
  }
  return Date.now() - cache.fetchedAt < CACHE_FRESH_SKIP_MS;
}

export async function fetchActivityList(listScope: ActivityListScope = 'active'): Promise<UserActivity[]> {
  const key = cacheKey(listScope);
  if (inflightPromise && inflightKey === key) {
    return inflightPromise;
  }

  inflightKey = key;
  inflightPromise = activityService
    .listActivities({
      page: 1,
      limit: 100,
      scope: listScope,
    })
    .then((response) => {
      const typed = response as { success?: boolean; data?: { activities?: UserActivity[] } };
      if (typed.success !== true) {
        return readCachedActivityList(listScope) ?? [];
      }
      const list = typed.data?.activities ?? [];
      writeActivityListCache(listScope, list);
      return list;
    })
    .catch((error) => {
      const cached = readCachedActivityList(listScope);
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

export async function prefetchActivityList(listScope: ActivityListScope = 'active'): Promise<UserActivity[]> {
  return fetchActivityList(listScope);
}
