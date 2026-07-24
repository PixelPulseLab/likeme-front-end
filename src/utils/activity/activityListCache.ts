import { activityService } from '@/services';
import type { ActivityListScope, UserActivity } from '@/types/activity';

const CACHE_MAX_AGE_MS = 120_000;
const CACHE_FRESH_SKIP_MS = 5_000;
const ACTIVITY_LIST_SCOPES: ActivityListScope[] = ['active', 'history'];

type ActivityListCacheEntry = {
  rawActivities: UserActivity[];
  fetchedAt: number;
};

const caches: Partial<Record<ActivityListScope, ActivityListCacheEntry>> = {};
const inflightRequests: Partial<Record<ActivityListScope, Promise<UserActivity[]>>> = {};
const cacheVersions: Record<ActivityListScope, number> = {
  active: 0,
  history: 0,
};

class StaleActivityListRequestError extends Error {
  constructor(listScope: ActivityListScope) {
    super(`Ignoring stale activity list response for ${listScope}`);
    this.name = 'StaleActivityListRequestError';
  }
}

export function isStaleActivityListRequestError(error: unknown): boolean {
  return error instanceof StaleActivityListRequestError;
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
    delete inflightRequests[listScope];
    cacheVersions[listScope] += 1;
    return;
  }
  for (const scope of ACTIVITY_LIST_SCOPES) {
    delete caches[scope];
    delete inflightRequests[scope];
    cacheVersions[scope] += 1;
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
  const inflightRequest = inflightRequests[listScope];
  if (inflightRequest) {
    return inflightRequest;
  }

  const requestVersion = cacheVersions[listScope];
  const request = activityService
    .listActivities({
      page: 1,
      limit: 100,
      scope: listScope,
    })
    .then((response) => {
      if (cacheVersions[listScope] !== requestVersion) {
        throw new StaleActivityListRequestError(listScope);
      }

      const typed = response as { success?: boolean; data?: { activities?: UserActivity[] } };
      if (typed.success !== true) {
        const cached = readCachedActivityList(listScope);
        if (cached) {
          return cached;
        }
        throw new Error(`Activity list request failed for ${listScope}`);
      }
      const list = typed.data?.activities ?? [];
      writeActivityListCache(listScope, list);
      return list;
    })
    .catch((error) => {
      if (isStaleActivityListRequestError(error)) {
        throw error;
      }
      const cached = readCachedActivityList(listScope);
      if (cached) {
        return cached;
      }
      throw error;
    })
    .finally(() => {
      if (inflightRequests[listScope] === request) {
        delete inflightRequests[listScope];
      }
    });

  inflightRequests[listScope] = request;
  return request;
}

export async function prefetchActivityList(listScope: ActivityListScope = 'active'): Promise<UserActivity[]> {
  return fetchActivityList(listScope);
}
