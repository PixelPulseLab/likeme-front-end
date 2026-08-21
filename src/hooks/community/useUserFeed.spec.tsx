import React, { useRef } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useUserFeed } from './useUserFeed';
import { communityService } from '@/services';
import { clearFeedCache, FeedCacheProvider, useFeedCache, type FeedCacheEntry } from '@/contexts/FeedCacheContext';

jest.mock('@/services', () => ({
  communityService: {
    getUserFeed: jest.fn(),
    getCommunityPosts: jest.fn(),
  },
}));

jest.mock('@/utils/community/mappers', () => ({
  mapCommunityPostsForFeedList: jest.fn((posts: Array<{ postId: string }>) =>
    posts.map((p) => ({
      id: p.postId,
      content: '',
      comments: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
  ),
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const getUserFeedMock = communityService.getUserFeed as jest.MockedFunction<typeof communityService.getUserFeed>;
const getCommunityPostsMock = communityService.getCommunityPosts as jest.MockedFunction<
  typeof communityService.getCommunityPosts
>;

const feedPayload = (options: {
  posts: Array<{ postId: string }>;
  paging?: { next?: string };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}) => ({
  success: true as const,
  data: {
    status: 'ok' as const,
    data: {
      posts: options.posts.map((post) => ({
        createdAt: '2026-01-01T00:00:00.000Z',
        ...post,
      })),
      files: [],
      users: [],
      comments: [],
      postChildren: [],
      ...(options.paging !== undefined ? { paging: options.paging } : {}),
    },
    ...(options.pagination !== undefined ? { pagination: options.pagination } : {}),
  },
});

const COMMUNITY_ID = 'community-abc';
const COMMUNITY_FEED_CACHE_KEY = `::||||||||${COMMUNITY_ID}::community-feed-v8`;

function createFeedCacheWrapper(cacheKey: string, entry: FeedCacheEntry) {
  function Seeder({ children }: { children: React.ReactNode }) {
    const cache = useFeedCache();
    const didSeed = useRef(false);
    if (!didSeed.current) {
      cache.write(cacheKey, entry);
      didSeed.current = true;
    }
    return <>{children}</>;
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FeedCacheProvider>
        <Seeder>{children}</Seeder>
      </FeedCacheProvider>
    );
  };
}

describe('useUserFeed (scroll infinito / paginação)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFeedCache();
  });

  it('na primeira página não envia token e define hasMore quando há paging.next', async () => {
    (communityService.getUserFeed as jest.Mock).mockResolvedValue(
      feedPayload({
        posts: [{ postId: 'a1' }],
        paging: { next: 'cursor-page-2' },
      }),
    );

    const { result } = renderHook(() => useUserFeed({ pageSize: 10, searchQuery: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(communityService.getUserFeed).toHaveBeenCalledTimes(1);
    expect(communityService.getUserFeed).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
    expect(getUserFeedMock.mock.calls[0][0]).not.toHaveProperty('token');

    expect(result.current.posts.map((p) => p.id)).toEqual(['a1']);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.currentPage).toBe(1);
  });

  it('loadMore envia page=2 e token igual ao paging.next da página anterior', async () => {
    (communityService.getUserFeed as jest.Mock)
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'p1' }],
          paging: { next: 'next-tok-xyz' },
        }),
      )
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'p2' }],
          paging: {},
        }),
      );

    const { result } = renderHook(() => useUserFeed({ pageSize: 10, searchQuery: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(communityService.getUserFeed).toHaveBeenCalledTimes(2);
    expect(communityService.getUserFeed).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        page: 2,
        limit: 10,
        token: 'next-tok-xyz',
      }),
    );

    expect(result.current.posts.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.currentPage).toBe(2);
  });

  it('sem paging.next e menos posts que pageSize: hasMore false e loadMore não chama API de novo', async () => {
    (communityService.getUserFeed as jest.Mock).mockResolvedValue(
      feedPayload({
        posts: [{ postId: 'only' }],
        paging: {},
      }),
    );

    const { result } = renderHook(() => useUserFeed({ pageSize: 10, searchQuery: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);

    await act(async () => {
      result.current.loadMore();
    });

    expect(communityService.getUserFeed).toHaveBeenCalledTimes(1);
  });

  it('página cheia sem paging.next: hasMore heurístico true, loadMore não dispara fetch sem cursor', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ postId: `full-${i}` }));
    (communityService.getUserFeed as jest.Mock).mockResolvedValue(
      feedPayload({
        posts: ten,
        paging: {},
      }),
    );

    const { result } = renderHook(() => useUserFeed({ pageSize: 10, searchQuery: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.posts).toHaveLength(10);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(communityService.getUserFeed).toHaveBeenCalledTimes(1);
  });

  it('refresh volta à página 1 e nova carga não reutiliza token antigo', async () => {
    (communityService.getUserFeed as jest.Mock)
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'old' }],
          paging: { next: 'stale-cursor' },
        }),
      )
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'fresh' }],
          paging: {},
        }),
      );

    const { result } = renderHook(() => useUserFeed({ pageSize: 10, searchQuery: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.posts[0]?.id).toBe('old');

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.posts[0]?.id).toBe('fresh'));

    expect(communityService.getUserFeed).toHaveBeenCalledTimes(2);
    expect(communityService.getUserFeed).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 1, limit: 10 }));
    expect(getUserFeedMock.mock.calls[1][0]).not.toHaveProperty('token');
  });

  it('com enabled=false não dispara getUserFeed no mount', async () => {
    const { result } = renderHook(() => useUserFeed({ enabled: false, searchQuery: '' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(communityService.getUserFeed).not.toHaveBeenCalled();
    expect(result.current.posts).toEqual([]);
  });

  it('com communityId usa getCommunityPosts e loadMore envia token do paging.next', async () => {
    getCommunityPostsMock
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'c1' }],
          paging: { next: 'provider-cursor-2' },
          pagination: { page: 1, limit: 10, total: 1, totalPages: 2 },
        }),
      )
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'c2' }],
          paging: {},
          pagination: { page: 2, limit: 10, total: 1, totalPages: 2 },
        }),
      );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: 'community-abc' },
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(1);
    expect(getCommunityPostsMock).toHaveBeenCalledWith(
      'community-abc',
      expect.objectContaining({ page: 1, limit: 10 }),
    );
    expect(getUserFeedMock).not.toHaveBeenCalled();
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
    expect(getCommunityPostsMock).toHaveBeenNthCalledWith(
      2,
      'community-abc',
      expect.objectContaining({ page: 2, limit: 10, token: 'provider-cursor-2' }),
    );
    expect(result.current.posts.map((p) => p.id)).toEqual(['c1', 'c2']);
  });

  it('com communityId respeita pagination do backend quando page veio cheia', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ postId: `c-full-${i}` }));
    getCommunityPostsMock.mockResolvedValue(
      feedPayload({
        posts: ten,
        paging: {},
        pagination: { page: 1, limit: 10, total: 10, totalPages: 1 },
      }),
    );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: 'community-abc' },
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.posts).toHaveLength(10);
  });

  it('com communityId não usa heurística de page cheia quando backend não sinaliza próxima página', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ postId: `c-heur-${i}` }));
    getCommunityPostsMock.mockResolvedValue(
      feedPayload({
        posts: ten,
        paging: {},
      }),
    );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: 'community-abc' },
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);

    await act(async () => {
      result.current.loadMore();
    });

    expect(getCommunityPostsMock).toHaveBeenCalledTimes(1);
  });

  it('com communityId usa paging.next para hasMore mesmo quando totalPages=1', async () => {
    getCommunityPostsMock.mockResolvedValue(
      feedPayload({
        posts: [{ postId: 'c-only' }],
        paging: { next: 'provider-cursor-orphan' },
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: COMMUNITY_ID },
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
    expect(getCommunityPostsMock).toHaveBeenNthCalledWith(
      2,
      COMMUNITY_ID,
      expect.objectContaining({ token: 'provider-cursor-orphan' }),
    );
  });

  it('com communityId page 2 vazia no backend define hasMore false no client', async () => {
    getCommunityPostsMock
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'c1' }],
          paging: { next: 'provider-cursor-2' },
          pagination: { page: 1, limit: 10, total: 1, totalPages: 2 },
        }),
      )
      .mockResolvedValueOnce(
        feedPayload({
          posts: [],
          paging: {},
          pagination: { page: 2, limit: 10, total: 0, totalPages: 1 },
        }),
      );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: 'community-abc' },
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.posts.map((p) => p.id)).toEqual(['c1']);
    expect(result.current.hasMore).toBe(false);
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TDD: contratos do bug de load more na comunidade (APP community feed)
  // ──────────────────────────────────────────────────────────────────────────

  it('com communityId page cheia + paging.next + totalPages=2: loadMore append page 2', async () => {
    const pageOnePosts = Array.from({ length: 10 }, (_, index) => ({ postId: `c-page1-${index}` }));
    getCommunityPostsMock
      .mockResolvedValueOnce(
        feedPayload({
          posts: pageOnePosts,
          paging: { next: 'provider-cursor-2' },
          pagination: { page: 1, limit: 10, total: 10, totalPages: 2 },
        }),
      )
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'c-page2-0' }, { postId: 'c-page2-1' }],
          paging: {},
          pagination: { page: 2, limit: 10, total: 2, totalPages: 2 },
        }),
      );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: COMMUNITY_ID },
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.posts).toHaveLength(10);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
    expect(result.current.posts.map((p) => p.id)).toEqual([
      ...pageOnePosts.map((p) => p.postId),
      'c-page2-0',
      'c-page2-1',
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore dispara page 2 na mesma act após page 1 resolver (hasMoreRef sincronizado)', async () => {
    const pageOnePosts = Array.from({ length: 10 }, (_, index) => ({ postId: `sync-${index}` }));
    let resolvePageOne: ((value: ReturnType<typeof feedPayload>) => void) | undefined;
    const pageOneGate = new Promise<ReturnType<typeof feedPayload>>((resolve) => {
      resolvePageOne = resolve;
    });

    getCommunityPostsMock
      .mockImplementationOnce(() => pageOneGate)
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'sync-page2' }],
          paging: {},
          pagination: { page: 2, limit: 10, total: 1, totalPages: 2 },
        }),
      );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: COMMUNITY_ID },
      }),
    );

    await act(async () => {
      resolvePageOne!(
        feedPayload({
          posts: pageOnePosts,
          paging: { next: 'cursor-2' },
          pagination: { page: 1, limit: 10, total: 10, totalPages: 2 },
        }),
      );
      await pageOneGate;
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
    expect(getCommunityPostsMock).toHaveBeenNthCalledWith(
      2,
      COMMUNITY_ID,
      expect.objectContaining({ page: 2, limit: 10, token: 'cursor-2' }),
    );
    expect(result.current.posts.map((p) => p.id)).toContain('sync-page2');
  });

  it('cache com hasMore false stale revalida page 1 e permite loadMore', async () => {
    const cachedPosts = Array.from({ length: 10 }, (_, index) => ({
      id: `cached-${index}`,
      content: '',
      comments: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }));

    let resolveBackgroundRefresh: ((value: ReturnType<typeof feedPayload>) => void) | undefined;
    const backgroundRefreshGate = new Promise<ReturnType<typeof feedPayload>>((resolve) => {
      resolveBackgroundRefresh = resolve;
    });

    getCommunityPostsMock
      .mockImplementationOnce(() => backgroundRefreshGate)
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'fresh-page2' }],
          paging: {},
          pagination: { page: 2, limit: 10, total: 1, totalPages: 2 },
        }),
      );

    const wrapper = createFeedCacheWrapper(COMMUNITY_FEED_CACHE_KEY, {
      posts: cachedPosts,
      nextCursor: undefined,
      hasMore: false,
      currentPage: 1,
      fetchedAt: Date.now(),
    });

    const { result } = renderHook(
      () =>
        useUserFeed({
          pageSize: 10,
          searchQuery: '',
          params: { communityId: COMMUNITY_ID },
        }),
      { wrapper },
    );

    expect(result.current.hasMore).toBe(false);
    expect(result.current.posts).toHaveLength(10);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      resolveBackgroundRefresh!(
        feedPayload({
          posts: cachedPosts.map((p) => ({ postId: p.id })),
          paging: { next: 'cursor-2' },
          pagination: { page: 1, limit: 10, total: 10, totalPages: 2 },
        }),
      );
      await backgroundRefreshGate;
    });

    await waitFor(() => expect(result.current.hasMore).toBe(true));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
    expect(result.current.posts.map((p) => p.id)).toContain('fresh-page2');
  });

  it('clearFeedCache limpa entradas frescas registradas pelo provider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <FeedCacheProvider>{children}</FeedCacheProvider>;
    const cachedEntry: FeedCacheEntry = {
      posts: [
        {
          id: 'private-post-user-a',
          content: '',
          comments: [],
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      nextCursor: undefined,
      hasMore: false,
      currentPage: 1,
      fetchedAt: Date.now(),
    };

    const { result } = renderHook(() => useFeedCache(), { wrapper });

    act(() => {
      result.current.write(COMMUNITY_FEED_CACHE_KEY, cachedEntry);
    });
    expect(result.current.read(COMMUNITY_FEED_CACHE_KEY)).toBe(cachedEntry);

    act(() => {
      clearFeedCache();
    });

    expect(result.current.read(COMMUNITY_FEED_CACHE_KEY)).toBeUndefined();
  });

  it('loadMore bloqueado enquanto page 1 carrega e dispara depois que hasMore fica true', async () => {
    let resolvePageOne: ((value: ReturnType<typeof feedPayload>) => void) | undefined;
    const pageOneGate = new Promise<ReturnType<typeof feedPayload>>((resolve) => {
      resolvePageOne = resolve;
    });

    getCommunityPostsMock
      .mockImplementationOnce(() => pageOneGate)
      .mockResolvedValueOnce(
        feedPayload({
          posts: [{ postId: 'after-loading' }],
          paging: {},
          pagination: { page: 2, limit: 10, total: 1, totalPages: 2 },
        }),
      );

    const { result } = renderHook(() =>
      useUserFeed({
        pageSize: 10,
        searchQuery: '',
        params: { communityId: COMMUNITY_ID },
      }),
    );

    expect(result.current.loading).toBe(true);
    await act(async () => {
      result.current.loadMore();
    });
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePageOne!(
        feedPayload({
          posts: Array.from({ length: 10 }, (_, index) => ({ postId: `gate-${index}` })),
          paging: { next: 'cursor-2' },
          pagination: { page: 1, limit: 10, total: 10, totalPages: 2 },
        }),
      );
      await pageOneGate;
    });

    await waitFor(() => expect(result.current.hasMore).toBe(true));

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(getCommunityPostsMock).toHaveBeenCalledTimes(2);
  });
});
