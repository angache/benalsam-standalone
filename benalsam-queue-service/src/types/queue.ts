// import { Job } from 'bull'; // Unused import

// Job Types
export enum JobType {
  ELASTICSEARCH_SYNC = 'elasticsearch-sync',
  EMAIL_NOTIFICATION = 'email-notification',
  DATA_EXPORT = 'data-export',
  IMAGE_PROCESSING = 'image-processing',
  ANALYTICS = 'analytics',
}

// Job Operations
export enum JobOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

// Job Status
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  ACTIVE = 'active',
  WAITING = 'waiting',
  PAUSED = 'paused',
}

// Elasticsearch Sync Job Data
export interface ElasticsearchSyncJobData {
  tableName: string;
  operation: JobOperation;
  recordId: string;
  changeData: any;
  userId?: string;
  timestamp: string;
}

// Email Notification Job Data
export interface EmailNotificationJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

// Data Export Job Data
export interface DataExportJobData {
  userId: string;
  exportType: 'csv' | 'json' | 'excel' | 'pdf';
  dataType: string;
  filters?: Record<string, any>;
  schedule?: string;
}

// Image Processing Job Data
export interface ImageProcessingJobData {
  imageUrl: string;
  operations: string[];
  outputFormat?: string;
  quality?: number;
}

// Analytics Job Data
export interface AnalyticsJobData {
  eventType: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: string;
}

// Job Response
export interface JobResponse {
  id: string;
  type: JobType;
  status: JobStatus;
  data: any;
  progress?: number;
  createdAt: string;
  processedAt?: string | undefined;
  error?: string | undefined;
  attempts?: number;
  delay?: number;
  priority?: number | undefined;
}

// Queue Stats
export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  delayed: number;
  active: number;
  waiting: number;
  paused: number;
  avgProcessingTime: number;
  lastProcessedAt?: string;
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  redis: {
    connected: boolean;
    latency?: number;
  };
  queues: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      stats: QueueStats;
    };
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Job Creation Request
export interface CreateJobRequest {
  type: JobType;
  data: any;
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

// Job Update Request
export interface UpdateJobRequest {
  priority?: number;
  delay?: number;
  attempts?: number;
}

// Queue Configuration
export interface QueueConfig {
  name: string;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
  removeOnComplete: boolean | number;
  removeOnFail: boolean | number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}
