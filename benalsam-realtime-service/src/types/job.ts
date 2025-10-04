/**
 * Enterprise Job Tracking Interface
 * Firebase Realtime Database için gelişmiş job tracking
 */

export interface EnterpriseJobData {
  // Basic Job Info
  id: string;
  type: 'status_change' | 'listing_change' | 'bulk_operation' | 'system_maintenance';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying' | 'cancelled';
  
  // Business Data
  listingId?: string;
  listingStatus?: string;
  userId?: string;
  
  // Timestamps
  timestamp: string;           // Job creation time
  queuedAt?: string;          // When job was queued
  processedAt?: string;       // When processing started
  completedAt?: string;       // When job completed
  failedAt?: string;          // When job failed
  
  // Retry Logic
  maxRetries: number;
  retryCount: number;
  retryAfter?: string;        // When to retry (for exponential backoff)
  
  // Source & Context
  source: 'supabase' | 'firebase_realtime' | 'api' | 'system' | 'manual';
  serviceName?: string;       // Which service created this job
  version?: string;           // Service version
  environment?: string;       // dev/staging/production
  
  // Performance Tracking
  processingDuration?: number; // Milliseconds
  queueWaitTime?: number;     // Milliseconds
  totalDuration?: number;     // Milliseconds
  
  // Error Handling
  errorMessage?: string;
  errorCode?: string;
  errorStack?: string;
  lastErrorAt?: string;
  
  // Compliance & Audit
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;     // For tracing across services
  
  // Job Relationships
  parentJobId?: string;       // For job chains
  childJobIds?: string[];     // For parallel processing
  dependsOn?: string[];       // Job dependencies
  
  // Metadata
  metadata?: {
    [key: string]: any;
  };
  
  // Security (removed plain text secrets)
  // authSecret removed for security
}

export interface JobMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface JobFilter {
  status?: string[];
  type?: string[];
  source?: string[];
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}