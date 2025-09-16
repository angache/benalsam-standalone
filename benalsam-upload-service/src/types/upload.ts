/**
 * Upload Service Type Definitions
 * 
 * @fileoverview Comprehensive type definitions for the Upload Service
 * @author Benalsam Team
 * @version 1.0.0
 */

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
  };
  headers: {
    'x-user-id'?: string;
    [key: string]: string | undefined;
  };
  files?: Express.Multer.File[];
  file?: Express.Multer.File;
  params: {
    id?: string;
    [key: string]: string | undefined;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    images?: ImageResult[];
    image?: ImageResult;
    count?: number;
    quota?: UserQuota;
  };
  error?: string;
}

export interface ImageResult {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
  mediumUrl?: string;
}

export interface UserQuota {
  userId: string;
  uploadsUsed: number;
  uploadsLimit: number;
  storageUsed: number;
  storageLimit: number;
  resetDate: Date;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export type UploadType = 'listings' | 'inventory' | 'profile';

export interface UploadRequest {
  userId: string;
  files: Express.Multer.File[];
  type: UploadType;
  metadata?: UploadMetadata;
}

export interface UploadMetadata {
  listingId?: string;
  inventoryId?: string;
  tags?: string[];
  folder?: string;
  transformations?: CloudinaryTransformation[];
}

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
}

// ============================================================================
// QUOTA TYPES
// ============================================================================

export interface QuotaCheck {
  allowed: boolean;
  message?: string;
  quota: UserQuota;
}

export interface QuotaUpdate {
  userId: string;
  uploadsUsed: number;
  storageUsed: number;
  lastUpdated: Date;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export class ValidationError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class QuotaExceededError extends UploadError {
  constructor(message: string, quota: any) {
    super(message, 'QUOTA_EXCEEDED', 429, { quota });
    this.name = 'QuotaExceededError';
  }
}

export class CloudinaryError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'CLOUDINARY_ERROR', 502, details);
    this.name = 'CloudinaryError';
  }
}

export class FileProcessingError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'FILE_PROCESSING_ERROR', 422, details);
    this.name = 'FileProcessingError';
  }
}

// ============================================================================
// JOB TYPES (for future implementation)
// ============================================================================

export interface UploadJob {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  userId: string;
  files: FileInfo[];
  metadata: UploadMetadata;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export type JobType = 
  | 'IMAGE_UPLOAD_REQUESTED'
  | 'IMAGE_UPLOAD_PROCESSING'
  | 'IMAGE_UPLOAD_COMPLETED'
  | 'IMAGE_UPLOAD_FAILED'
  | 'IMAGE_RESIZE'
  | 'THUMBNAIL_GENERATE'
  | 'METADATA_EXTRACT'
  | 'VIRUS_SCAN';

export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

export interface FileInfo {
  originalName: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  path?: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface UploadConfig {
  maxFileSize: number;
  maxFilesPerRequest: number;
  allowedMimeTypes: string[];
  tempDir: string;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  };
  quota: {
    maxUploads: number;
    maxStorage: number;
    resetPeriod: number;
  };
  retry: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface UploadEvent {
  type: string;
  userId: string;
  timestamp: string;
  data: any;
  metadata?: {
    traceId?: string;
    correlationId?: string;
    source?: string;
  };
}

export interface ImageUploadEvent extends UploadEvent {
  type: 'upload.listing.images' | 'upload.inventory.images' | 'upload.profile.image';
  data: {
    images: ImageResult[];
    count: number;
  };
}

export interface ImageDeleteEvent extends UploadEvent {
  type: 'upload.image.deleted';
  data: {
    imageId: string;
  };
}
