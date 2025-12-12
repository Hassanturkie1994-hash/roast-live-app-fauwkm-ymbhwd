
import { useEffect, useRef, useCallback } from 'react';
import { cdnService } from '@/app/services/cdnService';

interface UseExplorePrefetchOptions {
  enabled?: boolean;
  itemsPerPage?: number;
  prefetchThreshold?: number; // Percentage of scroll to trigger prefetch (0-1)
}

/**
 * Hook for CDN-based prefetching of explore content
 * 
 * Features:
 * - Prefetch next 20 thumbnails
 * - Cache into memory
 * - Prioritize trending posts
 * - Trigger prefetch when scrolling past 50% of list
 * 
 * RULE: Do NOT prefetch livestream feeds - only static assets allowed
 */
export function useExplorePrefetch(options: UseExplorePrefetchOptions = {}) {
  const {
    enabled = true,
    itemsPerPage = 20,
    prefetchThreshold = 0.5,
  } = options;

  const currentPageRef = useRef(0);
  const isPrefetchingRef = useRef(false);
  const prefetchedPagesRef = useRef(new Set<number>());

  /**
   * Prefetch thumbnails for explore content
   */
  const prefetchThumbnails = useCallback(async (thumbnailUrls: string[]) => {
    if (!enabled || isPrefetchingRef.current) return;

    try {
      isPrefetchingRef.current = true;
      await cdnService.prefetchExploreThumbnails(thumbnailUrls, true);
    } catch (error) {
      console.error('Error prefetching thumbnails:', error);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, [enabled]);

  /**
   * Prefetch next page
   */
  const prefetchNextPage = useCallback(async (currentPage: number) => {
    if (!enabled || isPrefetchingRef.current) return;

    const nextPage = currentPage + 1;

    // Check if already prefetched
    if (prefetchedPagesRef.current.has(nextPage)) {
      console.log('✅ Page already prefetched:', nextPage);
      return;
    }

    try {
      isPrefetchingRef.current = true;
      console.log('🚀 Prefetching page:', nextPage);
      
      await cdnService.prefetchNextPage(currentPage, itemsPerPage);
      prefetchedPagesRef.current.add(nextPage);
      
      console.log('✅ Page prefetched:', nextPage);
    } catch (error) {
      console.error('Error prefetching next page:', error);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, [enabled, itemsPerPage]);

  /**
   * Handle scroll event
   * Triggers prefetch when user scrolls past threshold
   */
  const handleScroll = useCallback((
    scrollOffset: number,
    contentHeight: number,
    containerHeight: number
  ) => {
    if (!enabled) return;

    // Calculate scroll percentage
    const scrollPercentage = scrollOffset / (contentHeight - containerHeight);

    // Trigger prefetch when past threshold
    if (scrollPercentage >= prefetchThreshold) {
      prefetchNextPage(currentPageRef.current);
    }
  }, [enabled, prefetchThreshold, prefetchNextPage]);

  /**
   * Update current page
   */
  const setCurrentPage = useCallback((page: number) => {
    currentPageRef.current = page;
  }, []);

  /**
   * Clear prefetch cache
   */
  const clearCache = useCallback(() => {
    cdnService.clearPrefetchCache();
    prefetchedPagesRef.current.clear();
    console.log('✅ Prefetch cache cleared');
  }, []);

  /**
   * Prefetch initial content on mount
   */
  useEffect(() => {
    if (enabled) {
      // Prefetch first page
      prefetchNextPage(0);
    }

    return () => {
      // Cleanup on unmount
      clearCache();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    prefetchThumbnails,
    prefetchNextPage,
    handleScroll,
    setCurrentPage,
    clearCache,
    currentPage: currentPageRef.current,
  };
}