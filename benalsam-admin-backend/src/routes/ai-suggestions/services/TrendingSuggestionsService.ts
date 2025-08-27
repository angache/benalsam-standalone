// ===========================
// TRENDING SUGGESTIONS SERVICE
// ===========================

import { supabase } from '../../config/database';
import logger from '../../config/logger';
import { AISuggestion } from '../types';
import { convertTrendingSuggestions } from '../utils/suggestionProcessor';

class TrendingSuggestionsService {
  async getSuggestions(query?: string, limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`🔥 Trending AI suggestions request`);

      let queryBuilder = supabase
        .from('trending_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('is_approved', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      // Add query filter if provided
      if (query) {
        queryBuilder = queryBuilder.ilike('suggestion_text', `%${query}%`);
      }

      const { data: suggestions, error } = await queryBuilder;

      if (error) {
        logger.error('Error fetching trending suggestions:', error);
        return [];
      }

      return convertTrendingSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in TrendingSuggestionsService.getSuggestions:', error);
      return [];
    }
  }

  async getRecentTrending(limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`🔥 Recent trending AI suggestions`);

      const { data: suggestions, error } = await supabase
        .from('trending_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('is_approved', true)
        .gte('last_used', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching recent trending suggestions:', error);
        return [];
      }

      return convertTrendingSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in TrendingSuggestionsService.getRecentTrending:', error);
      return [];
    }
  }

  async getTrendingByCategory(categoryId: number, limit: number = 10): Promise<AISuggestion[]> {
    try {
      logger.info(`🔥 Trending AI suggestions for category: ${categoryId}`);

      const { data: suggestions, error } = await supabase
        .from('trending_suggestions')
        .select(`
          *,
          categories!inner(name, path)
        `)
        .eq('category_id', categoryId)
        .eq('is_approved', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching trending suggestions by category:', error);
        return [];
      }

      return convertTrendingSuggestions(suggestions);

    } catch (error) {
      logger.error('Error in TrendingSuggestionsService.getTrendingByCategory:', error);
      return [];
    }
  }

  async updateUsageCount(suggestionId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trending_suggestions')
        .update({
          usage_count: supabase.rpc('increment'),
          last_used: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) {
        logger.error('Error updating usage count:', error);
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Error in TrendingSuggestionsService.updateUsageCount:', error);
      return false;
    }
  }

  async getTrendingStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('trending_suggestions')
        .select('usage_count, last_used, category_id')
        .eq('is_approved', true);

      if (error) {
        logger.error('Error fetching trending suggestions stats:', error);
        return null;
      }

      const stats = {
        total: data.length,
        totalUsage: 0,
        averageUsage: 0,
        mostUsed: null as any,
        recentActivity: 0
      };

      data.forEach(suggestion => {
        stats.totalUsage += suggestion.usage_count;
        if (suggestion.usage_count > (stats.mostUsed?.usage_count || 0)) {
          stats.mostUsed = suggestion;
        }
        if (new Date(suggestion.last_used) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          stats.recentActivity++;
        }
      });

      stats.averageUsage = stats.totalUsage / data.length;

      return stats;

    } catch (error) {
      logger.error('Error in TrendingSuggestionsService.getTrendingStats:', error);
      return null;
    }
  }
}

export default TrendingSuggestionsService;
