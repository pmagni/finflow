interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface SearchResultsProps {
  results: {
    answer?: string;
    results: SearchResult[];
  };
}

const SearchResults = ({ results }: SearchResultsProps) => (
  <div className="space-y-4">
    {results.answer && (
      <div className="p-4 bg-green-50 rounded-md">
        <h3 className="font-bold mb-2">Respuesta:</h3>
        <p>{results.answer}</p>
      </div>
    )}

    <div className="space-y-4">
      <h3 className="font-bold">Resultados:</h3>
      {results.results.map((result, index) => (
        <div key={index} className="p-4 border rounded-md">
          <h4 className="font-semibold mb-2">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {result.title}
            </a>
          </h4>
          <p className="text-gray-600">{result.content}</p>
          <div className="mt-2 text-sm text-gray-500">
            Puntuación: {result.score.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SearchResults; 