// ===========================
// ELASTICSEARCH SERVICE TYPES
// ===========================

import { Client } from '@elastic/elasticsearch';
import { SearchOptimizedListing } from 'benalsam-shared-types';

export interface ElasticsearchConfig {
  node: string;
  username?: string;
  password?: string;
  defaultIndexName: string;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

export interface IndexMapping {
  settings: {
    analysis: {
      analyzer: {
        [key: string]: {
          type: string;
        };
      };
    };
    number_of_shards: number;
    number_of_replicas: number;
  };
  mappings: {
    properties: {
      [key: string]: any;
    };
  };
}

export interface SearchQuery {
  query?: any;
  size?: number;
  from?: number;
  sort?: any[];
  aggs?: any;
  highlight?: any;
  source?: string[] | boolean;
}

export interface SearchResponse<T = any> {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: Array<{
      _index: string;
      _id: string;
      _score: number;
      _source: T;
    }>;
  };
  aggregations?: any;
}

export interface HealthStatus {
  status: 'green' | 'yellow' | 'red';
  cluster_name: string;
  number_of_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

export interface IndexStats {
  indices: {
    [indexName: string]: {
      total: {
        docs: {
          count: number;
          deleted: number;
        };
        store: {
          size_in_bytes: number;
        };
        indexing: {
          index_total: number;
          index_time_in_millis: number;
        };
        search: {
          query_total: number;
          query_time_in_millis: number;
        };
      };
    };
  };
}

export interface SyncOptions {
  batchSize?: number;
  force?: boolean;
  categories?: number[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SyncResult {
  success: boolean;
  totalProcessed: number;
  totalSynced: number;
  totalFailed: number;
  errors: string[];
  duration: number;
}

export interface SearchOptimizationOptions {
  useCache?: boolean;
  cacheTTL?: number;
  useFuzzySearch?: boolean;
  boostFields?: {
    [field: string]: number;
  };
  filters?: {
    [field: string]: any;
  };
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: Date;
  error?: string;
  latency?: number;
}

export interface IndexInfo {
  name: string;
  health: string;
  status: string;
  docsCount: number;
  sizeInBytes: number;
  primaryShards: number;
  replicaShards: number;
}

export interface BulkOperation {
  index?: {
    _index: string;
    _id: string;
  };
  create?: {
    _index: string;
    _id: string;
  };
  update?: {
    _index: string;
    _id: string;
  };
  delete?: {
    _index: string;
    _id: string;
  };
  doc?: any;
  doc_as_upsert?: boolean;
}

export interface BulkResponse {
  took: number;
  errors: boolean;
  items: Array<{
    index?: {
      _index: string;
      _id: string;
      status: number;
      error?: any;
    };
    create?: {
      _index: string;
      _id: string;
      status: number;
      error?: any;
    };
    update?: {
      _index: string;
      _id: string;
      status: number;
      error?: any;
    };
    delete?: {
      _index: string;
      _id: string;
      status: number;
      error?: any;
    };
  }>;
}

export interface ElasticsearchServiceInterface {
  // Connection management
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;

  // Index management
  createIndex(indexName: string, mapping?: IndexMapping): Promise<boolean>;
  deleteIndex(indexName: string): Promise<boolean>;
  indexExists(indexName: string): Promise<boolean>;
  getIndexMapping(indexName: string): Promise<any>;
  updateIndexMapping(indexName: string, mapping: any): Promise<boolean>;

  // Search operations
  search<T = any>(query: SearchQuery, indexName?: string): Promise<SearchResponse<T>>;
  searchOptimized(query: string, options?: SearchOptimizationOptions): Promise<SearchOptimizedListing[]>;
  searchIndexStatic(indexName: string, options?: { size?: number }): Promise<any>;

  // Document operations
  indexDocument(indexName: string, document: any, id?: string): Promise<boolean>;
  updateDocument(indexName: string, id: string, document: any): Promise<boolean>;
  deleteDocument(indexName: string, id: string): Promise<boolean>;
  bulkIndex(documents: Array<{ index: string; document: any; id?: string }>): Promise<BulkResponse>;

  // Health and monitoring
  healthCheck(): Promise<HealthStatus>;
  getIndexStats(indexName?: string): Promise<IndexStats>;
  getAllIndicesStats(): Promise<any>;
  getIndicesInfo(): Promise<IndexInfo[]>;

  // Data synchronization
  syncListingsToElasticsearch(options?: SyncOptions): Promise<SyncResult>;
  syncUserBehaviorsToElasticsearch(options?: SyncOptions): Promise<SyncResult>;
  syncAISuggestionsToElasticsearch(options?: SyncOptions): Promise<SyncResult>;

  // Utility methods
  getClient(): Client;
  getDefaultIndexName(): string;
  setDefaultIndexName(indexName: string): void;
}
