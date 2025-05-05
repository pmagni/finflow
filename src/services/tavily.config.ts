export const TAVILY_CONFIG = {
  BASE_URL: 'https://api.tavily.com',
  API_VERSION: 'v1',
  DEFAULT_OPTIONS: {
    search_depth: 'basic',
    include_answer: true,
    include_raw_content: false,
    max_results: 5,
  },
} as const; 