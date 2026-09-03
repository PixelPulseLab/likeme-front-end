import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { communityService } from '@/services';
import type {
  Community,
  CommunityCategory,
  CommunityFile,
  CommunityUserRelation,
  ListCommunitiesParams,
} from '@/types/community';
import type { FeedEvent } from '@/types/event';
import type { CategoryName } from '@/types/category';
import { PAGINATION } from '@/constants';
import { logger } from '@/utils/logger';
import { prefetchImageUris } from '@/utils/image/prefetchImageUris';
import { resolveCommunityBannerImageUri } from '@/utils/community/mappers';
import {
  isCommunitiesListCacheEntryFresh,
  shouldSkipCommunitiesListBackgroundRefresh,
  writeCommunitiesListCache,
  buildCommunitiesCacheEntryFromListResponse,
  readCommunitiesListCache,
  communitiesListCacheKeyFromParams,
} from '@/utils/community/communitiesListCache';
import type { CommunitiesCacheEntry } from '@/utils/community/communitiesListCache';

import type { JoinCardItem } from '@/components/ui/cards/JoinCard';

const COMMUNITIES_PREFETCH_FIRST_N = 6;

/** Formato do item exibido no JoinCard (ui/cards; comunidade recomendada) */
export type JoinCommunityItem = JoinCardItem;

const JOIN_CARD_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400';

interface UseCommunitiesOptions {
  enabled?: boolean;
  pageSize?: number;
  params?: Partial<ListCommunitiesParams>;
  /** Texto para filtrar joinCommunities por título/badge (opcional) */
  searchQuery?: string;
  /** Se 'all' ou 'communities', filteredJoinCommunities inclui as comunidades; caso contrário, lista vazia */
  solutionTab?: string;
  /** Nome da categoria selecionada para o badge do primeiro card */
  selectedCategoryName?: CategoryName | null;
  /** Função para obter o label da categoria (usado no primeiro card) */
  getCategoryName?: (id: CategoryName) => string;
  /** URL da imagem do primeiro card (ex.: comunidade Dr. Diogo) */
  firstCardImageUrl?: string;
}

const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

interface UseCommunitiesReturn {
  communities: Community[];
  categories: CommunityCategory[];
  communityUsers: CommunityUserRelation[];
  /** Lista no formato esperado pelo JoinCard */
  joinCommunities: JoinCommunityItem[];
  /** joinCommunities filtrado por solutionTab e searchQuery */
  filteredJoinCommunities: JoinCommunityItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  paging: {
    next: string | null;
    previous: string | null;
  } | null;
  loadCommunities: (page: number, append?: boolean) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
  /** Mantido vazio; slot legado para SocialList (cards de canal) */
  feedEvents: FeedEvent[];
  /** Metadados de arquivo da última resposta de listagem (avatars, etc.). */
  communityFiles: CommunityFile[];
}

export const useCommunities = (options: UseCommunitiesOptions = {}): UseCommunitiesReturn => {
  const {
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    params = {},
    searchQuery = '',
    solutionTab = 'all',
    selectedCategoryName = null,
    getCategoryName,
    firstCardImageUrl,
  } = options;

  const paramsKey = JSON.stringify(params ?? {});
  const memoizedParams = useMemo(() => params ?? {}, [paramsKey]);
  const cacheKey = communitiesListCacheKeyFromParams(memoizedParams, pageSize);
  const initialCacheEntry = readCommunitiesListCache(cacheKey);
  const initialCacheIsFresh = initialCacheEntry != null && isCommunitiesListCacheEntryFresh(initialCacheEntry);

  const [communities, setCommunities] = useState<Community[]>(() =>
    initialCacheIsFresh ? initialCacheEntry.communities : [],
  );
  const [categories, setCategories] = useState<CommunityCategory[]>(() =>
    initialCacheIsFresh ? initialCacheEntry.categories : [],
  );
  const [communityUsers, setCommunityUsers] = useState<CommunityUserRelation[]>(() =>
    initialCacheIsFresh ? initialCacheEntry.communityUsers : [],
  );
  const [loading, setLoading] = useState(() => enabled && !initialCacheIsFresh);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(() => (initialCacheIsFresh ? initialCacheEntry.hasMore : true));
  const [error, setError] = useState<string | null>(null);
  const [paging, setPaging] = useState<{
    next: string | null;
    previous: string | null;
  } | null>(() => (initialCacheIsFresh ? initialCacheEntry.paging : null));
  const emptyFeedEvents = useMemo((): FeedEvent[] => [], []);
  const [communityFiles, setCommunityFiles] = useState<CommunityFile[]>(() =>
    initialCacheIsFresh ? initialCacheEntry.communityFiles : [],
  );

  const hasLoadedInitially = useRef(initialCacheIsFresh);
  const previousParamsKey = useRef<string>(initialCacheIsFresh ? paramsKey : '');
  const isLoadingRef = useRef(false);
  const hasErrorRef = useRef(false);
  const backgroundRefreshStartedRef = useRef(false);

  const persistFirstPageCache = useCallback(
    (entry: CommunitiesCacheEntry) => {
      writeCommunitiesListCache(cacheKey, entry);
    },
    [cacheKey],
  );

  const loadCommunities = useCallback(
    async (page: number, append = false) => {
      if (isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;
        hasErrorRef.current = false;

        if (page === 1) {
          if (!append && communities.length === 0) {
            setLoading(true);
          }
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await communityService.listCommunities({
          page,
          limit: pageSize,
          ...memoizedParams,
        });

        const isSuccess = response.success === true || response.status === 'success';

        if (!isSuccess || !response.data) {
          throw new Error(response.message || 'Erro ao listar comunidades');
        }

        const communitiesList = response.data.communities || [];
        const categoriesList = response.data.categories || [];
        const communityUsersList = response.data.communityUsers || [];
        const pagingData = response.data.paging || null;
        const filesList = response.data.files ?? [];
        if (!append) {
          setCommunityFiles(filesList);
        } else if (filesList.length > 0) {
          setCommunityFiles((prev) => {
            const byId = new Map(prev.map((f) => [f.fileId, f]));
            for (const file of filesList) {
              if (file?.fileId) {
                byId.set(file.fileId, file);
              }
            }
            return Array.from(byId.values());
          });
        }

        logger.debug('Communities list response:', {
          success: response.success,
          status: response.status,
          communitiesCount: communitiesList.length,
          categoriesCount: categoriesList.length,
          hasPaging: !!pagingData,
          next: pagingData?.next || null,
          previous: pagingData?.previous || null,
        });

        if (append) {
          setCommunities((prev) => [...prev, ...communitiesList]);
        } else {
          setCommunities(communitiesList);
          setCategories(categoriesList);
        }

        const bannerUris = communitiesList
          .slice(0, COMMUNITIES_PREFETCH_FIRST_N)
          .map((community) => resolveCommunityBannerImageUri(community, filesList, JOIN_CARD_IMAGE_FALLBACK));
        void prefetchImageUris(bannerUris);
        setCommunityUsers(communityUsersList);

        setCurrentPage(page);
        setPaging(
          pagingData
            ? {
                next: pagingData.next ?? null,
                previous: pagingData.previous ?? null,
              }
            : null,
        );

        // Determina se há mais páginas baseado no paging.next ou pagination
        const hasMorePages = pagingData?.next !== null && pagingData?.next !== undefined;
        const pagination = response.data.pagination || response.pagination;
        const hasMoreFromPagination = pagination ? page < pagination.totalPages : false;

        const resolvedHasMore = hasMorePages || hasMoreFromPagination;
        setHasMore(resolvedHasMore);

        if (page === 1 && !append) {
          persistFirstPageCache(buildCommunitiesCacheEntryFromListResponse(response, page));
        }
      } catch (err) {
        hasErrorRef.current = true;
        const errorMessage = err instanceof Error ? err.message : 'Erro ao listar comunidades';
        setError(errorMessage);
        setHasMore(false);

        if (page === 1) {
          setCommunities([]);
          setCategories([]);
          setCommunityUsers([]);
          setPaging(null);
          setCommunityFiles([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [communities.length, pageSize, memoizedParams, persistFirstPageCache],
  );

  useEffect(() => {
    if (!enabled || !initialCacheIsFresh || backgroundRefreshStartedRef.current || initialCacheEntry == null) {
      return;
    }
    if (shouldSkipCommunitiesListBackgroundRefresh(initialCacheEntry)) {
      return;
    }
    backgroundRefreshStartedRef.current = true;
    void loadCommunities(1);
  }, [enabled, initialCacheEntry, initialCacheIsFresh, loadCommunities]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading && enabled) {
      loadCommunities(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, loading, enabled, loadCommunities]);

  const refresh = useCallback(() => {
    hasLoadedInitially.current = false;
    previousParamsKey.current = '';
    setCurrentPage(1);
    setHasMore(true);
    loadCommunities(1);
  }, [loadCommunities]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    const paramsChanged = previousParamsKey.current !== paramsKey;
    const shouldLoad = !hasLoadedInitially.current || paramsChanged;

    if (shouldLoad) {
      hasLoadedInitially.current = true;
      previousParamsKey.current = paramsKey;
      hasErrorRef.current = false;

      if (paramsChanged) {
        setCurrentPage(1);
        setHasMore(true);
      }
      loadCommunities(1);
    }
  }, [enabled, loadCommunities, paramsKey]);

  const joinCommunities = useMemo((): JoinCommunityItem[] => {
    const defaultBadges = categories
      .map((category) => category.name.trim())
      .filter(Boolean)
      .slice(0, 2);
    const badges = defaultBadges.length > 0 ? defaultBadges : ['Community'];

    const list: JoinCommunityItem[] = communities.map((community) => ({
      id: community.communityId,
      title: community.displayName,
      badges,
      image: resolveCommunityBannerImageUri(community, communityFiles, JOIN_CARD_IMAGE_FALLBACK),
    }));

    if (list.length > 0 && (firstCardImageUrl != null || (getCategoryName != null && selectedCategoryName != null))) {
      const selectedLabel =
        getCategoryName != null && selectedCategoryName != null ? getCategoryName(selectedCategoryName).trim() : '';
      const firstBadges =
        selectedLabel.length > 0
          ? [selectedLabel, ...badges.filter((label) => label !== selectedLabel)].slice(0, 2)
          : badges;

      list[0] = {
        ...list[0],
        badges: firstBadges,
        image: firstCardImageUrl ?? list[0].image,
      };
    }
    return list;
  }, [communities, categories, communityFiles, selectedCategoryName, getCategoryName, firstCardImageUrl]);

  const filteredJoinCommunities = useMemo((): JoinCommunityItem[] => {
    const base = solutionTab === 'all' || solutionTab === 'communities' ? joinCommunities : [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return base;
    }
    return base.filter(
      (community) =>
        community.title.toLowerCase().includes(query) ||
        community.badges.some((badge) => badge.toLowerCase().includes(query)),
    );
  }, [joinCommunities, searchQuery, solutionTab]);

  return {
    communities,
    categories,
    communityUsers,
    joinCommunities,
    filteredJoinCommunities,
    loading,
    loadingMore,
    error,
    hasMore,
    currentPage,
    paging,
    loadCommunities,
    loadMore,
    refresh,
    feedEvents: emptyFeedEvents,
    communityFiles,
  };
};
