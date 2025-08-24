import { Category } from 'benalsam-shared-types';

export interface AISuggestion {
  id: string;
  text: string;
  type: 'category' | 'search' | 'trending' | 'popular';
  score: number;
  category?: Category;
  metadata?: {
    searchCount?: number;
    lastSearched?: string;
    trending?: boolean;
  };
}

export interface AISuggestionsResponse {
  suggestions: AISuggestion[];
  total: number;
  query?: string;
  category?: string;
}

class AISuggestionsService {
  private readonly CACHE_KEY = 'ai_suggestions_v1';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly RATE_LIMIT = 60 * 1000; // 1 minute
  private lastFetchTime = 0;
  private isFetching = false;

  /**
   * Get AI suggestions based on query and context
   */
  async getSuggestions(query?: string, categoryId?: number): Promise<AISuggestion[]> {
    try {
      // Rate limiting
      if (Date.now() - this.lastFetchTime < this.RATE_LIMIT) {
        console.log('⏰ Rate limited, using cached suggestions');
        return this.getCachedSuggestions();
      }

      // Check cache first
      const cached = this.getCachedSuggestions();
      if (cached.length > 0) {
        console.log('📦 AI suggestions loaded from cache');
        return cached;
      }

      // Fetch from API
      return await this.fetchSuggestionsFromAPI(query, categoryId);
    } catch (error) {
      console.error('❌ Error getting AI suggestions:', error);
      return this.getFallbackSuggestions(query, categoryId);
    }
  }

  /**
   * Get category-based suggestions
   */
  async getCategorySuggestions(categoryId: number): Promise<AISuggestion[]> {
    try {
      const suggestions = await this.getSuggestions(undefined, categoryId);
      return suggestions.filter(s => s.type === 'category');
    } catch (error) {
      console.error('❌ Error getting category suggestions:', error);
      return [];
    }
  }

  /**
   * Get trending suggestions
   */
  async getTrendingSuggestions(): Promise<AISuggestion[]> {
    try {
      const suggestions = await this.getSuggestions();
      return suggestions.filter(s => s.type === 'trending');
    } catch (error) {
      console.error('❌ Error getting trending suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular search suggestions
   */
  async getPopularSuggestions(): Promise<AISuggestion[]> {
    try {
      const suggestions = await this.getSuggestions();
      return suggestions.filter(s => s.type === 'popular');
    } catch (error) {
      console.error('❌ Error getting popular suggestions:', error);
      return [];
    }
  }

  /**
   * Fetch suggestions from API
   */
  private async fetchSuggestionsFromAPI(query?: string, categoryId?: number): Promise<AISuggestion[]> {
    this.isFetching = true;
    this.lastFetchTime = Date.now();

    try {
      console.log('🤖 Fetching AI suggestions from API...');
      
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (categoryId) params.append('categoryId', categoryId.toString());
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-suggestions?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned error');
      }
      
      const suggestions = result.data.suggestions || [];
      
      // Cache the suggestions
      this.setCachedSuggestions(suggestions);
      
      console.log(`✅ Fetched ${suggestions.length} AI suggestions from API`);
      return suggestions;
    } catch (error) {
      console.error('❌ Error fetching AI suggestions from API:', error);
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get cached suggestions
   */
  private getCachedSuggestions(): AISuggestion[] {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return [];

      const parsed = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > this.CACHE_TTL) {
        console.log('⏰ AI suggestions cache expired');
        return [];
      }

      return parsed.suggestions || [];
    } catch (error) {
      console.error('❌ Error reading AI suggestions cache:', error);
      return [];
    }
  }

  /**
   * Set suggestions in cache
   */
  private setCachedSuggestions(suggestions: AISuggestion[]): void {
    try {
      const cacheData = {
        suggestions,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 AI suggestions cached successfully');
    } catch (error) {
      console.error('❌ Error setting AI suggestions cache:', error);
    }
  }

  /**
   * Get fallback suggestions when API fails
   */
  private getFallbackSuggestions(query?: string, categoryId?: number): AISuggestion[] {
    const fallbackSuggestions: AISuggestion[] = [
      {
        id: 'trending-1',
        text: 'iPhone 15 Pro',
        type: 'trending',
        score: 0.95,
        metadata: { trending: true }
      },
      {
        id: 'trending-2',
        text: 'MacBook Air M2',
        type: 'trending',
        score: 0.92,
        metadata: { trending: true }
      },
      {
        id: 'popular-1',
        text: 'Araba',
        type: 'popular',
        score: 0.88,
        metadata: { searchCount: 1250 }
      },
      {
        id: 'popular-2',
        text: 'Ev',
        type: 'popular',
        score: 0.85,
        metadata: { searchCount: 980 }
      },
      {
        id: 'popular-3',
        text: 'Telefon',
        type: 'popular',
        score: 0.82,
        metadata: { searchCount: 756 }
      }
    ];

    // Filter by query if provided
    if (query) {
      return fallbackSuggestions.filter(s => 
        s.text.toLowerCase().includes(query.toLowerCase())
      );
    }

    return fallbackSuggestions;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ AI suggestions cache cleared');
    } catch (error) {
      console.error('❌ Error clearing AI suggestions cache:', error);
    }
  }

  /**
   * Refresh suggestions (force fetch from API)
   */
  async refresh(): Promise<AISuggestion[]> {
    console.log('🔄 Forcing AI suggestions refresh...');
    this.clearCache();
    this.lastFetchTime = 0;
    return await this.fetchSuggestionsFromAPI();
  }
}

export const aiSuggestionsService = new AISuggestionsService();
export default aiSuggestionsService;
