// Listing Service Types
export interface CreateListingRequest {
  title: string;
  description: string;
  budget: number;
  images: File[];
  category: string;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  acceptTerms: boolean;
  mainImageIndex: number;
  duration?: number;
  autoRepublish?: boolean;
  contactPreference?: 'site_message' | 'phone' | 'both';
  isFeatured?: boolean;
  isUrgentPremium?: boolean;
  isShowcase?: boolean;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  condition?: string[];
  attributes?: Record<string, unknown>;
}

export interface CreateListingResponse {
  success: boolean;
  data: {
    jobId: string;
  };
}

export interface ImageUploadRequest {
  images: File[];
  userId: string;
  type: 'listings' | 'inventory' | 'profile';
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    images: Array<{
      id: string;
      url: string;
      width: number;
      height: number;
      format: string;
      size: number;
      thumbnailUrl?: string;
      mediumUrl?: string;
    }>;
    count: number;
  };
}

export interface JobStatusResponse {
  success: boolean;
  data: {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result: any;
    error: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  };
}

export interface ListingServiceData {
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  acceptTerms: boolean;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  mainImageIndex: number;
  duration?: number;
  autoRepublish?: boolean;
  contactPreference?: 'site_message' | 'phone' | 'both';
  isFeatured?: boolean;
  isUrgentPremium?: boolean;
  isShowcase?: boolean;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  condition?: string[];
  attributes?: Record<string, unknown>;
}

export interface CategoryIds {
  category_id: number | null;
  category_path: number[] | null;
}

export interface ImageFile {
  file: File;
  name?: string;
  uri?: string;
  preview?: string;
  isUploaded?: boolean;
  url?: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface JobStatusCallbacks {
  onProgress?: (progress: number) => void;
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
}

export interface JobDetailsResponse {
  success: boolean;
  data: {
    jobId: string;
    status: string;
    progress: number;
    result?: unknown;
    error?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  };
}

export interface HealthCheckResponse {
  status: string;
  details: {
    service: string;
    version: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
    database: {
      connected: boolean;
      responseTime: number;
    };
  };
}
