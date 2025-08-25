import { supabase } from '../config/database';
import logger from '../config/logger';

interface SearchAnalytics {
  query: string;
  count: number;
  categoryId?: number;
  timestamp: string;
}

interface TrendingTopic {
  keyword: string;
  score: number;
  categoryId?: number;
  trend: 'rising' | 'stable' | 'declining';
}

class AISuggestionGenerator {
  private readonly MIN_CONFIDENCE_SCORE = 0.7;
  private readonly MAX_SUGGESTIONS_PER_CATEGORY = 10;

  /**
   * Analyze user search patterns and generate AI suggestions
   */
  async generateSuggestionsFromAnalytics(): Promise<void> {
    try {
      logger.info('🤖 Starting AI suggestion generation from analytics...');

      // 1. Get trending search queries
      const trendingQueries = await this.getTrendingQueries();
      
      // 2. Get category-specific search patterns
      const categoryPatterns = await this.getCategorySearchPatterns();
      
      // 3. Generate suggestions for each category
      for (const [categoryId, patterns] of Object.entries(categoryPatterns)) {
        await this.generateCategorySuggestions(parseInt(categoryId), patterns);
      }

      // 4. Generate trending suggestions
      await this.generateTrendingSuggestions(trendingQueries);

      logger.info('✅ AI suggestion generation completed');
    } catch (error) {
      logger.error('❌ Error generating AI suggestions:', error);
    }
  }

  /**
   * Get trending search queries from analytics
   */
  private async getTrendingQueries(): Promise<SearchAnalytics[]> {
    try {
      // This would typically query your analytics database
      // For now, we'll use mock data
      const mockTrendingQueries: SearchAnalytics[] = [
        { query: 'iPhone 15 Pro', count: 1250, timestamp: new Date().toISOString() },
        { query: 'MacBook Air M2', count: 980, timestamp: new Date().toISOString() },
        { query: 'Samsung Galaxy S24', count: 756, timestamp: new Date().toISOString() },
        { query: 'Tesla Model 3', count: 654, timestamp: new Date().toISOString() },
        { query: 'PlayStation 5', count: 543, timestamp: new Date().toISOString() }
      ];

      return mockTrendingQueries;
    } catch (error) {
      logger.error('Error getting trending queries:', error);
      return [];
    }
  }

  /**
   * Get category-specific search patterns
   */
  private async getCategorySearchPatterns(): Promise<Record<number, SearchAnalytics[]>> {
    try {
      // This would typically query your analytics database
      // For now, we'll use mock data
      const mockPatterns: Record<number, SearchAnalytics[]> = {
        618: [ // Elektronik
          { query: 'iPhone', count: 500, categoryId: 618, timestamp: new Date().toISOString() },
          { query: 'Samsung', count: 320, categoryId: 618, timestamp: new Date().toISOString() },
          { query: 'MacBook', count: 280, categoryId: 618, timestamp: new Date().toISOString() }
        ],
        723: [ // Emlak
          { query: 'Ev', count: 800, categoryId: 723, timestamp: new Date().toISOString() },
          { query: 'Daire', count: 650, categoryId: 723, timestamp: new Date().toISOString() },
          { query: 'Villa', count: 450, categoryId: 723, timestamp: new Date().toISOString() }
        ],
        630: [ // Araç
          { query: 'Araba', count: 1200, categoryId: 630, timestamp: new Date().toISOString() },
          { query: 'SUV', count: 750, categoryId: 630, timestamp: new Date().toISOString() },
          { query: 'Sedan', count: 600, categoryId: 630, timestamp: new Date().toISOString() }
        ]
      };

      return mockPatterns;
    } catch (error) {
      logger.error('Error getting category patterns:', error);
      return {};
    }
  }

  /**
   * Generate AI suggestions for a specific category
   */
  private async generateCategorySuggestions(categoryId: number, patterns: SearchAnalytics[]): Promise<void> {
    try {
      // Get existing suggestions to avoid duplicates
      const { data: existingSuggestions } = await supabase
        .from('category_ai_suggestions')
        .select('suggestion_data')
        .eq('category_id', categoryId)
        .eq('is_approved', true);

      const existingKeywords = new Set<string>();
      existingSuggestions?.forEach(suggestion => {
        if (suggestion.suggestion_data?.suggestions) {
          suggestion.suggestion_data.suggestions.forEach((keyword: string) => {
            existingKeywords.add(keyword.toLowerCase());
          });
        }
      });

      // Generate keyword suggestions
      const keywordSuggestions = patterns
        .filter(pattern => !existingKeywords.has(pattern.query.toLowerCase()))
        .slice(0, 5)
        .map(pattern => pattern.query);

      if (keywordSuggestions.length > 0) {
        await this.createSuggestion(categoryId, 'keywords', {
          suggestions: keywordSuggestions
        }, this.calculateConfidenceScore(patterns));
      }

      // Generate title suggestions
      const titleSuggestions = patterns
        .slice(0, 3)
        .map(pattern => `${pattern.query} Satılık`);

      if (titleSuggestions.length > 0) {
        await this.createSuggestion(categoryId, 'title', {
          suggestions: titleSuggestions
        }, this.calculateConfidenceScore(patterns));
      }

      // Generate description suggestions
      const descriptionSuggestions = patterns
        .slice(0, 2)
        .map(pattern => `Yeni ${pattern.query}, mükemmel durumda`);

      if (descriptionSuggestions.length > 0) {
        await this.createSuggestion(categoryId, 'description', {
          suggestions: descriptionSuggestions
        }, this.calculateConfidenceScore(patterns));
      }

    } catch (error) {
      logger.error(`Error generating suggestions for category ${categoryId}:`, error);
    }
  }

  /**
   * Generate trending suggestions
   */
  private async generateTrendingSuggestions(trendingQueries: SearchAnalytics[]): Promise<void> {
    try {
      // This would create trending suggestions that appear across all categories
      // For now, we'll just log the trending topics
      logger.info('🔥 Trending topics detected:', trendingQueries.map(q => q.query));
    } catch (error) {
      logger.error('Error generating trending suggestions:', error);
    }
  }

  /**
   * Create a new AI suggestion
   */
  private async createSuggestion(
    categoryId: number,
    suggestionType: string,
    suggestionData: any,
    confidenceScore: number
  ): Promise<void> {
    try {
      if (confidenceScore < this.MIN_CONFIDENCE_SCORE) {
        logger.info(`Skipping suggestion with low confidence: ${confidenceScore}`);
        return;
      }

      const { error } = await supabase
        .from('category_ai_suggestions')
        .insert({
          category_id: categoryId,
          suggestion_type: suggestionType,
          suggestion_data: suggestionData,
          confidence_score: confidenceScore,
          is_approved: false // Requires manual approval
        });

      if (error) {
        logger.error('Error creating AI suggestion:', error);
      } else {
        logger.info(`✅ Created AI suggestion for category ${categoryId}: ${suggestionType}`);
      }
    } catch (error) {
      logger.error('Error creating suggestion:', error);
    }
  }

  /**
   * Calculate confidence score based on search patterns
   */
  private calculateConfidenceScore(patterns: SearchAnalytics[]): number {
    if (patterns.length === 0) return 0;

    const totalSearches = patterns.reduce((sum, pattern) => sum + pattern.count, 0);
    const avgSearches = totalSearches / patterns.length;
    
    // Normalize to 0-1 range, with higher scores for more popular searches
    const normalizedScore = Math.min(avgSearches / 1000, 1);
    
    // Add some randomness to simulate AI confidence
    const randomFactor = 0.1;
    const finalScore = Math.min(normalizedScore + (Math.random() * randomFactor), 1);
    
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Schedule automatic suggestion generation
   */
  async scheduleGeneration(): Promise<void> {
    // This would typically use a cron job or scheduler
    // For now, we'll just log the schedule
    logger.info('📅 AI suggestion generation scheduled for daily execution');
  }

  /**
   * Get suggestion generation statistics
   */
  async getGenerationStats(): Promise<any> {
    try {
      const { data: suggestions, error } = await supabase
        .from('category_ai_suggestions')
        .select('*');

      if (error) {
        logger.error('Error getting generation stats:', error);
        return null;
      }

      const stats = {
        total: suggestions?.length || 0,
        approved: suggestions?.filter(s => s.is_approved).length || 0,
        pending: suggestions?.filter(s => !s.is_approved).length || 0,
        averageConfidence: suggestions?.reduce((sum, s) => sum + s.confidence_score, 0) / (suggestions?.length || 1) || 0,
        byType: {} as Record<string, number>
      };

      // Count by suggestion type
      suggestions?.forEach(suggestion => {
        const type = suggestion.suggestion_type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting generation stats:', error);
      return null;
    }
  }
}

export const aiSuggestionGenerator = new AISuggestionGenerator();
export default aiSuggestionGenerator;
