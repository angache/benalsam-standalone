import { toast } from '@/components/ui/use-toast';
import { 
  CreateListingRequest, 
  CreateListingResponse, 
  JobStatusResponse, 
  JobDetailsResponse, 
  HealthCheckResponse 
} from '@/types/listing';
import { 
  ServiceError, 
  NetworkError, 
  ErrorCode 
} from '@/types/errors';

// Listing Service API Client
class ListingServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || 'http://localhost:3008/api/v1';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    userId?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Listing Service API Error:', error);
      throw error;
    }
  }

  // Create a new listing
  async createListing(listingData: CreateListingRequest, userId: string): Promise<CreateListingResponse> {
    return this.makeRequest<CreateListingResponse>('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    }, userId);
  }

  // Get job status
  async getJobStatus(jobId: string, userId: string): Promise<JobStatusResponse> {
    return this.makeRequest<JobStatusResponse>(`/jobs/${jobId}/status`, {
      method: 'GET',
    }, userId);
  }

  // Get job details
  async getJob(jobId: string, userId: string): Promise<JobDetailsResponse> {
    return this.makeRequest<JobDetailsResponse>(`/jobs/${jobId}`, {
      method: 'GET',
    }, userId);
  }

  // Cancel a job
  async cancelJob(jobId: string, userId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/jobs/${jobId}/cancel`, {
      method: 'POST',
    }, userId);
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.makeRequest<HealthCheckResponse>('/health', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const listingServiceClient = new ListingServiceClient();

// Helper function to poll job status
export const pollJobStatus = async (
  jobId: string, 
  userId: string, 
  onProgress?: (progress: number) => void,
  onComplete?: (result: unknown) => void,
  onError?: (error: string) => void,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<unknown> => {
  let attempts = 0;

  const poll = async (): Promise<unknown> => {
    attempts++;
    
    try {
      const response = await listingServiceClient.getJobStatus(jobId, userId);
      
      // Extract data from response
      const status = response.data || response;
      
      if (onProgress && status.progress !== undefined) {
        onProgress(status.progress);
      }

      if (status.status === 'completed') {
        if (onComplete) {
          onComplete(status.result);
        }
        return status.result;
      }

      if (status.status === 'failed') {
        const error = status.error || 'Job failed';
        if (onError) {
          onError(error);
        }
        throw new Error(error);
      }

      if (attempts >= maxAttempts) {
        const error = 'Job timeout - maximum attempts reached';
        if (onError) {
          onError(error);
        }
        throw new Error(error);
      }

      // Continue polling
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      return poll();
      
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  };

  return poll();
};
