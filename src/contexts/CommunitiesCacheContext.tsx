import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { Community, CommunityCategory, CommunityFile, CommunityUserRelation } from '@/types/community';

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

interface CommunitiesCacheContextValue {
  read: (key: string) => CommunitiesCacheEntry | undefined;
  write: (key: string, entry: CommunitiesCacheEntry) => void;
  writeIfFresh: (key: string, entry: CommunitiesCacheEntry, generation: number) => boolean;
  invalidate: (key?: string) => void;
  generation: () => number;
}

export const COMMUNITIES_CACHE_STALE_MS = 5 * 60 * 1000;

const fallback: CommunitiesCacheContextValue = {
  read: () => undefined,
  write: () => undefined,
  writeIfFresh: () => false,
  invalidate: () => undefined,
  generation: () => 0,
};

const CommunitiesCacheContext = createContext<CommunitiesCacheContextValue>(fallback);
const registeredCommunitiesCacheInvalidators = new Set<() => void>();

export function clearCommunitiesCache(): void {
  registeredCommunitiesCacheInvalidators.forEach((invalidate) => invalidate());
}

export const CommunitiesCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, CommunitiesCacheEntry>>(new Map());
  const generationRef = useRef(0);

  const read = useCallback((key: string) => cacheRef.current.get(key), []);

  const write = useCallback((key: string, entry: CommunitiesCacheEntry) => {
    cacheRef.current.set(key, entry);
  }, []);

  const generation = useCallback(() => generationRef.current, []);

  const writeIfFresh = useCallback((key: string, entry: CommunitiesCacheEntry, expectedGeneration: number) => {
    if (expectedGeneration !== generationRef.current) {
      return false;
    }
    cacheRef.current.set(key, entry);
    return true;
  }, []);

  const clearProviderCache = useCallback(() => {
    generationRef.current += 1;
    cacheRef.current.clear();
  }, []);

  const invalidate = useCallback((key?: string) => {
    if (key == null) {
      generationRef.current += 1;
      cacheRef.current.clear();
      return;
    }
    cacheRef.current.delete(key);
  }, []);

  useEffect(() => {
    registeredCommunitiesCacheInvalidators.add(clearProviderCache);
    return () => {
      registeredCommunitiesCacheInvalidators.delete(clearProviderCache);
    };
  }, [clearProviderCache]);

  const value = useMemo(
    () => ({ read, write, writeIfFresh, invalidate, generation }),
    [read, write, writeIfFresh, invalidate, generation],
  );

  return <CommunitiesCacheContext.Provider value={value}>{children}</CommunitiesCacheContext.Provider>;
};

export function useCommunitiesCache(): CommunitiesCacheContextValue {
  return useContext(CommunitiesCacheContext);
}

export function isCommunitiesCacheEntryFresh(entry: CommunitiesCacheEntry, now: number = Date.now()): boolean {
  return now - entry.fetchedAt < COMMUNITIES_CACHE_STALE_MS;
}
