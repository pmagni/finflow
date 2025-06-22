
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PerformanceMonitor } from '@/utils/performance';
import { cache } from '@/utils/cache';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  cacheTime?: number;
  enablePerformanceMonitoring?: boolean;
}

export const useOptimizedQuery = <T>(
  queryKey: string[],
  options: OptimizedQueryOptions<T>
) => {
  const {
    queryFn,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    enablePerformanceMonitoring = true,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const cacheKey = queryKey.join('_');
      
      // Check cache first
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute query with performance monitoring
      const result = enablePerformanceMonitoring
        ? await PerformanceMonitor.measureAsync(
            `Query: ${queryKey.join(' > ')}`,
            queryFn
          )
        : await queryFn();

      // Cache the result
      cache.set(cacheKey, result, cacheTime);
      
      return result;
    },
    staleTime: cacheTime / 2, // Consider data stale after half the cache time
    gcTime: cacheTime, // Keep in memory for cache time
    ...queryOptions,
  });
};
