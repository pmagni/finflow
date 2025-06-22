
import { cache } from './cache';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static startMeasure(name: string) {
    this.measurements.set(name, performance.now());
  }

  static endMeasure(name: string): number {
    const start = this.measurements.get(name);
    if (!start) {
      console.warn(`No measurement started for ${name}`);
      return 0;
    }
    
    const duration = performance.now() - start;
    this.measurements.delete(name);
    
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return fn().finally(() => {
      this.endMeasure(name);
    });
  }
}

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization with cache integration
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T => {
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const cacheKey = `memoize_${fn.name}_${key}`;
    
    const cached = cache.get<ReturnType<T>>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(cacheKey, result, ttl);
    return result;
  }) as T;
  
  return memoized;
};
