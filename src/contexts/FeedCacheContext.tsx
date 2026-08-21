import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { Post } from '@/types';

interface FeedCacheEntry {
  posts: Post[];
  nextCursor: string | undefined;
  hasMore: boolean;
  currentPage: number;
  fetchedAt: number;
}

interface FeedCacheContextValue {
  read: (key: string) => FeedCacheEntry | undefined;
  write: (key: string, entry: FeedCacheEntry) => void;
  writeIfFresh: (key: string, entry: FeedCacheEntry, generation: number) => boolean;
  invalidate: (key?: string) => void;
  generation: () => number;
}

/**
 * Janela em que uma entrada do cache do feed é considerada "fresca" e o hook
 * pode pular o fetch inicial ao remontar a tela. Após esse intervalo, refazemos
 * a requisição (mas o catálogo Supabase continua respondendo 304).
 */
export const FEED_CACHE_STALE_MS = 5 * 60 * 1000;

const feedCacheContextFallback: FeedCacheContextValue = {
  read: () => undefined,
  write: () => undefined,
  writeIfFresh: () => false,
  invalidate: () => undefined,
  generation: () => 0,
};

const FeedCacheContext = createContext<FeedCacheContextValue>(feedCacheContextFallback);
const registeredFeedCacheInvalidators = new Set<() => void>();

export function clearFeedCache(): void {
  registeredFeedCacheInvalidators.forEach((invalidate) => invalidate());
}

export const FeedCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, FeedCacheEntry>>(new Map());
  const generationRef = useRef(0);

  const read = useCallback((key: string) => cacheRef.current.get(key), []);

  const write = useCallback((key: string, entry: FeedCacheEntry) => {
    cacheRef.current.set(key, entry);
  }, []);

  const generation = useCallback(() => generationRef.current, []);

  const writeIfFresh = useCallback((key: string, entry: FeedCacheEntry, expectedGeneration: number) => {
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
    registeredFeedCacheInvalidators.add(clearProviderCache);
    return () => {
      registeredFeedCacheInvalidators.delete(clearProviderCache);
    };
  }, [clearProviderCache]);

  const value = useMemo(
    () => ({ read, write, writeIfFresh, invalidate, generation }),
    [read, write, writeIfFresh, invalidate, generation],
  );

  return <FeedCacheContext.Provider value={value}>{children}</FeedCacheContext.Provider>;
};

export function useFeedCache(): FeedCacheContextValue {
  return useContext(FeedCacheContext);
}

export function isFeedCacheEntryFresh(entry: FeedCacheEntry, now: number = Date.now()): boolean {
  return now - entry.fetchedAt < FEED_CACHE_STALE_MS;
}

export type { FeedCacheEntry };
