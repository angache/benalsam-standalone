// ===========================
// SEARCH SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import logger from '../../config/logger';
import { SearchQuery, SearchResponse, SearchOptimizationOptions } from '../types';
import { SearchOptimizedListing } from 'benalsam-shared-types';
import { buildSearchQuery } from '../utils/queryBuilder';
import searchCacheService from '../searchCacheService';

class SearchService {
  private client: Client;
  private defaultIndexName: string;

  constructor(client: Client, defaultIndexName: string = 'listings') {
    this.client = client;
    this.defaultIndexName = defaultIndexName;
  }

  async search<T = any>(query: SearchQuery, indexName?: string): Promise<SearchResponse<T>> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      
      logger.info(`🔍 Searching in index: ${targetIndex}`);

      const response = await this.client.search({
        index: targetIndex,
        body: query
      });

      return response.body;

    } catch (error) {
      logger.error('❌ Error in search:', error);
      throw error;
    }
  }

  async searchOptimized(
    query: string, 
    options: SearchOptimizationOptions = {}
  ): Promise<SearchOptimizedListing[]> {
    try {
      const { useCache = true, cacheTTL = 300 } = options;

      // Check cache first
      if (useCache) {
        const cachedResult = await searchCacheService.get(query);
        if (cachedResult) {
          logger.info(`📦 Returning cached search result for: ${query}`);
          return cachedResult;
        }
      }

      // Build optimized search query
      const searchQuery = buildSearchQuery(query, options);
      
      // Perform search
      const response = await this.search(searchQuery, this.defaultIndexName);
      
      // Transform results
      const results = this.transformSearchResults(response);
      
      // Cache results
      if (useCache) {
        await searchCacheService.set(query, results, cacheTTL);
      }

      logger.info(`✅ Search completed for: ${query} (${results.length} results)`);
      return results;

    } catch (error) {
      logger.error('❌ Error in optimized search:', error);
      return [];
    }
  }

  async searchIndexStatic(indexName: string, options: { size?: number } = {}): Promise<any> {
    try {
      logger.info(`🔍 Static search in index: ${indexName}`);

      const response = await this.client.search({
        index: indexName,
        body: {
          query: {
            match_all: {}
          },
          size: options.size || 10
        }
      });

      return response.body;

    } catch (error) {
      logger.error('❌ Error in static search:', error);
      throw error;
    }
  }

  async indexDocument(indexName: string, document: any, id?: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      
      await this.client.index({
        index: targetIndex,
        id,
        body: document
      });

      logger.info(`✅ Document indexed successfully in ${targetIndex}`);
      return true;

    } catch (error) {
      logger.error('❌ Error indexing document:', error);
      return false;
    }
  }

  async updateDocument(indexName: string, id: string, document: any): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      
      await this.client.update({
        index: targetIndex,
        id,
        body: {
          doc: document
        }
      });

      logger.info(`✅ Document updated successfully in ${targetIndex}`);
      return true;

    } catch (error) {
      logger.error('❌ Error updating document:', error);
      return false;
    }
  }

  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      
      await this.client.delete({
        index: targetIndex,
        id
      });

      logger.info(`✅ Document deleted successfully from ${targetIndex}`);
      return true;

    } catch (error) {
      logger.error('❌ Error deleting document:', error);
      return false;
    }
  }

  async bulkIndex(documents: Array<{ index: string; document: any; id?: string }>): Promise<any> {
    try {
      const operations = documents.flatMap(({ index, document, id }) => [
        { index: { _index: index, _id: id } },
        document
      ]);

      const response = await this.client.bulk({
        body: operations
      });

      const errors = response.body.items.filter((item: any) => item.index?.error);
      
      if (errors.length > 0) {
        logger.warn(`⚠️ ${errors.length} documents failed to index`);
        errors.forEach((error: any) => {
          logger.error('Bulk index error:', error.index.error);
        });
      }

      logger.info(`✅ Bulk indexed ${documents.length} documents`);
      return response.body;

    } catch (error) {
      logger.error('❌ Error in bulk index:', error);
      throw error;
    }
  }

  async countDocuments(indexName?: string, query?: any): Promise<number> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      
      const response = await this.client.count({
        index: targetIndex,
        body: query ? { query } : undefined
      });

      return response.body.count;

    } catch (error) {
      logger.error('❌ Error counting documents:', error);
      return 0;
    }
  }

  async getDocument(indexName: string, id: string): Promise<any> {
    try {
      const response = await this.client.get({
        index: indexName,
        id
      });

      return response.body._source;

    } catch (error) {
      logger.error('❌ Error getting document:', error);
      return null;
    }
  }

  private transformSearchResults(response: SearchResponse): SearchOptimizedListing[] {
    if (!response.hits?.hits) {
      return [];
    }

    return response.hits.hits.map(hit => ({
      id: hit._source.id,
      title: hit._source.title,
      description: hit._source.description,
      category: hit._source.category,
      category_id: hit._source.category_id,
      budget: hit._source.budget,
      location: hit._source.location,
      main_image_url: hit._source.main_image_url,
      status: hit._source.status,
      created_at: hit._source.created_at,
      updated_at: hit._source.updated_at,
      attributes: hit._source.attributes,
      popularity_score: hit._source.popularity_score,
      user_trust_score: hit._source.user_trust_score,
      search_score: hit._score,
      highlights: hit.highlight
    }));
  }

  getDefaultIndexName(): string {
    return this.defaultIndexName;
  }

  setDefaultIndexName(indexName: string): void {
    this.defaultIndexName = indexName;
  }
}

export default SearchService;
