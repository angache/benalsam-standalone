import { toast } from '@/components/ui/use-toast';

// Listing Service API Client
class ListingServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_LISTING_SERVICE_URL || 'http://localhost:3008/api/v1';
    console.log('🔗 Listing Service URL:', this.baseUrl);
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
  async createListing(listingData: any, userId: string): Promise<{ jobId: string }> {
    return this.makeRequest<{ jobId: string }>('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    }, userId);
  }

  // Get job status
  async getJobStatus(jobId: string, userId: string): Promise<{
    status: string;
    progress: number;
    result?: any;
    error?: string;
  }> {
    return this.makeRequest<{
      status: string;
      progress: number;
      result?: any;
      error?: string;
    }>(`/jobs/${jobId}/status`, {
      method: 'GET',
    }, userId);
  }

  // Get job details
  async getJob(jobId: string, userId: string): Promise<any> {
    return this.makeRequest<any>(`/jobs/${jobId}`, {
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
  async healthCheck(): Promise<{ status: string; details: any }> {
    return this.makeRequest<{ status: string; details: any }>('/health', {
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
  onComplete?: (result: any) => void,
  onError?: (error: string) => void,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<any> => {
  let attempts = 0;

  const poll = async (): Promise<any> => {
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
