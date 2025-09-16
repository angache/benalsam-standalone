/**
 * Job System Type Definitions
 * 
 * @fileoverview Comprehensive job system types for enterprise upload processing
 * @author Benalsam Team
 * @version 1.0.0
 */

// ============================================================================
// JOB TYPES
// ============================================================================

export type JobType = 
  | 'IMAGE_UPLOAD_REQUESTED'
  | 'IMAGE_UPLOAD_PROCESSING'
  | 'IMAGE_UPLOAD_COMPLETED'
  | 'IMAGE_UPLOAD_FAILED'
  | 'IMAGE_RESIZE'
  | 'THUMBNAIL_GENERATE'
  | 'METADATA_EXTRACT'
  | 'VIRUS_SCAN'
  | 'DATABASE_UPDATE'
  | 'NOTIFICATION_SEND'
  | 'CLEANUP_TEMP_FILES';

export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled'
  | 'timeout';

export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

// ============================================================================
// JOB INTERFACES
// ============================================================================

export interface BaseJob {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  userId: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  traceId: string;
  correlationId?: string;
}

export interface UploadJob extends BaseJob {
  type: 'IMAGE_UPLOAD_REQUESTED' | 'IMAGE_UPLOAD_PROCESSING' | 'IMAGE_UPLOAD_COMPLETED' | 'IMAGE_UPLOAD_FAILED';
  payload: {
    files: FileInfo[];
    uploadType: 'listings' | 'inventory' | 'profile';
    metadata?: UploadMetadata;
  };
}

export interface ProcessingJob extends BaseJob {
  type: 'IMAGE_RESIZE' | 'THUMBNAIL_GENERATE' | 'METADATA_EXTRACT' | 'VIRUS_SCAN';
  payload: {
    imageId: string;
    imageUrl: string;
    transformations?: ImageTransformation[];
    scanOptions?: VirusScanOptions;
  };
}

export interface DatabaseJob extends BaseJob {
  type: 'DATABASE_UPDATE';
  payload: {
    operation: 'create' | 'update' | 'delete';
    table: string;
    recordId: string;
    data: any;
  };
}

export interface NotificationJob extends BaseJob {
  type: 'NOTIFICATION_SEND';
  payload: {
    userId: string;
    type: 'upload_success' | 'upload_failed' | 'quota_warning' | 'quota_exceeded';
    message: string;
    data?: any;
  };
}

export interface CleanupJob extends BaseJob {
  type: 'CLEANUP_TEMP_FILES';
  payload: {
    filePaths: string[];
    userId: string;
  };
}

export type Job = UploadJob | ProcessingJob | DatabaseJob | NotificationJob | CleanupJob;

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface FileInfo {
  originalName: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  path?: string;
  tempPath?: string;
}

export interface UploadMetadata {
  listingId?: string;
  inventoryId?: string;
  tags?: string[];
  folder?: string;
  transformations?: ImageTransformation[];
}

export interface ImageTransformation {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  gravity?: string;
}

export interface VirusScanOptions {
  scanType: 'basic' | 'deep';
  quarantineOnThreat: boolean;
  notifyOnThreat: boolean;
}

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

export interface QueueConfig {
  name: string;
  priority: number;
  maxRetries: number;
  retryDelay: number;
  deadLetterExchange: string;
  messageTtl: number;
  maxLength: number;
}

export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  'upload.high-priority': {
    name: 'upload.high-priority',
    priority: 10,
    maxRetries: 5,
    retryDelay: 1000,
    deadLetterExchange: 'upload.dlx',
    messageTtl: 3600000, // 1 hour
    maxLength: 1000
  },
  'upload.normal': {
    name: 'upload.normal',
    priority: 7,
    maxRetries: 3,
    retryDelay: 2000,
    deadLetterExchange: 'upload.dlx',
    messageTtl: 3600000, // 1 hour
    maxLength: 5000
  },
  'upload.batch': {
    name: 'upload.batch',
    priority: 5,
    maxRetries: 2,
    retryDelay: 5000,
    deadLetterExchange: 'upload.dlx',
    messageTtl: 7200000, // 2 hours
    maxLength: 10000
  },
  'processing.images': {
    name: 'processing.images',
    priority: 7,
    maxRetries: 3,
    retryDelay: 3000,
    deadLetterExchange: 'processing.dlx',
    messageTtl: 1800000, // 30 minutes
    maxLength: 2000
  },
  'notifications': {
    name: 'notifications',
    priority: 5,
    maxRetries: 2,
    retryDelay: 10000,
    deadLetterExchange: 'notifications.dlx',
    messageTtl: 1800000, // 30 minutes
    maxLength: 10000
  }
};

// ============================================================================
// JOB RESULT TYPES
// ============================================================================

export interface JobResult {
  success: boolean;
  jobId: string;
  result?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface UploadResult {
  jobId: string;
  imageId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
  mediumUrl?: string;
  metadata?: any;
}

export interface ProcessingResult {
  jobId: string;
  imageId: string;
  processedImages: ProcessedImage[];
  metadata?: any;
}

export interface ProcessedImage {
  type: 'thumbnail' | 'medium' | 'large' | 'original';
  url: string;
  width: number;
  height: number;
  size: number;
}

// ============================================================================
// JOB MONITORING TYPES
// ============================================================================

export interface JobMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  retryingJobs: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
}

export interface QueueMetrics {
  queueName: string;
  messageCount: number;
  consumerCount: number;
  processingRate: number;
  errorRate: number;
  averageProcessingTime: number;
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  estimatedTimeRemaining?: number;
  lastUpdate: Date;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class JobError extends Error {
  constructor(
    message: string,
    public jobId: string,
    public jobType: JobType,
    public retryable: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = 'JobError';
  }
}

export class JobTimeoutError extends JobError {
  constructor(jobId: string, jobType: JobType, timeout: number) {
    super(`Job ${jobId} timed out after ${timeout}ms`, jobId, jobType, true, { timeout });
    this.name = 'JobTimeoutError';
  }
}

export class JobValidationError extends JobError {
  constructor(jobId: string, jobType: JobType, validationErrors: string[]) {
    super(`Job ${jobId} validation failed: ${validationErrors.join(', ')}`, jobId, jobType, false, { validationErrors });
    this.name = 'JobValidationError';
  }
}

export class JobProcessingError extends JobError {
  constructor(jobId: string, jobType: JobType, processingError: string, details?: any) {
    super(`Job ${jobId} processing failed: ${processingError}`, jobId, jobType, true, details);
    this.name = 'JobProcessingError';
  }
}
