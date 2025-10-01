/**
 * Firebase Job Types
 * Job lifecycle ve status tracking için type tanımları
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type JobType = 
  | 'status_change' 
  | 'image_processing' 
  | 'search_indexing' 
  | 'push_notification' 
  | 'analytics';

export interface FirebaseJob {
  // Core fields
  id: string;
  listingId: string;
  type: JobType;
  status: JobStatus;
  
  // Timestamps
  timestamp: string;         // Job creation time
  processedAt?: string;      // When job was processed
  queuedAt?: string;         // When job was queued to RabbitMQ
  completedAt?: string;      // When job completed successfully
  failedAt?: string;         // When job failed
  
  // Source & metadata
  source: 'supabase' | 'firebase_realtime' | 'admin' | 'system' | 'direct_test';
  authSecret: string;        // Firebase Rules validation
  
  // Retry & error handling
  retryCount?: number;       // Number of retry attempts
  maxRetries?: number;       // Maximum retry attempts (default: 3)
  error?: string;            // Error message if failed
  
  // Additional data
  data?: Record<string, any>; // Additional job-specific data
}

export interface JobProcessingResult {
  success: boolean;
  jobId: string;
  error?: string;
  processedAt: string;
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

