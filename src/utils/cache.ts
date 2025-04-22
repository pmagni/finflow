import React from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<any>>;
  private defaultExpiration: number;

  private constructor() {
    this.cache = new Map();
    this.defaultExpiration = 5 * 60 * 1000; // 5 minutos por defecto
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, data: T, expiresIn?: number): void {
    const expiration = expiresIn || this.defaultExpiration;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiration,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const cache = Cache.getInstance();

// Hook para usar el caché con React
export const useCache = <T>(key: string, fetchFn: () => Promise<T>, expiresIn?: number) => {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Intentar obtener datos del caché
        const cachedData = cache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
          return;
        }

        // Si no hay datos en caché, obtenerlos
        const newData = await fetchFn();
        cache.set(key, newData, expiresIn);
        setData(newData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, fetchFn, expiresIn]);

  return { data, isLoading, error };
}; 