
/**
 * Query Cache Service
 * 
 * Centralized caching layer for Supabase queries to prevent duplicate requests
 * and improve performance across the app.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or execute query
   */
  async getCached<T>(
    key: string,
    queryFn: () => Promise<T>,
    cacheDuration: number = this.DEFAULT_CACHE_DURATION
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log(`✅ Cache hit: ${key}`);
      return cached.data;
    }

    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`⏳ Returning pending request: ${key}`);
      return pending;
    }

    // Execute query
    console.log(`🔄 Cache miss, executing query: ${key}`);
    const promise = queryFn();
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      
      // Update cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } finally {
      // Clear pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Invalidate cache for keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cache invalidated for pattern: ${pattern} (${keysToDelete.length} entries)`);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Preload data into cache
   */
  preload<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`📦 Preloaded cache: ${key}`);
  }
}

export const queryCache = new QueryCacheService();