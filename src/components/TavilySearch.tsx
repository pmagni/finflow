import { useState } from 'react';
import { useTavilySearch } from '../hooks/useTavilySearch';
import SearchForm from './TavilySearch/SearchForm';
import SearchResults from './TavilySearch/SearchResults';
import ErrorMessage from './TavilySearch/ErrorMessage';

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';

export const TavilySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { search, isLoading, error, results } = useTavilySearch(TAVILY_API_KEY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <SearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {error && <ErrorMessage error={error} />}

      {results && <SearchResults results={results} />}
    </div>
  );
}; 