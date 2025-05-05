import { useState } from 'react';
import { TavilyService, TavilySearchResult } from '../services/tavily.service';

export const useTavilySearch = (apiKey: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TavilySearchResult | null>(null);

  const search = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tavilyService = new TavilyService(apiKey);
      const searchResults = await tavilyService.search(query);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    search,
    isLoading,
    error,
    results,
  };
}; 