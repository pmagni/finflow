import { TavilySearch } from '../components/TavilySearch';

export const TavilySearchPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Búsqueda con Tavily</h1>
      <TavilySearch />
    </div>
  );
}; 