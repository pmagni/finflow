interface SearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const SearchForm = ({ searchQuery, setSearchQuery, handleSubmit, isLoading }: SearchFormProps) => (
  <form onSubmit={handleSubmit} className="mb-6">
    <div className="flex gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Ingresa tu búsqueda..."
        className="flex-1 p-2 border rounded-md"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  </form>
);

export default SearchForm; 