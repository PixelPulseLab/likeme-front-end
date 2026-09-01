import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { communityService } from '@/services';
import type { Post } from '@/types';
import type { CommunityFeedData, UserFeedParams } from '@/types/community';
import { mapCommunityPostsForFeedList } from '@/utils/community/mappers';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import { PAGINATION } from '@/constants';
import { logger } from '@/utils/logger';
import { isFeedCacheEntryFresh, useFeedCache } from '@/contexts/FeedCacheContext';

const FEED_PREFETCH_FIRST_N = 8;

/**
 * Concatena scalars do UserFeedParams num unico string usado como chave de
 * cache e detector de "params mudaram". Evita JSON.stringify a cada render —
 * a serializacao explicita e mais barata e ignora `page`/`limit`/`token`,
 * que sao parametros de paginacao (nao definem identidade do feed).
 */
function buildFeedParamsKey(params: Partial<UserFeedParams> | undefined): string {
  if (!params) return '';
  const postTypes = Array.isArray(params.postTypes)
    ? params.postTypes.slice().sort().join(',')
    : params.postTypes ?? '';
  const authorIds = Array.isArray(params.authorIds)
    ? params.authorIds.slice().sort().join(',')
    : params.authorIds ?? '';
  const solutionIds = Array.isArray(params.solutionIds) ? params.solutionIds.slice().sort().join(',') : '';
  return [
    postTypes,
    authorIds,
    params.startDate ?? '',
    params.endDate ?? '',
    params.orderBy ?? '',
    params.order ?? '',
    params.categoryId ?? '',
    solutionIds,
    params.communityId ?? '',
  ].join('|');
}

interface UseUserFeedOptions {
  enabled?: boolean;
  searchQuery?: string;
  pageSize?: number;
  params?: Partial<UserFeedParams>;
}

const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

interface UseUserFeedReturn {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  loadPosts: (page: number, search?: string, append?: boolean) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
  search: (query: string) => void;
}

export const useUserFeed = (options: UseUserFeedOptions = {}): UseUserFeedReturn => {
  const { enabled = true, searchQuery = '', pageSize = DEFAULT_PAGE_SIZE, params = {} } = options;

  const feedCache = useFeedCache();
  const paramsKey = buildFeedParamsKey(params);
  const scopedCommunityId = (params.communityId ?? '').trim();
  const cacheKey = scopedCommunityId
    ? `${searchQuery}::${paramsKey}::community-feed-v8`
    : `${searchQuery}::${paramsKey}`;
  const initialCacheEntry = feedCache.read(cacheKey);
  const initialCacheIsFresh = initialCacheEntry != null && isFeedCacheEntryFresh(initialCacheEntry);

  const [posts, setPosts] = useState<Post[]>(() => (initialCacheIsFresh ? initialCacheEntry.posts : []));
  const [loading, setLoading] = useState(() => !initialCacheIsFresh);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => (initialCacheIsFresh ? initialCacheEntry.currentPage : 1));
  const [hasMore, setHasMore] = useState(() => (initialCacheIsFresh ? initialCacheEntry.hasMore : true));
  const [error, setError] = useState<string | null>(null);

  const currentPageRef = useRef(initialCacheIsFresh ? initialCacheEntry.currentPage : 1);
  const nextFeedCursorRef = useRef<string | undefined>(initialCacheIsFresh ? initialCacheEntry.nextCursor : undefined);
  const postsRef = useRef<Post[]>(posts);
  postsRef.current = posts;

  const memoizedParams = useMemo(() => params ?? {}, [paramsKey]);
  const feedFilterParams = useMemo(() => {
    if (!scopedCommunityId) {
      return memoizedParams;
    }
    const { communityId: _communityId, ...rest } = memoizedParams;
    return rest;
  }, [memoizedParams, scopedCommunityId]);

  const hasLoadedInitially = useRef(initialCacheIsFresh);
  const previousSearchQuery = useRef<string>(initialCacheIsFresh ? searchQuery : '');
  const previousParamsKey = useRef<string>(initialCacheIsFresh ? paramsKey : '');
  const isLoadingFirstPageRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const hasErrorRef = useRef(false);
  const backgroundRefreshStartedRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const loadingMoreRef = useRef(loadingMore);
  const enabledRef = useRef(enabled);
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;
  loadingMoreRef.current = loadingMore;
  enabledRef.current = enabled;

  const loadPosts = useCallback(
    async (page: number, search?: string, append = false) => {
      if (page > 1) {
        if (isLoadingMoreRef.current) {
          return;
        }
      } else if (isLoadingFirstPageRef.current) {
        return;
      }

      if (page === 1) {
        nextFeedCursorRef.current = undefined;
      }

      if (page > 1 && (nextFeedCursorRef.current == null || nextFeedCursorRef.current.trim() === '')) {
        logger.warn('[useUserFeed] loadMore sem cursor: paging.next ausente na página anterior.');
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      const feedCursor = page === 1 ? undefined : nextFeedCursorRef.current?.trim();

      try {
        if (page > 1) {
          isLoadingMoreRef.current = true;
          loadingMoreRef.current = true;
          setLoadingMore(true);
        } else {
          isLoadingFirstPageRef.current = true;
          if (postsRef.current.length === 0) {
            loadingRef.current = true;
            setLoading(true);
          }
        }
        hasErrorRef.current = false;
        setError(null);

        const requestParams = {
          page,
          limit: pageSize,
          search: search,
          ...(feedCursor != null && feedCursor.length > 0 ? { token: feedCursor } : {}),
          ...feedFilterParams,
        };
        const cacheGeneration = feedCache.generation();

        const userFeedResponse = scopedCommunityId
          ? await communityService.getCommunityPosts(scopedCommunityId, requestParams)
          : await communityService.getUserFeed(requestParams);

        const isSuccess =
          userFeedResponse.success === true ||
          userFeedResponse.status === 'ok' ||
          userFeedResponse.data?.status === 'ok';

        let feedData: CommunityFeedData | undefined;
        if (userFeedResponse.data?.data) {
          feedData = userFeedResponse.data.data;
        } else if (userFeedResponse.data && 'posts' in userFeedResponse.data) {
          feedData = userFeedResponse.data as CommunityFeedData;
        }

        const pagination = userFeedResponse.data?.pagination || userFeedResponse.pagination;

        if (!isSuccess || !feedData) {
          throw new Error(userFeedResponse.message || 'Erro ao carregar feed do usuário');
        }

        const feedPosts = feedData.posts ?? [];
        const mappedPosts = mapCommunityPostsForFeedList(feedPosts, feedData);

        const nextPosts = append ? [...postsRef.current, ...mappedPosts] : mappedPosts;
        setPosts(nextPosts);

        const postsToPrefetch = mappedPosts.slice(0, FEED_PREFETCH_FIRST_N);
        const urisToPrefetch = postsToPrefetch.flatMap((p) => [p.userAvatar, p.image]);
        void prefetchImageUris(urisToPrefetch);

        setCurrentPage(page);
        currentPageRef.current = page;

        const nextFromFeed =
          feedData.paging?.next != null && String(feedData.paging.next).trim().length > 0
            ? String(feedData.paging.next).trim()
            : undefined;
        nextFeedCursorRef.current = nextFromFeed;

        const receivedCount = mappedPosts.length;
        const hasNextToken = nextFromFeed != null;
        const paginationSaysMore =
          pagination &&
          typeof pagination.page === 'number' &&
          typeof pagination.totalPages === 'number' &&
          pagination.totalPages > 0 &&
          pagination.page < pagination.totalPages;

        let hasMorePages = false;
        if (receivedCount === 0 && page === 1) {
          hasMorePages = false;
        } else if (hasNextToken) {
          hasMorePages = true;
        } else if (paginationSaysMore) {
          hasMorePages = true;
        } else if (!scopedCommunityId && receivedCount >= pageSize) {
          hasMorePages = true;
        } else {
          hasMorePages = false;
        }
        setHasMore(hasMorePages);
        hasMoreRef.current = hasMorePages;

        feedCache.writeIfFresh(
          cacheKey,
          {
            posts: nextPosts,
            nextCursor: nextFromFeed,
            hasMore: hasMorePages,
            currentPage: page,
            fetchedAt: Date.now(),
          },
          cacheGeneration,
        );
      } catch (err) {
        hasErrorRef.current = true;
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar posts';
        setError(errorMessage);
        setHasMore(false);
        hasMoreRef.current = false;

        if (page === 1) {
          setPosts([]);
        }
      } finally {
        if (page > 1) {
          isLoadingMoreRef.current = false;
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          isLoadingFirstPageRef.current = false;
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [pageSize, memoizedParams, feedFilterParams, scopedCommunityId, feedCache, cacheKey],
  );

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current || loadingRef.current || !enabledRef.current) {
      return;
    }
    void loadPosts(currentPageRef.current + 1, searchQuery, true);
  }, [searchQuery, loadPosts]);

  const refresh = useCallback(() => {
    feedCache.invalidate(cacheKey);
    hasLoadedInitially.current = false;
    previousSearchQuery.current = '';
    nextFeedCursorRef.current = undefined;
    setCurrentPage(1);
    currentPageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;
    loadPosts(1, searchQuery);
  }, [searchQuery, loadPosts, feedCache, cacheKey]);

  const search = useCallback(
    (query: string) => {
      previousSearchQuery.current = query;
      hasLoadedInitially.current = false;
      nextFeedCursorRef.current = undefined;
      setCurrentPage(1);
      currentPageRef.current = 1;
      setHasMore(true);
      hasMoreRef.current = true;
      loadPosts(1, query);
    },
    [loadPosts],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isLoadingFirstPageRef.current) {
      return;
    }

    const searchChanged = previousSearchQuery.current !== searchQuery;
    const paramsChanged = previousParamsKey.current !== paramsKey;
    const shouldLoad = !hasLoadedInitially.current || searchChanged || paramsChanged;

    if (shouldLoad) {
      hasLoadedInitially.current = true;
      previousSearchQuery.current = searchQuery;
      previousParamsKey.current = paramsKey;
      hasErrorRef.current = false;

      if (searchChanged || paramsChanged) {
        nextFeedCursorRef.current = undefined;
        setCurrentPage(1);
        currentPageRef.current = 1;
        setHasMore(true);
        hasMoreRef.current = true;
      }
      loadPosts(1, searchQuery);
    }
  }, [searchQuery, enabled, loadPosts, paramsKey]);

  useEffect(() => {
    if (!enabled || !initialCacheIsFresh || backgroundRefreshStartedRef.current) {
      return;
    }
    backgroundRefreshStartedRef.current = true;
    if (currentPageRef.current > 1) {
      return;
    }
    void loadPosts(1, searchQuery);
  }, [enabled, initialCacheIsFresh, loadPosts, searchQuery]);

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    currentPage,
    loadPosts,
    loadMore,
    refresh,
    search,
  };
};
