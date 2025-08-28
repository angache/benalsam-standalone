// ===========================
// CATEGORY SUGGESTIONS SERVICE
// ===========================

import { supabase } from '../../../config/database';
import logger from '../../../config/logger';
import { AISuggestion, CategorySuggestion } from '../types';
import { convertCategorySuggestions } from '../utils/suggestionProcessor';

class CategorySuggestionsService {
  async getSuggestions(categoryId: number, limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`📂 Category AI suggestions for category: ${categoryId}`);

      const { data: suggestions, error } = await supabase
        .from('category_ai_suggestions')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_approved', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching category AI suggestions:', error);
        return [];
      }

      return convertCategorySuggestions(suggestions);

    } catch (error) {
      logger.error('Error in CategorySuggestionsService.getSuggestions:', error);
      return [];
    }
  }

  async getSuggestionsByType(categoryId: number, suggestionType: string, limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`📂 Category AI suggestions for category: ${categoryId}, type: ${suggestionType}`);

      const { data: suggestions, error } = await supabase
        .from('category_ai_suggestions')
        .select('*')
        .eq('category_id', categoryId)
        .eq('suggestion_type', suggestionType)
        .eq('is_approved', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching category AI suggestions by type:', error);
        return [];
      }

      return convertCategorySuggestions(suggestions);

    } catch (error) {
      logger.error('Error in CategorySuggestionsService.getSuggestionsByType:', error);
      return [];
    }
  }

  async getTopSuggestions(limit: number = 20): Promise<AISuggestion[]> {
    try {
      logger.info(`📂 Top category AI suggestions`);

      const { data: suggestions, error } = await supabase
        .from('category_ai_suggestions')
        .select(`
          *,
          categories!inner(name, path, level)
        `)
        .eq('is_approved', true)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching top category AI suggestions:', error);
        return [];
      }

      return convertCategorySuggestions(suggestions);

    } catch (error) {
      logger.error('Error in CategorySuggestionsService.getTopSuggestions:', error);
      return [];
    }
  }

  async getSuggestionsStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('category_ai_suggestions')
        .select('suggestion_type, confidence_score, is_approved')
        .eq('is_approved', true);

      if (error) {
        logger.error('Error fetching category suggestions stats:', error);
        return null;
      }

      const stats = {
        total: data.length,
        byType: {} as Record<string, number>,
        averageConfidence: 0,
        approvedCount: 0
      };

      data.forEach(suggestion => {
        stats.byType[suggestion.suggestion_type] = (stats.byType[suggestion.suggestion_type] || 0) + 1;
        stats.averageConfidence += suggestion.confidence_score;
        if (suggestion.is_approved) stats.approvedCount++;
      });

      stats.averageConfidence = stats.averageConfidence / data.length;

      return stats;

    } catch (error) {
      logger.error('Error in CategorySuggestionsService.getSuggestionsStats:', error);
      return null;
    }
  }
}

export default CategorySuggestionsService;
