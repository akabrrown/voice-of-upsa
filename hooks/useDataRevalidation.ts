import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';

interface DataRevalidationOptions<T = unknown> {
  tableName: string;
  fetchFunction: () => Promise<T>;
  onUpdate?: (payload: unknown) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseDataRevalidationReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  isRealtimeConnected: boolean;
}

/**
 * Custom hook for comprehensive data revalidation with realtime updates
 * Provides automatic data fetching, realtime subscriptions, and cache invalidation
 */
export function useDataRevalidation<T = unknown>({
  tableName,
  fetchFunction,
  onUpdate,
  onError,
  enabled = true
}: DataRevalidationOptions<T>): UseDataRevalidationReturn<T> {
  const { supabase } = useSupabase();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  // Generate cache key
  const getCacheKey = useCallback(() => {
    return `${tableName}_${Date.now()}`;
  }, [tableName]);

  // Check if cache is valid (5 minutes)
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < 300000; // 5 minutes
  }, []);

  // Fetch data with caching and error handling
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless force refresh)
      const cacheKey = getCacheKey();
      const cachedEntry = cacheRef.current.get(cacheKey);
      if (!forceRefresh && cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        setData(cachedEntry.data);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetchFunction();
      
      // Cache the result with timestamp
      cacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() });
      setData(result);
      setLoading(false);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
      console.error(`Error fetching ${tableName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFunction, tableName, getCacheKey, isCacheValid, onError]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cacheRef.current.clear();
    setData(null);
  }, []);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!supabase || !enabled || channelRef.current) return;

    const channelName = `${tableName}-changes`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        async (payload) => {
          console.log(`Realtime update for ${tableName}:`, payload);
          
          try {
            // Handle different event types
            switch (payload.eventType) {
              case 'INSERT':
              case 'UPDATE':
                // Invalidate cache and refetch
                invalidateCache();
                await fetchData(true);
                break;
              case 'DELETE':
                // Remove from cache and refetch
                invalidateCache();
                await fetchData(true);
                break;
            }

            // Call custom update handler
            onUpdate?.(payload);

          } catch (err) {
            console.error(`Error handling realtime update for ${tableName}:`, err);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${tableName}:`, status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });
  }, [supabase, enabled, tableName, fetchData, onUpdate]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Setup realtime subscription on mount
  useEffect(() => {
    if (enabled && supabase) {
      setupRealtimeSubscription();
    }

    // Initial data fetch
    if (enabled) {
      fetchData();
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [enabled, supabase, setupRealtimeSubscription, fetchData]);

  // Handle visibility change to refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        // Refetch if page was hidden for more than 30 seconds
        if (timeSinceLastFetch > 30000) {
          fetchData(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate: invalidateCache,
    isRealtimeConnected
  };
}

/**
 * Hook for optimistic updates with automatic rollback on failure
 */
export function useOptimisticUpdate<T, P>({
  updateFunction,
  onSuccess,
  onError,
  rollbackFunction
}: {
  updateFunction: (params: P) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackFunction?: (previousData: T) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (params: P, optimisticData?: T) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateFunction(params);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      onError?.(error);
      
      // Rollback optimistic update if provided
      if (optimisticData && rollbackFunction) {
        rollbackFunction(optimisticData);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateFunction, onSuccess, onError, rollbackFunction]);

  return {
    execute,
    loading,
    error,
    reset: () => setError(null)
  };
}

/**
 * Global data revalidation manager for cross-component data consistency
 */
class DataRevalidationManager {
  private static instance: DataRevalidationManager;
  private subscribers: Map<string, Set<(data: unknown) => void>> = new Map();
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();

  static getInstance(): DataRevalidationManager {
    if (!DataRevalidationManager.instance) {
      DataRevalidationManager.instance = new DataRevalidationManager();
    }
    return DataRevalidationManager.instance;
  }

  // Subscribe to data changes
  subscribe(key: string, callback: (data: unknown) => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Return cached data if available
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      callback(cached.data);
    }

    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  // Notify subscribers of data changes
  notify(key: string, data: unknown) {
    this.cache.set(key, { data, timestamp: Date.now() });
    this.subscribers.get(key)?.forEach(callback => callback(data));
  }

  // Invalidate cache for a key
  invalidate(key: string) {
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < 300000; // 5 minutes
  }
}

export const dataRevalidationManager = DataRevalidationManager.getInstance();
