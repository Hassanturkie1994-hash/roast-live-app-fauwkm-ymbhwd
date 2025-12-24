
/**
 * useExplorePrefetch Hook
 * 
 * Provides prefetching functionality for explore/feed screens
 * to improve performance and user experience.
 */

import { useState, useCallback, useRef } from 'react';

interface UseExplorePrefetchOptions {
  enabled?: boolean;
  itemsPerPage?: number;
  prefetchThreshold?: number;
}

export function useExplorePrefetch(options: UseExplorePrefetchOptions = {}) {
  const {
    enabled = true,
    itemsPerPage = 20,
    prefetchThreshold = 0.5,
  } = options;

  const [currentPage, setCurrentPage] = useState(0);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const prefetchCacheRef = useRef<Map<number, any>>(new Map());

  const prefetchNextPage = useCallback(async (page: number) => {
    if (!enabled || isPrefetching) {
      return;
    }

    const nextPage = page + 1;

    // Check if already cached
    if (prefetchCacheRef.current.has(nextPage)) {
      console.log('📦 [useExplorePrefetch] Page already cached:', nextPage);
      return;
    }

    console.log('🔄 [useExplorePrefetch] Prefetching page:', nextPage);
    setIsPrefetching(true);

    try {
      // Prefetch logic would go here
      // For now, just simulate prefetch
      await new Promise(resolve => setTimeout(resolve, 100));

      prefetchCacheRef.current.set(nextPage, true);
      console.log('✅ [useExplorePrefetch] Page prefetched:', nextPage);
    } catch (error) {
      console.error('❌ [useExplorePrefetch] Error prefetching:', error);
    } finally {
      setIsPrefetching(false);
    }
  }, [enabled, isPrefetching]);

  const handleScroll = useCallback(
    (scrollY: number, contentHeight: number, viewportHeight: number) => {
      if (!enabled) {
        return;
      }

      const scrollPercentage = (scrollY + viewportHeight) / contentHeight;

      if (scrollPercentage >= prefetchThreshold) {
        prefetchNextPage(currentPage);
      }
    },
    [enabled, prefetchThreshold, currentPage, prefetchNextPage]
  );

  const clearCache = useCallback(() => {
    console.log('🗑️ [useExplorePrefetch] Clearing cache');
    prefetchCacheRef.current.clear();
  }, []);

  return {
    currentPage,
    setCurrentPage,
    isPrefetching,
    prefetchNextPage,
    handleScroll,
    clearCache,
  };
}
