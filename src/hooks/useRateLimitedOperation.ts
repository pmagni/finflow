
import { useState } from 'react';
import { toast } from 'sonner';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export const useRateLimitedOperation = (
  maxRequests: number = 10,
  windowMs: number = 60000,
  operationName: string = 'operación'
) => {
  const [isRateLimited, setIsRateLimited] = useState(false);

  const checkRateLimit = (userId: string): boolean => {
    const key = `${userId}-${operationName}`;
    const now = Date.now();
    
    // Obtener límites del localStorage
    const limitsData = localStorage.getItem('rateLimits');
    const limits: Map<string, RateLimitEntry> = limitsData 
      ? new Map(JSON.parse(limitsData))
      : new Map();

    const entry = limits.get(key);

    if (!entry) {
      limits.set(key, { count: 1, resetTime: now + windowMs });
      localStorage.setItem('rateLimits', JSON.stringify([...limits]));
      setIsRateLimited(false);
      return false;
    }

    if (now > entry.resetTime) {
      limits.set(key, { count: 1, resetTime: now + windowMs });
      localStorage.setItem('rateLimits', JSON.stringify([...limits]));
      setIsRateLimited(false);
      return false;
    }

    if (entry.count >= maxRequests) {
      setIsRateLimited(true);
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      toast.error(`Has excedido el límite de ${operationName}s. Inténtalo en ${remainingTime} segundos.`);
      return true;
    }

    entry.count++;
    limits.set(key, entry);
    localStorage.setItem('rateLimits', JSON.stringify([...limits]));
    setIsRateLimited(false);
    return false;
  };

  return { checkRateLimit, isRateLimited };
};
