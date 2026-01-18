/**
 * Upload Service Listing Mutations
 * 
 * @fileoverview Listing creation and updates using Upload Service with job system
 * @author Benalsam Team
 * @version 1.0.0
 */

import { toast } from '@/hooks/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { uploadService } from '@/services/uploadService';
import { Listing } from '@/types';
import { ListingStatus } from 'benalsam-shared-types';
// import { categoriesConfig } from '@/config/categories'; // Removed - using dynamic categories
import { CATEGORY } from '@/config/constants';
import dynamicCategoryService from '../dynamicCategoryService';
import { logger } from '@/utils/production-logger';
import type { Category } from '../categoryService';

const UPLOAD_SERVICE_URL = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3007/api/v1';

// Kategori path'ini ID'lere çevir
const getCategoryIds = async (categoryString: string): Promise<{ category_id: number | null, category_path: number[] | null }> => {
  if (!categoryString) return { category_id: null, category_path: null };
  
  logger.debug('[UploadServiceMutations] Processing category string', { categoryString });
  
  // Kategori path'ini parçala (sadece ' > ' ve ' / ' ayırıcılarını kullan)
  const pathParts = categoryString.split(/\s*[>\/]\s*/).map(part => part.trim()).filter(part => part);
  logger.debug('[UploadServiceMutations] Category path parts', { pathParts });
  
  if (pathParts.length === 0) {
    logger.warn('[UploadServiceMutations] No path parts found');
    return { category_id: null, category_path: null };
  }
  
  try {
    // Dinamik kategori servisinden kategorileri al
    const categories = await dynamicCategoryService.getCategories();
    logger.debug('[UploadServiceMutations] Categories from dynamic service', { categoriesCount: categories.length });
    
    // Ana kategoriyi bul
    const mainCategory = categories.find(cat => cat.name === pathParts[0]);
    if (!mainCategory) {
      logger.warn('[UploadServiceMutations] Main category not found', { categoryName: pathParts[0] });
      return { category_id: null, category_path: null };
    }
    
    logger.debug('[UploadServiceMutations] Main category found', { categoryName: pathParts[0], categoryId: mainCategory.id });

    // N-seviye gezinme: her bir path parçasını sırayla subcategories içinde ara
    const categoryPath: number[] = [];
    let currentNode: Category | undefined = mainCategory;
    
    // Ana kategoriyi ekle
    if (currentNode?.id) {
      categoryPath.push(Number(currentNode.id));
    }
    
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i];
      const children = currentNode?.subcategories || currentNode?.children || [];
      logger.debug('[UploadServiceMutations] Traversing category level', { level: i + 1, lookingFor: part, childrenCount: children.length });
      const next = children.find((c: Category) => c.name === part);
      if (!next) {
        logger.warn('[UploadServiceMutations] Category level not found', { level: i + 1, part, available: children.map((c: Category) => c.name) });
        break;
      }
      if (next.id) {
        categoryPath.push(Number(next.id));
      }
      currentNode = next;
    }

    const categoryId = categoryPath[categoryPath.length - 1] || null;

    logger.debug('[UploadServiceMutations] Final category IDs', { category_id: categoryId, category_path: categoryPath });
    return { category_id: categoryId, category_path: categoryPath };
    
  } catch (error) {
    logger.error('[UploadServiceMutations] Error getting category IDs from dynamic service', { error });
    return { category_id: null, category_path: null };
  }
};

/**
 * Create listing using Upload Service with job system
 */
type WebCreateListingInput = Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  images: string[];
  mainImageIndex: number;
  duration?: number;
  acceptTerms?: boolean;
  autoRepublish?: boolean;
  contactPreference?: 'site_message' | 'phone' | 'both';
  premiumFeatures?: {
    is_featured?: boolean;
    is_urgent_premium?: boolean;
    is_showcase?: boolean;
  };
};

export const createListingWithUploadService = async (
  listingData: WebCreateListingInput, 
  currentUserId: string, 
  onProgress?: (progress: number) => void
): Promise<Listing | null> => {
  if (!listingData || !currentUserId) {
    toast({ title: "Hata", description: "İlan oluşturmak için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    // Check if Upload Service is available
    const isAvailable = await uploadService.isAvailable();
    if (!isAvailable) {
      logger.warn('[UploadServiceMutations] Upload Service not available, falling back to direct database creation');
      // Fallback to direct database creation
      const { createListing } = await import('./mutations');
      // Normalize camelCase vs snake_case from shared Listing type
      const acceptTerms = listingData.acceptTerms ?? true;
      const autoRepublish = listingData.autoRepublish;
      const contactPreference = listingData.contactPreference;
      const fallbackData: Parameters<typeof createListing>[0] = {
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        budget: Number(listingData.budget),
        location: listingData.location,
        urgency: listingData.urgency || 'medium',
        acceptTerms,
        images: listingData.images,
        mainImageIndex: listingData.mainImageIndex,
        duration: listingData.duration,
        autoRepublish,
        contactPreference,
        isFeatured: listingData.premiumFeatures?.is_featured,
        isUrgentPremium: listingData.premiumFeatures?.is_urgent_premium,
        isShowcase: listingData.premiumFeatures?.is_showcase,
        geolocation: listingData.geolocation,
        condition: listingData.condition,
        attributes: listingData.attributes
      };
      return createListing(fallbackData, currentUserId, onProgress);
    }

    logger.debug('[UploadServiceMutations] Creating listing via Upload Service job system', {
      title: listingData.title,
      category: listingData.category,
      category_id: listingData.category_id,
      category_path: listingData.category_path,
      imageCount: listingData.images.length
    });

    // First, upload images to Upload Service
    let uploadedImageUrls: string[] = [];
    if (listingData.images && listingData.images.length > 0) {
      logger.debug('[UploadServiceMutations] Uploading images to Upload Service');
      
      // Convert image data to File objects if needed
      const isFileLike = (obj: unknown): obj is File => {
        return !!obj && typeof obj === 'object' && obj !== null && 'name' in obj && 'size' in obj && 'type' in obj;
      };
      const imageFiles = await Promise.all(
        listingData.images.map(async (imageData, index) => {
          if (typeof imageData === 'string' && imageData.startsWith('blob:')) {
            // Convert blob URL to File
            const response = await fetch(imageData);
            const blob = await response.blob();
            // Ensure proper MIME type for images
            const mimeType = blob.type || 'image/jpeg';
            return new File([blob], `image-${index}.jpg`, { type: mimeType });
          } else if (isFileLike(imageData)) {
            // Ensure File has proper MIME type
            if (!imageData.type || !imageData.type.startsWith('image/')) {
              // Create new File with proper MIME type
              return new File([imageData], imageData.name, { type: 'image/jpeg' });
            }
            return imageData;
          } else if (typeof imageData === 'object' && imageData !== null) {
            // Handle image object with preview blob URL
            const imgObj = imageData as { preview?: string; name?: string; file?: File };
            if (imgObj.preview && typeof imgObj.preview === 'string' && imgObj.preview.startsWith('blob:')) {
              const response = await fetch(imgObj.preview);
              const blob = await response.blob();
              const fileName = imgObj.name || imgObj.file?.name || `image-${index}.jpg`;
              // Ensure proper MIME type
              const mimeType = blob.type || 'image/jpeg';
              return new File([blob], fileName, { type: mimeType });
            } else if (imgObj.file && isFileLike(imgObj.file)) {
              // Ensure File has proper MIME type
              if (!imgObj.file.type || !imgObj.file.type.startsWith('image/')) {
                return new File([imgObj.file], imgObj.file.name, { type: 'image/jpeg' });
              }
              return imgObj.file as File;
            } else {
              logger.warn('[UploadServiceMutations] Unknown image object structure', { imageData });
              return null;
            }
          } else {
            // Handle other image data types
            logger.warn('[UploadServiceMutations] Unknown image data type', { type: typeof imageData, imageData });
            return null;
          }
        })
      );

        // Filter out null values
        const validImageFiles = imageFiles.filter((file): file is File => file !== null);
        
        // Debug log for file types
        validImageFiles.forEach((file: File, index: number) => {
          logger.debug(`[UploadServiceMutations] File ${index}`, {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          });
        });
        
        if (validImageFiles.length === 0) {
          throw new Error('No valid image files found');
        }

      // Upload images to Upload Service
      const formData = new FormData();
      validImageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const uploadResponse = await fetch(`${UPLOAD_SERVICE_URL}/listings`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUserId,
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json() as {
        success: boolean
        message?: string
        data: {
          images: Array<{ url: string }>
        }
      };
      if (!uploadResult.success) {
        throw new Error(`Image upload failed: ${uploadResult.message || 'Unknown error'}`);
      }

      uploadedImageUrls = uploadResult.data.images.map((img) => img.url);
      logger.debug('[UploadServiceMutations] Images uploaded successfully', { count: uploadedImageUrls.length });
    }

    // Convert category string to numeric IDs
    const categoryIds = await getCategoryIds(listingData.category);
    logger.debug('[UploadServiceMutations] Category IDs generated', {
      category: listingData.category,
      category_id: categoryIds.category_id,
      category_path: categoryIds.category_path
    });

    // Create listing via Upload Service with uploaded image URLs
    const response = await fetch(`${UPLOAD_SERVICE_URL}/listings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId,
      },
      body: JSON.stringify({
        title: listingData.title,
        description: listingData.description,
        price: listingData.budget || 0,
        category: listingData.category,
        location: listingData.location,
        images: uploadedImageUrls, // Use uploaded image URLs
        status: ListingStatus.PENDING_APPROVAL,
        urgency: listingData.urgency || 'medium',
        condition: listingData.condition || [],
        // Normalize attributes to { key: ["value"] } without double arrays
        attributes: listingData.attributes && Object.keys(listingData.attributes).length > 0
          ? Object.entries(listingData.attributes).reduce((acc, [key, value]) => {
              const normalized = Array.isArray(value) ? value : [value];
              // Ensure all values are strings for ES mapping consistency
              acc[key] = normalized.map((v: unknown) => String(v));
              return acc;
            }, {} as Record<string, string[]>)
          : null,
        category_id: categoryIds.category_id, // Use numeric ID
        category_path: categoryIds.category_path, // Use numeric array
        expires_at: listingData.expires_at || null,
        is_featured: listingData.premiumFeatures?.is_featured ?? false,
        is_urgent_premium: listingData.premiumFeatures?.is_urgent_premium ?? false,
        is_showcase: listingData.premiumFeatures?.is_showcase ?? false,
        geolocation: listingData.geolocation || null,
        metadata: {
          source: 'web',
          userAgent: navigator.userAgent,
          duration: listingData.duration,
          mainImageIndex: listingData.mainImageIndex
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Listing creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Listing creation failed');
    }

    logger.debug('[UploadServiceMutations] Listing creation job started', {
      jobId: result.data.jobId,
      status: result.data.status
    });

    // Show success message
    toast({
      title: "İlan Oluşturuldu",
      description: "İlanınız işleme alındı. Görseller yükleniyor...",
    });

    // Poll for job completion
    const listing = await pollListingJobStatus(result.data.jobId, currentUserId, onProgress);
    
    if (listing) {
      await addUserActivity(
        currentUserId,
        'listing_created',
        'Yeni ilan oluşturuldu',
        `"${listingData.title}" ilanı oluşturuldu`,
        listing.id
      );
    }

    return listing;

  } catch (error) {
    logger.error('[UploadServiceMutations] Error in createListingWithUploadService', { error });
    toast({ 
      title: "Beklenmedik Hata", 
      description: error instanceof Error ? error.message : "İlan oluşturulurken bir sorun oluştu.", 
      variant: "destructive" 
    });
    return null;
  }
};

/**
 * Update listing using Upload Service with job system
 */
export const updateListingWithUploadService = async (
  listingId: string, 
  updates: Partial<Listing>, 
  userId: string
): Promise<Listing | null> => {
  if (!listingId || !updates || !userId) {
    toast({ title: "Hata", description: "İlan güncellemek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    // Check if Upload Service is available
    const isAvailable = await uploadService.isAvailable();
    if (!isAvailable) {
      logger.warn('[UploadServiceMutations] Upload Service not available, falling back to direct database update');
      // Fallback to direct database update
      const { updateListing } = await import('./mutations');
      return updateListing(listingId, updates, userId);
    }

    logger.debug('[UploadServiceMutations] Updating listing via Upload Service job system', {
      listingId,
      updateFields: Object.keys(updates)
    });

    // Update listing via Upload Service
    const response = await fetch(`${UPLOAD_SERVICE_URL}/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        price: updates.budget,
        category: updates.category,
        location: updates.location,
        status: updates.status,
        metadata: {
          source: 'web',
          userAgent: navigator.userAgent
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Listing update failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Listing update failed');
    }

    logger.debug('[UploadServiceMutations] Listing update job started', {
      jobId: result.data.jobId,
      status: result.data.status
    });

    // Show success message
    toast({
      title: "İlan Güncellendi",
      description: "İlan güncelleme işlemi başlatıldı.",
    });

    // Poll for job completion
    const updatedListing = await pollListingJobStatus(result.data.jobId, userId);
    
    if (updatedListing) {
      await addUserActivity(
        userId,
        'listing_updated',
        'İlan güncellendi',
        `"${updatedListing.title}" ilanı güncellendi`,
        updatedListing.id
      );
    }

    return updatedListing;

  } catch (error) {
    logger.error('[UploadServiceMutations] Error in updateListingWithUploadService', { error });
    toast({ 
      title: "Beklenmedik Hata", 
      description: error instanceof Error ? error.message : "İlan güncellenirken bir sorun oluştu.", 
      variant: "destructive" 
    });
    return null;
  }
};

/**
 * Poll listing job status until completion
 */
async function pollListingJobStatus(
  jobId: string, 
  userId: string, 
  onProgress?: (progress: number) => void
): Promise<Listing | null> {
  const maxAttempts = 60; // 5 minutes max
  const pollInterval = 5000; // 5 seconds
  
  // Try Listing Service first (new system), fallback to Upload Service (old system)
  const LISTING_SERVICE_URL = process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || 'http://localhost:3008/api/v1';
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try Listing Service endpoint first
      let response = await fetch(`${LISTING_SERVICE_URL}/listings/jobs/${jobId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      // If Listing Service fails, try Upload Service (backward compatibility)
      if (!response.ok && response.status === 404) {
        logger.warn('[UploadServiceMutations] Job not found in Listing Service, trying Upload Service');
        response = await fetch(`${UPLOAD_SERVICE_URL}/listings/status/${jobId}`, {
          headers: {
            'x-user-id': userId,
          },
        });
      }

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.data?.message || result.error || 'Status check failed');
      }

      // Handle both Listing Service and Upload Service response formats
      const jobData = result.data || result;
      const status = jobData.status;
      const progress = jobData.progress;
      const jobResult = jobData.result || jobData;
      const error = jobData.error;

      // Update progress
      if (onProgress && progress !== undefined) {
        onProgress(progress);
      }

      if (status === 'completed') {
        logger.debug('[UploadServiceMutations] Listing job completed successfully', { jobId });

        // Extract listing ID from result
        const listingId = jobResult?.listingId || jobResult?.listing?.id;
        if (!listingId) {
          logger.warn('[UploadServiceMutations] No listing ID in job result', { jobResult });
          return null;
        }

        try {
          // Fetch the created listing from database
          const { supabase } = await import('@/lib/supabase');
          const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

          if (fetchError) {
            logger.warn('[UploadServiceMutations] Could not fetch created listing', {
              listingId,
              error: fetchError.message
            });
            // Return minimal object with ID so frontend knows listing was created
            return { id: listingId, status: 'pending_approval' } as unknown as Listing;
          }

          logger.debug('[UploadServiceMutations] Listing fetched successfully', { listingId, status: listing.status });
          return listing as Listing;
        } catch (fetchErr) {
          logger.warn('[UploadServiceMutations] Listing fetch threw', { listingId, error: String(fetchErr) });
          return { id: listingId, status: 'pending_approval' } as unknown as Listing;
        }
      } else if (status === 'failed') {
        throw new Error(error || 'Listing job failed');
      }

      // Job still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      logger.error('[UploadServiceMutations] Error polling job status', { error });
      // Don't throw immediately, wait and retry (might be temporary network issue)
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Listing job timed out');
}
