import { toast } from '@/components/ui/use-toast';

// Upload Service API Client
class UploadServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_UPLOAD_SERVICE_URL || 'http://localhost:3007/api/v1';
    console.log('🔗 Upload Service URL:', this.baseUrl);
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    userId?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
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
      console.error('Upload Service API Error:', error);
      throw error;
    }
  }

  // Upload images for listings
  async uploadListingImages(images: File[], userId: string): Promise<{
    uploadId: string;
    images: Array<{
      id: string;
      url: string;
      thumbnailUrl: string;
      mediumUrl: string;
      size: number;
      width: number;
      height: number;
      format: string;
    }>;
    quota: {
      used: number;
      limit: number;
      remaining: number;
    };
    expiresAt: string;
  }> {
    const formData = new FormData();
    
    // Add images to form data
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    return this.makeRequest<{
      uploadId: string;
      images: Array<{
        id: string;
        url: string;
        thumbnailUrl: string;
        mediumUrl: string;
        size: number;
        width: number;
        height: number;
        format: string;
      }>;
      quota: {
        used: number;
        limit: number;
        remaining: number;
      };
      expiresAt: string;
    }>('/upload/listings', {
      method: 'POST',
      body: formData,
    }, userId);
  }

  // Upload single image
  async uploadSingleImage(image: File, userId: string): Promise<{
    id: string;
    url: string;
    thumbnailUrl: string;
    mediumUrl: string;
    size: number;
    width: number;
    height: number;
    format: string;
  }> {
    const formData = new FormData();
    formData.append('image', image);

    return this.makeRequest<{
      id: string;
      url: string;
      thumbnailUrl: string;
      mediumUrl: string;
      size: number;
      width: number;
      height: number;
      format: string;
    }>('/upload/single', {
      method: 'POST',
      body: formData,
    }, userId);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: unknown }> {
    return this.makeRequest<{ status: string; details: unknown }>('/health', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const uploadServiceClient = new UploadServiceClient();

// Helper function to upload images with progress tracking
export const uploadImagesWithProgress = async (
  images: File[],
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{
  uploadId: string;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    mediumUrl: string;
    size: number;
    width: number;
    height: number;
    format: string;
  }>;
  quota: {
    used: number;
    limit: number;
    remaining: number;
  };
  expiresAt: string;
}> => {
  try {
    if (onProgress) {
      onProgress(0);
    }

    console.log('📤 Uploading images to Upload Service...', { count: images.length });

    const result = await uploadServiceClient.uploadListingImages(images, userId);

    if (onProgress) {
      onProgress(100);
    }

    console.log('✅ Images uploaded successfully:', result);

    toast({
      title: "Görseller Yüklendi! 🎉",
      description: `${images.length} görsel başarıyla yüklendi.`
    });

    return result;
  } catch (error) {
    console.error('❌ Image upload failed:', error);

    toast({
      title: "Görsel Yükleme Hatası",
      description: error instanceof Error ? error.message : 'Görseller yüklenirken bir hata oluştu.',
      variant: "destructive"
    });

    throw error;
  }
};
