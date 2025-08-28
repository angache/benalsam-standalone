// ===========================
// ELASTICSEARCH SUGGESTIONS SERVICE
// ===========================

import { AdminElasticsearchService } from '../../../services/elasticsearchService';
import { supabase } from '../../../config/database';
import logger from '../../../config/logger';
import { AISuggestion, CategorySuggestion, ElasticsearchSuggestion, SuggestionQuery } from '../types';
import { buildElasticsearchQuery } from '../utils/queryBuilder';
import { combineElasticsearchResults } from '../utils/suggestionProcessor';

class ElasticsearchSuggestionsService {
  private elasticsearchService: AdminElasticsearchService;

  constructor() {
    this.elasticsearchService = new AdminElasticsearchService(
      process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
      'ai_suggestions'
    );
  }

  async getSuggestions(query: string, options: SuggestionQuery = {}): Promise<AISuggestion[]> {
    try {
      logger.info(`🔍 ES search for query: ${query}`);

      // Build Elasticsearch query
      const esQuery = buildElasticsearchQuery(query, options);

      // Search in Elasticsearch
      const response = await this.elasticsearchService.search(esQuery);
      
      if (!response || !response.hits || !response.hits.hits) {
        logger.warn('No ES results found');
        return [];
      }

      // Get suggestion IDs from ES results
      const suggestionIds = response.hits.hits.map((hit: ElasticsearchSuggestion) => hit._source.id);

      // Get detailed data from Supabase
      const { data: suggestions, error } = await supabase
        .from('category_ai_suggestions')
        .select(`
          *,
          categories!inner(name, path, level)
        `)
        .in('id', suggestionIds)
        .eq('is_approved', true);

      if (error) {
        logger.error('Error getting suggestions from Supabase:', error);
        return [];
      }

      // Combine ES scores with Supabase data
      return combineElasticsearchResults(response.hits.hits, suggestions);

    } catch (error) {
      logger.error('Error in ElasticsearchSuggestionsService.getSuggestions:', error);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const health = await this.elasticsearchService.healthCheck();
      return health.status === 'green' || health.status === 'yellow';
    } catch (error) {
      logger.error('Elasticsearch health check failed:', error);
      return false;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      return await this.elasticsearchService.getIndexStats();
    } catch (error) {
      logger.error('Error getting index stats:', error);
      return null;
    }
  }
}

export default ElasticsearchSuggestionsService;
