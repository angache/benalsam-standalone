// ===========================
// ELASTICSEARCH DASHBOARD TYPES
// ===========================

export interface HealthStatus {
  elasticsearch: boolean;
  redis: boolean;
  indexer: boolean;
  syncService: boolean;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  totalSynced: number;
  errors: string[];
  progress: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export interface IndexerStats {
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  avgProcessingTime: number;
  lastProcessedAt: string | null;
  isRunning: boolean;
}

export interface ElasticsearchIndex {
  name: string;
  health: string;
  status: string;
  docs_count: number;
  store_size: string;
  primary_shards: number;
  replica_shards: number;
}

export interface ElasticsearchDocument {
  _id: string;
  _source: any;
  _index: string;
  _type?: string;
  _score?: number;
}

export interface FormattedDocument {
  timestamp: string;
  eventType: string;
  sessionId: string;
  device: string;
  user?: string;
  avatar?: string;
  session?: string;
  details: any;
}

export interface ElasticsearchData {
  healthStatus: HealthStatus;
  syncStatus: SyncStatus;
  queueStats: QueueStats;
  indexerStats: IndexerStats;
  elasticsearchIndexes: ElasticsearchIndex[];
  indexDocuments: ElasticsearchDocument[];
}

export interface ElasticsearchLoadingStates {
  health: boolean;
  sync: boolean;
  queue: boolean;
  indexer: boolean;
  indexes: boolean;
  documents: boolean;
}

export interface ElasticsearchErrorStates {
  health: string | null;
  sync: string | null;
  queue: string | null;
  indexer: string | null;
  indexes: string | null;
  documents: string | null;
}

export interface HealthStatusProps {
  healthStatus: HealthStatus;
  isLoading: boolean;
  error: string | null;
}

export interface SyncStatusProps {
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;
  onStartSync: () => void;
  onStopSync: () => void;
}

export interface QueueStatsProps {
  queueStats: QueueStats;
  isLoading: boolean;
  error: string | null;
}

export interface IndexerStatsProps {
  indexerStats: IndexerStats;
  isLoading: boolean;
  error: string | null;
  onStartIndexer: () => void;
  onStopIndexer: () => void;
}

export interface IndexListProps {
  indexes: ElasticsearchIndex[];
  selectedIndex: string;
  expandedIndex: string | null;
  isLoading: boolean;
  error: string | null;
  onIndexSelect: (indexName: string) => void;
  onIndexExpand: (indexName: string) => void;
  onRefreshIndexes: () => void;
}

export interface DocumentListProps {
  documents: ElasticsearchDocument[];
  selectedIndex: string;
  isLoading: boolean;
  error: string | null;
  onDocumentSelect: (document: ElasticsearchDocument) => void;
  onRefreshDocuments: () => void;
}

export interface ElasticsearchActions {
  onRefreshHealth: () => void;
  onStartSync: () => void;
  onStopSync: () => void;
  onStartIndexer: () => void;
  onStopIndexer: () => void;
  onRefreshIndexes: () => void;
  onRefreshDocuments: () => void;
  onIndexSelect: (indexName: string) => void;
  onDocumentSelect: (document: ElasticsearchDocument) => void;
}

export interface FormatterConfig {
  indexName: string;
  source: any;
}

export interface EventDetails {
  screen?: string;
  timeSpent?: string;
  scrollDepth?: string;
  element?: string;
  action?: string;
  metric?: string;
  value?: any;
  unit?: string;
  error?: string;
  stack?: string;
  title?: string;
  category?: string;
  budget?: string;
  location?: string;
  urgency?: string;
  status?: string;
  premium?: string;
  popularity?: number;
}
