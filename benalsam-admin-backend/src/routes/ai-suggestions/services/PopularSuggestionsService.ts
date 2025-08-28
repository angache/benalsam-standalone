// ===========================
// POPULAR SUGGESTIONS SERVICE
// ===========================

import { supabase } from '../../../config/database';
import logger from '../../../config/logger';
import { AISuggestion } from '../types';
import { convertPopularSuggestions } from '../utils/suggestionProcessor';

class PopularSuggestionsService {
  async getSuggestions(query?: string, limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`⭐ Popular AI suggestions request`);

      let queryBuilder = supabase
        .from('popular_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('is_approved', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      // Add query filter if provided
      if (query) {
        queryBuilder = queryBuilder.ilike('suggestion_text', `%${query}%`);
      }

      const { data: suggestions, error } = await queryBuilder;

      if (error) {
        logger.error('Error fetching popular suggestions:', error);
        return [];
      }

      return convertPopularSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in PopularSuggestionsService.getSuggestions:', error);
      return [];
    }
  }

  async getHighConfidenceSuggestions(limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`⭐ High confidence popular AI suggestions`);

      const { data: suggestions, error } = await supabase
        .from('popular_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('is_approved', true)
        .gte('confidence_score', 0.8)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching high confidence popular suggestions:', error);
        return [];
      }

      return convertPopularSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in PopularSuggestionsService.getHighConfidenceSuggestions:', error);
      return [];
    }
  }

  async getPopularByCategory(categoryId: number, limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`⭐ Popular AI suggestions for category: ${categoryId}`);

      const { data: suggestions, error } = await supabase
        .from('popular_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('category_id', categoryId)
        .eq('is_approved', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching popular suggestions by category:', error);
        return [];
      }

      return convertPopularSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in PopularSuggestionsService.getPopularByCategory:', error);
      return [];
    }
  }

  async getFrequentlyUsedSuggestions(limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`⭐ Frequently used popular AI suggestions`);

      const { data: suggestions, error } = await supabase
        .from('popular_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('is_approved', true)
        .gte('usage_count', 5)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching frequently used popular suggestions:', error);
        return [];
      }

      return convertPopularSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in PopularSuggestionsService.getFrequentlyUsedSuggestions:', error);
      return [];
    }
  }

  async updateUsageCount(suggestionId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('popular_suggestions')
        .update({
          usage_count: supabase.rpc('increment')
        })
        .eq('id', suggestionId);

      if (error) {
        logger.error('Error updating usage count:', error);
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Error in PopularSuggestionsService.updateUsageCount:', error);
      return false;
    }
  }

  async getPopularStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('popular_suggestions')
        .select('confidence_score, usage_count, category_id')
        .eq('is_approved', true);

      if (error) {
        logger.error('Error fetching popular suggestions stats:', error);
        return null;
      }

      const stats = {
        total: data.length,
        totalUsage: 0,
        averageConfidence: 0,
        averageUsage: 0,
        highConfidenceCount: 0,
        mostUsed: null as any
      };

      data.forEach(suggestion => {
        stats.totalUsage += suggestion.usage_count;
        stats.averageConfidence += suggestion.confidence_score;
        if (suggestion.confidence_score >= 0.8) {
          stats.highConfidenceCount++;
        }
        if (suggestion.usage_count > (stats.mostUsed?.usage_count || 0)) {
          stats.mostUsed = suggestion;
        }
      });

      stats.averageConfidence = stats.averageConfidence / data.length;
      stats.averageUsage = stats.totalUsage / data.length;

      return stats;

    } catch (error) {
      logger.error('Error in PopularSuggestionsService.getPopularStats:', error);
      return null;
    }
  }
}

export default PopularSuggestionsService;
