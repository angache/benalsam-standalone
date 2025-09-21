/**
 * Upload Service Interfaces
 * Test edilebilirlik için abstraction layer
 */

export interface UploadRequest {
  files: Express.Multer.File[];
  userId: string;
  listingId?: string;
  inventoryId?: string;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  success: boolean;
  data?: {
    uploadedFiles: UploadedFile[];
    totalSize: number;
    totalFiles: number;
  };
  error?: string;
  quotaInfo?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  format: string;
  publicId: string;
  folder: string;
  uploadedAt: string;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  data: any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  progress?: JobProgress | undefined;
}

export enum JobType {
  IMAGE_UPLOAD_REQUESTED = 'IMAGE_UPLOAD_REQUESTED',
  IMAGE_UPLOAD_PROCESSING = 'IMAGE_UPLOAD_PROCESSING',
  IMAGE_UPLOAD_COMPLETED = 'IMAGE_UPLOAD_COMPLETED',
  IMAGE_UPLOAD_FAILED = 'IMAGE_UPLOAD_FAILED',
  IMAGE_RESIZE = 'IMAGE_RESIZE',
  THUMBNAIL_GENERATE = 'THUMBNAIL_GENERATE',
  METADATA_EXTRACT = 'METADATA_EXTRACT',
  VIRUS_SCAN = 'VIRUS_SCAN',
  DATABASE_UPDATE = 'DATABASE_UPDATE',
  NOTIFICATION_SEND = 'NOTIFICATION_SEND',
  CLEANUP_TEMP_FILES = 'CLEANUP_TEMP_FILES'
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled'
}

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface JobProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
}

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

export interface ICloudinaryService {
  uploadImage(file: Express.Multer.File, folder: string): Promise<UploadedFile>;
  deleteImage(publicId: string): Promise<void>;
  getImageInfo(publicId: string): Promise<any>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface IQuotaService {
  checkQuota(userId: string, fileSize: number): Promise<{ allowed: boolean; quota: any }>;
  updateQuota(userId: string, fileSize: number): Promise<void>;
  getQuota(userId: string): Promise<any>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface IJobProcessorService {
  createJob(jobData: Partial<Job>): Promise<Job>;
  processJob(jobId: string): Promise<void>;
  getJob(jobId: string): Promise<Job | null>;
  getJobMetrics(): Promise<JobMetrics>;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface IRabbitMQService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publishMessage(queueName: string, message: any): Promise<void>;
  consumeMessages(queueName: string, handler: (message: any) => Promise<void>): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface IUploadService {
  uploadFiles(request: UploadRequest): Promise<UploadResult>;
  getJobStatus(jobId: string): Promise<Job | null>;
  getJobMetrics(): Promise<JobMetrics>;
  cancelJob(jobId: string): Promise<void>;
  healthCheck(): Promise<{
    status: string;
    cloudinary: { status: string; responseTime: number };
    quota: { status: string; responseTime: number };
    jobProcessor: { status: string; responseTime: number };
    rabbitmq: { status: string; responseTime: number };
  }>;
}
