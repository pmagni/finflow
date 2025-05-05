import axios from 'axios';
import { TAVILY_CONFIG } from './tavily.config';

export interface TavilySearchResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  answer?: string;
}

export class TavilyService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = `${TAVILY_CONFIG.BASE_URL}/${TAVILY_CONFIG.API_VERSION}`;
  }

  async search(query: string, options: Partial<typeof TAVILY_CONFIG.DEFAULT_OPTIONS> = {}) {
    try {
      const response = await axios.post<TavilySearchResult>(
        `${this.baseUrl}/search`,
        {
          query,
          ...TAVILY_CONFIG.DEFAULT_OPTIONS,
          ...options,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Error en la búsqueda de Tavily: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
} 