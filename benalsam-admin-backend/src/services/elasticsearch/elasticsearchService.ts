// ===========================
// MAIN ELASTICSEARCH SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import logger from '../../config/logger';
import { SearchOptimizedListing } from 'benalsam-shared-types';

// Services
import IndexManagementService from './services/IndexManagementService';
import SearchService from './services/SearchService';
import HealthMonitoringService from './services/HealthMonitoringService';
import DataSyncService from './services/DataSyncService';

// Utils
import { ConnectionManager } from './utils/connectionManager';
import { buildSearchQuery } from './utils/queryBuilder';

// Types
import { 
  ElasticsearchConfig, 
  SearchQuery, 
  SearchResponse, 
  SearchOptimizationOptions,
  SyncOptions,
  SyncResult,
  HealthStatus,
  IndexStats,
  IndexInfo,
  BulkResponse
} from './types';

export class AdminElasticsearchService {
  private connectionManager: ConnectionManager;
  private indexManagementService: IndexManagementService;
  private searchService: SearchService;
  private healthMonitoringService: HealthMonitoringService;
  private dataSyncService: DataSyncService;
  private defaultIndexName: string;

  constructor(
    node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
    defaultIndexName: string = 'listings',
    username: string = process.env.ELASTICSEARCH_USERNAME || '',
    password: string = process.env.ELASTICSEARCH_PASSWORD || ''
  ) {
    const config: ElasticsearchConfig = {
      node,
      username,
      password,
      defaultIndexName,
      tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    };

    this.defaultIndexName = defaultIndexName;
    this.connectionManager = new ConnectionManager(config);
    
    // Initialize services
    this.indexManagementService = new IndexManagementService(this.connectionManager.getClient());
    this.searchService = new SearchService(this.connectionManager.getClient(), defaultIndexName);
    this.healthMonitoringService = new HealthMonitoringService(this.connectionManager.getClient());
    this.dataSyncService = new DataSyncService(this.connectionManager.getClient());
  }

  // Connection management
  async connect(): Promise<boolean> {
    return this.connectionManager.connect();
  }

  async disconnect(): Promise<void> {
    return this.connectionManager.disconnect();
  }

  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  getConnectionStatus() {
    return this.connectionManager.getConnectionStatus();
  }

  // Index management
  async createIndex(indexName: string, mapping?: any): Promise<boolean> {
    return this.indexManagementService.createIndex(indexName, mapping);
  }

  async deleteIndex(indexName: string): Promise<boolean> {
    return this.indexManagementService.deleteIndex(indexName);
  }

  async indexExists(indexName: string): Promise<boolean> {
    return this.indexManagementService.indexExists(indexName);
  }

  async getIndexMapping(indexName: string): Promise<any> {
    return this.indexManagementService.getIndexMapping(indexName);
  }

  async updateIndexMapping(indexName: string, mapping: any): Promise<boolean> {
    return this.indexManagementService.updateIndexMapping(indexName, mapping);
  }

  // Search operations
  async search<T = any>(query: SearchQuery, indexName?: string): Promise<SearchResponse<T>> {
    return this.searchService.search(query, indexName);
  }

  async searchOptimized(query: string, options?: SearchOptimizationOptions): Promise<SearchOptimizedListing[]> {
    return this.searchService.searchOptimized(query, options);
  }

  async searchIndexStatic(indexName: string, options?: { size?: number }): Promise<any> {
    return this.searchService.searchIndexStatic(indexName, options);
  }

  // Document operations
  async indexDocument(indexName: string, document: any, id?: string): Promise<boolean> {
    return this.searchService.indexDocument(indexName, document, id);
  }

  async updateDocument(indexName: string, id: string, document: any): Promise<boolean> {
    return this.searchService.updateDocument(indexName, id, document);
  }

  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    return this.searchService.deleteDocument(indexName, id);
  }

  async bulkIndex(documents: Array<{ index: string; document: any; id?: string }>): Promise<BulkResponse> {
    return this.searchService.bulkIndex(documents);
  }

  // Health and monitoring
  async healthCheck(): Promise<HealthStatus> {
    return this.healthMonitoringService.healthCheck();
  }

  async getIndexStats(indexName?: string): Promise<IndexStats> {
    return this.healthMonitoringService.getIndexStats(indexName);
  }

  async getAllIndicesStats(): Promise<any> {
    return this.healthMonitoringService.getAllIndicesStats();
  }

  async getIndicesInfo(): Promise<IndexInfo[]> {
    return this.indexManagementService.getIndicesInfo();
  }

  // Data synchronization
  async syncListingsToElasticsearch(options?: SyncOptions): Promise<SyncResult> {
    return this.dataSyncService.syncListingsToElasticsearch(options);
  }

  async syncUserBehaviorsToElasticsearch(options?: SyncOptions): Promise<SyncResult> {
    return this.dataSyncService.syncUserBehaviorsToElasticsearch(options);
  }

  async syncAISuggestionsToElasticsearch(options?: SyncOptions): Promise<SyncResult> {
    return this.dataSyncService.syncAISuggestionsToElasticsearch(options);
  }

  // Utility methods
  getClient(): Client {
    return this.connectionManager.getClient();
  }

  getDefaultIndexName(): string {
    return this.defaultIndexName;
  }

  setDefaultIndexName(indexName: string): void {
    this.defaultIndexName = indexName;
    this.searchService.setDefaultIndexName(indexName);
  }

  // Static methods for backward compatibility
  static async getAllIndicesStats(): Promise<any> {
    const client = new Client({ 
      node: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      } : undefined,
      tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    try {
      const response = await client.indices.stats();
      return response.body;
    } catch (error) {
      logger.error('Error getting indices stats:', error);
      throw error;
    }
  }

  static async searchIndexStatic(indexName: string, options: { size?: number } = {}): Promise<any> {
    const client = new Client({ 
      node: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      } : undefined,
      tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    try {
      const response = await client.search({
        index: indexName,
        body: {
          query: { match_all: {} },
          size: options.size || 10
        }
      });
      return response.body;
    } catch (error) {
      logger.error('Error in static search:', error);
      throw error;
    }
  }
}

export default AdminElasticsearchService;
