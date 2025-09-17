/**
 * Upload Service Integration
 * 
 * @fileoverview Service for uploading images using Upload Service instead of Supabase Storage
 * @author Benalsam Team
 * @version 1.0.0
 */

import { toast } from '@/components/ui/use-toast';

interface UploadedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
  mediumUrl?: string;
}

interface UploadResponse {
  success: boolean;
  data: {
    images: UploadedImage[];
    tempId?: string;
    expiresAt?: string;
  };
  message?: string;
}

const UPLOAD_SERVICE_URL = 'http://localhost:3007/api/v1';

export class UploadService {
  private static instance: UploadService;
  private userId: string | null = null;

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private getUserId(): string {
    if (!this.userId) {
      throw new Error('User ID not set. Call setUserId() first.');
    }
    return this.userId;
  }

  /**
   * Upload images to Upload Service
   */
  async uploadImages(
    files: File[], 
    type: 'listings' | 'inventory' | 'profile' = 'listings',
    onProgress?: (progress: number) => void
  ): Promise<UploadedImage[]> {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const userId = this.getUserId();
    
    try {
      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      // Add type parameter
      formData.append('type', type);

      console.log(`🚀 [UploadService] Uploading ${files.length} files to Upload Service...`);

      // Upload to Upload Service
      const response = await fetch(`${UPLOAD_SERVICE_URL}/upload/${type}`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      const result: UploadResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      console.log(`✅ [UploadService] Upload successful:`, result.data.images.length, 'images');

      // Simulate progress completion
      if (onProgress) {
        onProgress(100);
      }

      return result.data.images;

    } catch (error) {
      console.error('❌ [UploadService] Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload single image
   */
  async uploadSingleImage(
    file: File, 
    type: 'listings' | 'inventory' | 'profile' = 'listings'
  ): Promise<UploadedImage> {
    const images = await this.uploadImages([file], type);
    return images[0];
  }

  /**
   * Delete image from Upload Service
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${UPLOAD_SERVICE_URL}/upload/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': this.getUserId(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;

    } catch (error) {
      console.error('❌ [UploadService] Delete error:', error);
      throw error;
    }
  }

  /**
   * Get upload quota for user
   */
  async getQuota(): Promise<{ used: number; limit: number; remaining: number }> {
    try {
      const response = await fetch(`${UPLOAD_SERVICE_URL}/upload/quota`, {
        headers: {
          'x-user-id': this.getUserId(),
        },
      });

      if (!response.ok) {
        throw new Error(`Quota check failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;

    } catch (error) {
      console.error('❌ [UploadService] Quota error:', error);
      throw error;
    }
  }

  /**
   * Check if Upload Service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${UPLOAD_SERVICE_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      return response.ok;
    } catch (error) {
      console.warn('⚠️ [UploadService] Service not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const uploadService = UploadService.getInstance();

/**
 * Legacy compatibility functions
 */

/**
 * Upload images with progress tracking (replaces processImagesForSupabase)
 */
export const processImagesForUploadService = async (
  images: File[], 
  mainImageIndex: number, 
  type: 'listings' | 'inventory' | 'profile' = 'listings',
  userId: string,
  onProgress?: (progress: number) => void, 
  initialImageUrls: string[] = []
): Promise<{ mainImageUrl: string | null; additionalImageUrls: string[]; urlsToDelete?: string[] }> => {
  
  // Set user ID
  uploadService.setUserId(userId);

  // Check if Upload Service is available
  const isAvailable = await uploadService.isAvailable();
  if (!isAvailable) {
    console.warn('⚠️ Upload Service not available, falling back to Supabase Storage');
    // Fallback to Supabase Storage
    const { processImagesForSupabase } = await import('./imageService');
    return processImagesForSupabase(
      images,
      mainImageIndex,
      'item_images',
      'listings',
      userId,
      'listings',
      onProgress,
      initialImageUrls
    );
  }

  try {
    // Filter files to upload
    const filesToUpload = images
      .filter(img => !img.isUploaded && (img.file || img.uri))
      .map(img => {
        if (img.file) {
          return img.file;
        } else if (img.uri && img.uri.startsWith('file://')) {
          // Mobile local file - create file object
          return {
            uri: img.uri,
            name: img.name || `image_${Date.now()}.jpg`,
            type: 'image/jpeg'
          } as File;
        }
        return null;
      })
      .filter(Boolean) as File[];

    const keptImageUrls = images.filter(img => img.isUploaded).map(img => img.preview || img.uri);
    const urlsToDelete = initialImageUrls.filter(url => !keptImageUrls.includes(url));

    let newImageUrls: string[] = [];
    if (filesToUpload.length > 0) {
      const uploadedImages = await uploadService.uploadImages(filesToUpload, type, onProgress);
      newImageUrls = uploadedImages.map(img => img.url);
    }

    const allImageUrls = [...keptImageUrls, ...newImageUrls];
    
    let finalOrderedUrls = [...allImageUrls];
    if (mainImageIndex >= 0 && mainImageIndex < allImageUrls.length) {
      const mainImage = finalOrderedUrls.splice(mainImageIndex, 1)[0];
      finalOrderedUrls.unshift(mainImage);
    }

    return {
      mainImageUrl: finalOrderedUrls[0] || null,
      additionalImageUrls: finalOrderedUrls.slice(1),
      urlsToDelete
    };

  } catch (error) {
    console.error('❌ [UploadService] Process images error:', error);
    toast({
      title: "Upload Hatası",
      description: "Görsel yüklenirken hata oluştu. Lütfen tekrar deneyin.",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Upload images (replaces uploadImages from imageService)
 */
export const uploadImages = async (
  files: File[], 
  userId: string, 
  type: 'listings' | 'inventory' | 'profile' = 'listings'
): Promise<string[]> => {
  uploadService.setUserId(userId);
  
  const isAvailable = await uploadService.isAvailable();
  if (!isAvailable) {
    console.warn('⚠️ Upload Service not available, falling back to Supabase Storage');
    // Fallback to Supabase Storage
    const { uploadImages: supabaseUploadImages } = await import('./imageService');
    return supabaseUploadImages(files, userId, 'item_images');
  }

  try {
    const uploadedImages = await uploadService.uploadImages(files, type);
    return uploadedImages.map(img => img.url);
  } catch (error) {
    console.error('❌ [UploadService] Upload images error:', error);
    throw error;
  }
};

/**
 * Delete images (replaces deleteImages from imageService)
 */
export const deleteImages = async (urls: string[]): Promise<any> => {
  if (!urls || urls.length === 0) return;

  try {
    // For now, we'll use Supabase Storage for deletion
    // TODO: Implement deletion in Upload Service
    const { deleteImages: supabaseDeleteImages } = await import('./imageService');
    return supabaseDeleteImages(urls);
  } catch (error) {
    console.error('❌ [UploadService] Delete images error:', error);
    throw error;
  }
};
