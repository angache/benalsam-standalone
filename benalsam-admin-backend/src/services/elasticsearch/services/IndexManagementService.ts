// ===========================
// INDEX MANAGEMENT SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import logger from '../../config/logger';
import { IndexMapping, IndexInfo } from '../types';
import { getListingsIndexMapping, getUserBehaviorsIndexMapping, getAISuggestionsIndexMapping } from '../utils/mappingBuilder';

class IndexManagementService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async createIndex(indexName: string, mapping?: IndexMapping): Promise<boolean> {
    try {
      logger.info(`📝 Creating index: ${indexName}`);

      const indexMapping = mapping || this.getDefaultMapping(indexName);
      
      await this.client.indices.create({
        index: indexName,
        body: indexMapping
      });

      logger.info(`✅ Index created successfully: ${indexName}`);
      return true;

    } catch (error: any) {
      if (error.message.includes('resource_already_exists_exception')) {
        logger.info(`ℹ️ Index already exists: ${indexName}`);
        return true;
      }
      
      logger.error(`❌ Error creating index ${indexName}:`, error);
      return false;
    }
  }

  async deleteIndex(indexName: string): Promise<boolean> {
    try {
      logger.info(`🗑️ Deleting index: ${indexName}`);

      await this.client.indices.delete({
        index: indexName
      });

      logger.info(`✅ Index deleted successfully: ${indexName}`);
      return true;

    } catch (error: any) {
      if (error.message.includes('index_not_found_exception')) {
        logger.info(`ℹ️ Index not found: ${indexName}`);
        return true;
      }
      
      logger.error(`❌ Error deleting index ${indexName}:`, error);
      return false;
    }
  }

  async indexExists(indexName: string): Promise<boolean> {
    try {
      const response = await this.client.indices.exists({
        index: indexName
      });
      
      return response.body;
    } catch (error) {
      logger.error(`❌ Error checking index existence ${indexName}:`, error);
      return false;
    }
  }

  async getIndexMapping(indexName: string): Promise<any> {
    try {
      const response = await this.client.indices.getMapping({
        index: indexName
      });
      
      return response.body[indexName]?.mappings;
    } catch (error) {
      logger.error(`❌ Error getting index mapping ${indexName}:`, error);
      return null;
    }
  }

  async updateIndexMapping(indexName: string, mapping: any): Promise<boolean> {
    try {
      logger.info(`📝 Updating index mapping: ${indexName}`);

      await this.client.indices.putMapping({
        index: indexName,
        body: mapping
      });

      logger.info(`✅ Index mapping updated successfully: ${indexName}`);
      return true;

    } catch (error) {
      logger.error(`❌ Error updating index mapping ${indexName}:`, error);
      return false;
    }
  }

  async getIndicesInfo(): Promise<IndexInfo[]> {
    try {
      const response = await this.client.cat.indices({
        format: 'json',
        v: true
      });

      return response.body.map((index: any) => ({
        name: index.index,
        health: index.health,
        status: index.status,
        docsCount: parseInt(index['docs.count']),
        sizeInBytes: parseInt(index['store.size']),
        primaryShards: parseInt(index['pri']),
        replicaShards: parseInt(index['rep'])
      }));

    } catch (error) {
      logger.error('❌ Error getting indices info:', error);
      return [];
    }
  }

  async refreshIndex(indexName: string): Promise<boolean> {
    try {
      await this.client.indices.refresh({
        index: indexName
      });
      
      logger.info(`✅ Index refreshed: ${indexName}`);
      return true;

    } catch (error) {
      logger.error(`❌ Error refreshing index ${indexName}:`, error);
      return false;
    }
  }

  async flushIndex(indexName: string): Promise<boolean> {
    try {
      await this.client.indices.flush({
        index: indexName
      });
      
      logger.info(`✅ Index flushed: ${indexName}`);
      return true;

    } catch (error) {
      logger.error(`❌ Error flushing index ${indexName}:`, error);
      return false;
    }
  }

  async optimizeIndex(indexName: string): Promise<boolean> {
    try {
      await this.client.indices.forcemerge({
        index: indexName
      });
      
      logger.info(`✅ Index optimized: ${indexName}`);
      return true;

    } catch (error) {
      logger.error(`❌ Error optimizing index ${indexName}:`, error);
      return false;
    }
  }

  async getIndexStats(indexName?: string): Promise<any> {
    try {
      const response = await this.client.indices.stats({
        index: indexName
      });
      
      return response.body;
    } catch (error) {
      logger.error('❌ Error getting index stats:', error);
      return null;
    }
  }

  private getDefaultMapping(indexName: string): IndexMapping {
    switch (indexName) {
      case 'listings':
        return getListingsIndexMapping();
      case 'user_behaviors':
        return getUserBehaviorsIndexMapping();
      case 'ai_suggestions':
        return getAISuggestionsIndexMapping();
      default:
        return getListingsIndexMapping();
    }
  }

  async createAllIndices(): Promise<{ [indexName: string]: boolean }> {
    const indices = ['listings', 'user_behaviors', 'ai_suggestions'];
    const results: { [indexName: string]: boolean } = {};

    for (const indexName of indices) {
      results[indexName] = await this.createIndex(indexName);
    }

    return results;
  }

  async deleteAllIndices(): Promise<{ [indexName: string]: boolean }> {
    const indices = ['listings', 'user_behaviors', 'ai_suggestions'];
    const results: { [indexName: string]: boolean } = {};

    for (const indexName of indices) {
      results[indexName] = await this.deleteIndex(indexName);
    }

    return results;
  }
}

export default IndexManagementService;
