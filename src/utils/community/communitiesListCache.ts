import { communityService } from '@/services';
import type {
  Community,
  CommunityCategory,
  CommunityFile,
  CommunityUserRelation,
  ListCommunitiesApiResponse,
  ListCommunitiesParams,
} from '@/types/community';
import { logger } from '@/utils/logger';

export function communitiesListCacheKey(paramsKey: string, pageSize: number): string {
  return `communities::${pageSize}::${paramsKey}`;
}

export const COMMUNITIES_CACHE_STALE_MS = 5 * 60 * 1000;
export const COMMUNITIES_LIST_CACHE_FRESH_SKIP_MS = 5_000;

export interface CommunitiesCacheEntry {
  communities: Community[];
  categories: CommunityCategory[];
  communityUsers: CommunityUserRelation[];
  communityFiles: CommunityFile[];
  paging: {
    next: string | null;
    previous: string | null;
  } | null;
  hasMore: boolean;
  fetchedAt: number;
}

export function isCommunitiesListCacheEntryFresh(entry: CommunitiesCacheEntry, now: number = Date.now()): boolean {
  return now - entry.fetchedAt < COMMUNITIES_CACHE_STALE_MS;
}

export function shouldSkipCommunitiesListBackgroundRefresh(
  entry: CommunitiesCacheEntry,
  now: number = Date.now(),
): boolean {
  return now - entry.fetchedAt < COMMUNITIES_LIST_CACHE_FRESH_SKIP_MS;
}

const cache = new Map<string, CommunitiesCacheEntry>();
const inflight = new Map<string, Promise<CommunitiesCacheEntry | null>>();
const communityById = new Map<string, { community: Community; fetchedAt: number }>();

export function writeCachedCommunity(community: Community, fetchedAt: number = Date.now()): void {
  const communityId = community.communityId?.trim();
  if (!communityId) {
    return;
  }
  communityById.set(communityId, { community, fetchedAt });
}

export function readCachedCommunity(communityId: string, now: number = Date.now()): Community | undefined {
  const id = communityId.trim();
  if (!id) {
    return undefined;
  }

  const byId = communityById.get(id);
  if (byId) {
    if (now - byId.fetchedAt >= COMMUNITIES_CACHE_STALE_MS) {
      communityById.delete(id);
    } else {
      return byId.community;
    }
  }

  for (const [key, entry] of cache) {
    if (!isCommunitiesListCacheEntryFresh(entry, now)) {
      cache.delete(key);
      continue;
    }
    const found = entry.communities.find((community) => community.communityId === id);
    if (found) {
      writeCachedCommunity(found, entry.fetchedAt);
      return found;
    }
  }

  return undefined;
}

export function shouldSkipCommunityBackgroundRefresh(communityId: string, now: number = Date.now()): boolean {
  const id = communityId.trim();
  if (!id) {
    return false;
  }
  const byId = communityById.get(id);
  if (byId) {
    return now - byId.fetchedAt < COMMUNITIES_LIST_CACHE_FRESH_SKIP_MS;
  }
  const fromList = readCachedCommunity(id, now);
  if (!fromList) {
    return false;
  }
  const seeded = communityById.get(id);
  return seeded != null && now - seeded.fetchedAt < COMMUNITIES_LIST_CACHE_FRESH_SKIP_MS;
}

export function communitiesListCacheKeyFromParams(params: Partial<ListCommunitiesParams>, pageSize: number): string {
  return communitiesListCacheKey(JSON.stringify(params ?? {}), pageSize);
}

export function readCommunitiesListCache(key: string): CommunitiesCacheEntry | undefined {
  const entry = cache.get(key);
  if (entry == null) {
    return undefined;
  }
  if (!isCommunitiesListCacheEntryFresh(entry)) {
    cache.delete(key);
    return undefined;
  }
  return entry;
}

export function writeCommunitiesListCache(key: string, entry: CommunitiesCacheEntry): void {
  cache.set(key, entry);
  for (const community of entry.communities) {
    writeCachedCommunity(community, entry.fetchedAt);
  }
}

export function invalidateCommunitiesListCache(key?: string): void {
  if (key == null) {
    cache.clear();
    communityById.clear();
    return;
  }
  cache.delete(key);
}

export function buildCommunitiesCacheEntryFromListResponse(
  response: ListCommunitiesApiResponse,
  page: number,
): CommunitiesCacheEntry {
  const isSuccess = response.success === true || response.status === 'success';
  if (!isSuccess || !response.data) {
    throw new Error(response.message || 'Erro ao listar comunidades');
  }

  const pagingData = response.data.paging ?? null;
  const pagination = response.data.pagination ?? response.pagination;
  const hasMorePages = pagingData?.next !== null && pagingData?.next !== undefined;
  const hasMoreFromPagination = pagination ? page < pagination.totalPages : false;

  return {
    communities: response.data.communities ?? [],
    categories: response.data.categories ?? [],
    communityUsers: response.data.communityUsers ?? [],
    communityFiles: response.data.files ?? [],
    paging: pagingData
      ? {
          next: pagingData.next ?? null,
          previous: pagingData.previous ?? null,
        }
      : null,
    hasMore: hasMorePages || hasMoreFromPagination,
    fetchedAt: Date.now(),
  };
}

export async function prefetchCommunitiesList(
  params: Partial<ListCommunitiesParams>,
  pageSize: number,
): Promise<CommunitiesCacheEntry | null> {
  const key = communitiesListCacheKeyFromParams(params, pageSize);
  const cached = readCommunitiesListCache(key);
  if (cached) {
    return cached;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    try {
      const response = await communityService.listCommunities({
        page: 1,
        limit: pageSize,
        ...params,
      });
      const entry = buildCommunitiesCacheEntryFromListResponse(response, 1);
      writeCommunitiesListCache(key, entry);
      return entry;
    } catch (error) {
      logger.error('[communitiesListCache] Falha ao precarregar comunidades', {
        pageSize,
        cause: error,
      });
      return readCommunitiesListCache(key) ?? null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}

export function clearCommunitiesListCache(): void {
  cache.clear();
  inflight.clear();
  communityById.clear();
}
