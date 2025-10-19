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
}

// Yeni Category AI Suggestion interface'leri
export interface CategoryAISuggestion {
  id: number;
  categoryId: number;
  suggestionType: 'title' | 'description' | 'attributes' | 'keywords';
  suggestionData: any;
  confidenceScore: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAISuggestionsResponse {
  success: boolean;
  data: {
    categoryId: number;
    suggestions: CategoryAISuggestion[];
    total: number;
  };
}

class AISuggestionsService {
  private readonly CACHE_KEY = 'ai_suggestions_v2';
  private readonly CATEGORY_AI_CACHE_KEY = 'category_ai_suggestions_v1';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly RATE_LIMIT = 60 * 1000; // 1 minute
  private lastFetchTime = 0;
  private isFetching = false;

  /**
   * Get AI suggestions based on query and context
   */
  async getSuggestions(query?: string, categoryId?: number): Promise<AISuggestion[]> {
    try {
      // Always fetch from API - disable cache temporarily
      console.log('🔄 Fetching AI suggestions from API...');
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
      console.log('🤖 Getting category AI suggestions for category:', categoryId);
      
      // Önce category AI suggestions'ları getir
      const categorySuggestions = await this.getCategoryAISuggestions(categoryId);
      
      // Sonra genel AI suggestions'ları getir
      const generalSuggestions = await this.getSuggestions();
      
      // Kategori bazlı önerileri önceliklendir
      const categoryBasedSuggestions = categorySuggestions.map(suggestion => ({
        id: `category-ai-${suggestion.id}`,
        text: this.extractSuggestionText(suggestion),
        type: 'category' as const,
        score: suggestion.confidenceScore,
        category: { id: suggestion.categoryId } as any,
        metadata: {
          suggestionType: suggestion.suggestionType,
          isApproved: suggestion.isApproved
        } as any
      }));

      return [...categoryBasedSuggestions, ...generalSuggestions];
    } catch (error) {
      console.error('❌ Error getting category suggestions:', error);
      return [];
    }
  }

  /**
   * Get category AI suggestions from database
   */
  async getCategoryAISuggestions(categoryId: number): Promise<CategoryAISuggestion[]> {
    try {
      const cacheKey = `${this.CATEGORY_AI_CACHE_KEY}_${categoryId}`;
      const cached = this.getCachedCategorySuggestions(categoryId);
      
      if (cached.length > 0) {
        console.log('📦 Category AI suggestions loaded from cache');
        return cached;
      }

      console.log('🤖 Fetching category AI suggestions from API...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/ai-suggestions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: CategoryAISuggestionsResponse = await response.json();
      
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      // Cache the suggestions
      this.setCachedCategorySuggestions(categoryId, result.data.suggestions);
      
      console.log(`✅ Fetched ${result.data.suggestions.length} category AI suggestions`);
      return result.data.suggestions;
    } catch (error) {
      console.error('❌ Error fetching category AI suggestions:', error);
      return [];
    }
  }

  /**
   * Extract suggestion text from suggestion data
   */
  private extractSuggestionText(suggestion: CategoryAISuggestion): string {
    try {
      if (suggestion.suggestionType === 'keywords') {
        const keywords = suggestion.suggestionData?.suggestions || [];
        // İlk 3 keyword'ü göster, geri kalanı "..." ile kısalt
        if (keywords.length > 3) {
          return `${keywords.slice(0, 3).join(', ')}...`;
        }
        return keywords.join(', ');
      } else if (suggestion.suggestionType === 'title' || suggestion.suggestionType === 'description') {
        const suggestions = suggestion.suggestionData?.suggestions || [];
        return suggestions[0] || 'AI Önerisi';
      } else {
        return 'AI Önerisi';
      }
    } catch (error) {
      console.error('Error extracting suggestion text:', error);
      return 'AI Önerisi';
    }
  }

  /**
   * Get trending suggestions
   */
  async getTrendingSuggestions(): Promise<AISuggestion[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/trending`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.suggestions || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting trending suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular suggestions
   */
  async getPopularSuggestions(): Promise<AISuggestion[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions/popular`);
      const result = await response.json();
      
      if (result.success) {
        return result.data.suggestions || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting popular suggestions:', error);
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-suggestions?${params}`);
      
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
      if (cached) {
        const { suggestions, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          return suggestions;
        }
      }
    } catch (error) {
      console.error('Error getting cached suggestions:', error);
    }
    return [];
  }

  /**
   * Set cached suggestions
   */
  private setCachedSuggestions(suggestions: AISuggestion[]): void {
    try {
      const cacheData = {
        suggestions,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cached suggestions:', error);
    }
  }

  /**
   * Get cached category suggestions
   */
  private getCachedCategorySuggestions(categoryId: number): CategoryAISuggestion[] {
    try {
      const cacheKey = `${this.CATEGORY_AI_CACHE_KEY}_${categoryId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { suggestions, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_TTL) {
          return suggestions;
        }
      }
    } catch (error) {
      console.error('Error getting cached category suggestions:', error);
    }
    return [];
  }

  /**
   * Set cached category suggestions
   */
  private setCachedCategorySuggestions(categoryId: number, suggestions: CategoryAISuggestion[]): void {
    try {
      const cacheKey = `${this.CATEGORY_AI_CACHE_KEY}_${categoryId}`;
      const cacheData = {
        suggestions,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cached category suggestions:', error);
    }
  }

  /**
   * Get fallback suggestions
   */
  private getFallbackSuggestions(query?: string, categoryId?: number): AISuggestion[] {
    console.log('🔄 Using fallback suggestions');
    
    // Boş array döndür - gerçek veri kullan
    return [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      
      // Clear all category AI suggestion caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CATEGORY_AI_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('🗑️ AI suggestions cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
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
