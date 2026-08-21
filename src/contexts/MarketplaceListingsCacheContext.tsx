import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { Ad } from '@/types/ad';

export interface MarketplaceListingsCacheEntry {
  ads: Ad[];
  hasMore: boolean;
  fetchedAt: number;
}

interface MarketplaceListingsCacheContextValue {
  read: (key: string) => MarketplaceListingsCacheEntry | undefined;
  write: (key: string, entry: MarketplaceListingsCacheEntry) => void;
  writeIfFresh: (key: string, entry: MarketplaceListingsCacheEntry, generation: number) => boolean;
  invalidate: (key?: string) => void;
  generation: () => number;
}

/** Mesma janela do feed: reutiliza listagem em memória ao voltar à tela. */
export const MARKETPLACE_LISTINGS_CACHE_STALE_MS = 5 * 60 * 1000;

const fallback: MarketplaceListingsCacheContextValue = {
  read: () => undefined,
  write: () => undefined,
  writeIfFresh: () => false,
  invalidate: () => undefined,
  generation: () => 0,
};

const MarketplaceListingsCacheContext = createContext<MarketplaceListingsCacheContextValue>(fallback);
const registeredMarketplaceListingsCacheInvalidators = new Set<() => void>();

export function clearMarketplaceListingsCache(): void {
  registeredMarketplaceListingsCacheInvalidators.forEach((invalidate) => invalidate());
}

export const MarketplaceListingsCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, MarketplaceListingsCacheEntry>>(new Map());
  const generationRef = useRef(0);

  const read = useCallback((key: string) => cacheRef.current.get(key), []);

  const write = useCallback((key: string, entry: MarketplaceListingsCacheEntry) => {
    cacheRef.current.set(key, entry);
  }, []);

  const generation = useCallback(() => generationRef.current, []);

  const writeIfFresh = useCallback((key: string, entry: MarketplaceListingsCacheEntry, expectedGeneration: number) => {
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
    registeredMarketplaceListingsCacheInvalidators.add(clearProviderCache);
    return () => {
      registeredMarketplaceListingsCacheInvalidators.delete(clearProviderCache);
    };
  }, [clearProviderCache]);

  const value = useMemo(
    () => ({ read, write, writeIfFresh, invalidate, generation }),
    [read, write, writeIfFresh, invalidate, generation],
  );

  return <MarketplaceListingsCacheContext.Provider value={value}>{children}</MarketplaceListingsCacheContext.Provider>;
};

export function useMarketplaceListingsCache(): MarketplaceListingsCacheContextValue {
  return useContext(MarketplaceListingsCacheContext);
}

export function isMarketplaceListingsCacheEntryFresh(
  entry: MarketplaceListingsCacheEntry,
  now: number = Date.now(),
): boolean {
  return now - entry.fetchedAt < MARKETPLACE_LISTINGS_CACHE_STALE_MS;
}
