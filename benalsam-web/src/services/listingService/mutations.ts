import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { listingServiceClient, pollJobStatus } from '@/services/listingServiceClient';
import { uploadImagesWithProgress } from '@/services/uploadServiceClient';
import { listingServiceCircuitBreaker } from '@/utils/circuitBreaker';
import { handleError, handleApiError, getUserFriendlyMessage } from '@/utils/errorHandler';
import { logInfo, logDebug, logError, logWarn } from '@/utils/logger';
import { Listing } from '@/types';
import { ListingStatus } from 'benalsam-shared-types';

import { categoriesConfig } from '@/config/categories';
import { CATEGORY } from '@/config/constants';
import { 
  CreateListingRequest, 
  CreateListingResponse, 
  ImageFile, 
  UploadProgressCallback,
  JobStatusCallbacks,
  CategoryIds,
  ListingServiceData
} from '@/types/listing';
import { 
  ValidationError, 
  UploadError, 
  ServiceError,
  ErrorCode 
} from '@/types/errors';
import { 
  LISTING_CONFIG, 
  UPLOAD_CONFIG, 
  VALIDATION_CONFIG,
  ERROR_MESSAGES 
} from '@/config/listing';

// Kategori path'ini ID'lere çevir
const getCategoryIds = (categoryString: string): CategoryIds => {
  if (!categoryString) return { category_id: null, category_path: null };
  
  logDebug('Processing category string', { 
    component: 'category-matcher', 
    metadata: {
      categoryString,
      categoriesCount: categoriesConfig.length 
    }
  });
  
  // Kategori path'ini parçala
  const pathParts = categoryString.split(' > ');
  logDebug('Category path parts', { 
    component: 'category-matcher', 
    metadata: {
      pathParts,
      partsCount: pathParts.length 
    }
  });
  
  if (pathParts.length === 0) {
    logWarn('No path parts found', { component: 'category-matcher' });
    return { category_id: null, category_path: null };
  }
  
  // Ana kategoriyi bul
  const mainCategory = categoriesConfig.find(cat => cat.name === pathParts[0]);
  if (!mainCategory) {
    logWarn('Main category not found', { 
      component: 'category-matcher', 
      metadata: { categoryName: pathParts[0] }
    });
    return { category_id: null, category_path: null };
  }
  
  // Ana kategori ID'si (1-13 arası)
  const mainCategoryId = categoriesConfig.findIndex(cat => cat.name === pathParts[0]) + 1;
  logInfo('Main category found', { 
    component: 'category-matcher', 
    metadata: {
      categoryName: pathParts[0], 
      categoryId: mainCategoryId 
    }
  });
  
  const categoryPath = [mainCategoryId];
  let categoryId = mainCategoryId;
  
  // Alt kategori varsa
  if (pathParts.length > 1 && mainCategory.subcategories) {
    const subCategory = mainCategory.subcategories.find(sub => sub.name === pathParts[1]);
    if (subCategory) {
      // Alt kategori ID'si (101-1303 arası)
      const subCategoryId = mainCategoryId * CATEGORY.MULTIPLIERS.SUB_CATEGORY + mainCategory.subcategories.findIndex(sub => sub.name === pathParts[1]) + 1;
      categoryPath.push(subCategoryId);
      categoryId = subCategoryId;
      logInfo('Subcategory found', { 
        component: 'category-matcher', 
        metadata: {
          subcategoryName: pathParts[1], 
          subcategoryId: subCategoryId 
        }
      });
      
      // Alt-alt kategori varsa
      if (pathParts.length > 2 && subCategory.subcategories) {
        const subSubCategory = subCategory.subcategories.find(subSub => subSub.name === pathParts[2]);
        if (subSubCategory) {
          // Alt-alt kategori ID'si (1001-9999 arası)
          const subSubCategoryId = subCategoryId * CATEGORY.MULTIPLIERS.SUB_SUB_CATEGORY + subCategory.subcategories.findIndex(subSub => subSub.name === pathParts[2]) + 1;
          categoryPath.push(subSubCategoryId);
          categoryId = subSubCategoryId;
          logInfo('Sub-subcategory found', { 
            component: 'category-matcher', 
            metadata: {
              subSubcategoryName: pathParts[2], 
              subSubcategoryId: subSubCategoryId 
            }
          });
        }
      }
    }
  }
  
  logInfo('Category matching completed', { 
    component: 'category-matcher', 
    metadata: {
      finalCategoryId: categoryId, 
      categoryPath 
    }
  });
  
  return {
    category_id: categoryId,
    category_path: categoryPath
  };
};



export const createListing = async (
  listingData: CreateListingRequest, 
  currentUserId: string, 
  onProgress?: UploadProgressCallback
): Promise<Listing | null> => {
  // Input validation
  if (!listingData || !currentUserId) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.TITLE_TOO_SHORT);
  }

  // Validate required fields
  if (!listingData.title || listingData.title.length < VALIDATION_CONFIG.TITLE.MIN_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.TITLE_TOO_SHORT);
  }

  if (listingData.title.length > VALIDATION_CONFIG.TITLE.MAX_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.TITLE_TOO_LONG);
  }

  if (!listingData.description || listingData.description.length < VALIDATION_CONFIG.DESCRIPTION.MIN_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.DESCRIPTION_TOO_SHORT);
  }

  if (listingData.description.length > VALIDATION_CONFIG.DESCRIPTION.MAX_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.DESCRIPTION_TOO_LONG);
  }

  if (listingData.budget < VALIDATION_CONFIG.BUDGET.MIN || listingData.budget > VALIDATION_CONFIG.BUDGET.MAX) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.BUDGET_INVALID);
  }

  if (!listingData.location || listingData.location.length < VALIDATION_CONFIG.LOCATION.MIN_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.LOCATION_REQUIRED);
  }

  if (listingData.images.length > VALIDATION_CONFIG.IMAGES.MAX_COUNT) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.IMAGES_TOO_MANY);
  }

  try {
    logInfo('Creating listing via Listing Service', { 
      component: 'listing-service', 
      userId: currentUserId,
      metadata: { title: listingData.title }
    });
    
    // Step 1: Upload images to Upload Service
    let uploadedImages: string[] = [];
    if (listingData.images && listingData.images.length > 0) {
      logInfo('Uploading images to Upload Service', { 
        component: 'upload-service', 
        userId: currentUserId,
        metadata: { imageCount: listingData.images.length }
      });
      
      try {
        // Validate image files
        const validImages = listingData.images.filter((file: File) => {
          if (!(file instanceof File)) {
            logWarn('Invalid file type detected', { 
              component: 'upload-service', 
              metadata: { fileType: typeof file }
            });
            return false;
          }
          
          if (file.size < UPLOAD_CONFIG.VALIDATION.MIN_FILE_SIZE) {
            logWarn('File too small', { 
              component: 'upload-service', 
              metadata: {
                fileName: file.name, 
                fileSize: file.size 
              }
            });
            return false;
          }
          
          if (file.size > UPLOAD_CONFIG.VALIDATION.MAX_FILE_SIZE) {
            throw new UploadError(ERROR_MESSAGES.VALIDATION.IMAGE_TOO_LARGE, { fileName: file.name, size: file.size });
          }
          
          if (!UPLOAD_CONFIG.VALIDATION.ALLOWED_MIME_TYPES.includes(file.type as any)) {
            throw new UploadError(ERROR_MESSAGES.VALIDATION.INVALID_IMAGE_TYPE, { fileName: file.name, type: file.type });
          }
          
          return true;
        });
        
        if (validImages.length === 0) {
          throw new UploadError(ERROR_MESSAGES.UPLOAD.INVALID_FILE);
        }
        
        // Upload valid images
        const uploadResult = await uploadImagesWithProgress(
          validImages,
          currentUserId,
          (progress) => {
            if (onProgress) {
              onProgress(Math.floor(progress * LISTING_CONFIG.PROGRESS.IMAGE_UPLOAD_RATIO * 100));
            }
          }
        );
        
        uploadedImages = uploadResult.images.map(img => img.url);
      } catch (error) {
        logError('Image upload failed', { 
          component: 'upload-service', 
          userId: currentUserId,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        });
        if (error instanceof UploadError) {
          throw error;
        }
        throw new UploadError(ERROR_MESSAGES.UPLOAD.FAILED, { originalError: error });
      }
    }
    
    // Step 2: Prepare data for Listing Service
    const mainImageUrl = uploadedImages.length > 0 ? uploadedImages[0] : null;
    const additionalImageUrls = uploadedImages.length > 1 ? uploadedImages.slice(1) : [];
    
    const listingServiceData: CreateListingRequest = {
      title: listingData.title,
      description: listingData.description,
      category: listingData.category,
      budget: listingData.budget,
      location: listingData.location,
      urgency: listingData.urgency || 'medium',
      acceptTerms: listingData.acceptTerms || true,
      images: listingData.images, // Include images for the request
      mainImageIndex: listingData.mainImageIndex,
      duration: listingData.duration,
      autoRepublish: listingData.autoRepublish,
      contactPreference: listingData.contactPreference,
      isFeatured: listingData.isFeatured,
      isUrgentPremium: listingData.isUrgentPremium,
      isShowcase: listingData.isShowcase,
      geolocation: listingData.geolocation,
      condition: listingData.condition,
      attributes: listingData.attributes
    };

    // Use Circuit Breaker to call Listing Service
    const response = await listingServiceCircuitBreaker.execute(
      () => listingServiceClient.createListing(listingServiceData, currentUserId)
    );
    const { jobId } = response.data;
    
    // Step 3: Poll job status for listing creation
    const result = await pollJobStatus(
      jobId,
      currentUserId,
      (progress) => {
        // Update progress for listing creation (50-100%)
        if (onProgress) {
          onProgress(50 + Math.floor(progress * LISTING_CONFIG.PROGRESS.LISTING_CREATION_RATIO * 100));
        }
      },
      (completedResult) => {
        toast({
          title: "İlan Oluşturuldu! 🎉",
          description: "İlanınız başarıyla yayınlandı."
        });
      },
      (error) => {
        toast({
          title: "İlan Oluşturulamadı",
          description: error,
          variant: "destructive"
        });
      }
    );

    // Add user activity
    await addUserActivity(
      currentUserId,
      'listing_created',
      'Yeni ilan oluşturuldu',
      `"${listingData.title}" ilanı oluşturuldu`
    );

    return result as Listing;
  } catch (error) {
    logError('Listing Service failed', { 
      component: 'listing-service', 
      userId: currentUserId,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    });
    
    // Handle different error types
    if (error instanceof ValidationError) {
      toast({ 
        title: "Doğrulama Hatası", 
        description: error.message, 
        variant: "destructive" 
      });
      return null;
    }
    
    if (error instanceof UploadError) {
      toast({ 
        title: "Görsel Yükleme Hatası", 
        description: error.message, 
        variant: "destructive" 
      });
      return null;
    }
    
    if (error instanceof ServiceError) {
      toast({ 
        title: "Servis Hatası", 
        description: error.message, 
        variant: "destructive" 
      });
      return null;
    }
    
    // Handle unknown errors using unified error handler
    handleError(error, {
      component: 'listing-service',
      action: 'create-listing',
      userId: currentUserId
    });

    return null;
  }
};

export const updateListing = async (
  listingId: string, 
  updates: Partial<Listing>, 
  userId: string
): Promise<Listing | null> => {
  // Input validation
  if (!listingId || !updates || !userId) {
    toast({ 
      title: "Hata", 
      description: "İlan güncellemek için eksik bilgi.", 
      variant: "destructive" 
    });
    return null;
  }

  try {
    console.log('🚀 Updating listing via Listing Service...');
    
    // For now, use direct database update until Listing Service supports updates
    // TODO: Implement update endpoint in Listing Service
    const dbUpdates: any = {
      title: updates.title,
      description: updates.description,
      category: updates.category,
      budget: updates.budget,
      location: updates.location,
      urgency: updates.urgency,
      contact_preference: updates.contact_preference,
      auto_republish: updates.auto_republish,
      accept_terms: updates.accept_terms,
      is_featured: updates.is_featured,
      is_urgent_premium: updates.is_urgent_premium,
      is_showcase: updates.is_showcase,
      geolocation: updates.geolocation,
      updated_at: new Date().toISOString()
    };

    if (updates.main_image_url !== undefined) {
      dbUpdates.main_image_url = updates.main_image_url;
      dbUpdates.image_url = updates.main_image_url;
    }
    if (updates.additional_image_urls !== undefined) {
      dbUpdates.additional_image_urls = updates.additional_image_urls;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(dbUpdates)
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      toast({ 
        title: "İlan Güncellenemedi", 
        description: error.message, 
        variant: "destructive" 
      });
      return null;
    }

    await addUserActivity(
      userId,
      'listing_updated',
      'İlan güncellendi',
      `"${data.title}" ilanı güncellendi`,
      data.id
    );

    toast({ 
      title: "İlan Güncellendi", 
      description: "İlanınız başarıyla güncellendi." 
    });

    return data;
  } catch (error) {
    console.error('Error in updateListing:', error);
    toast({ 
      title: "Beklenmedik Hata", 
      description: "İlan güncellenirken bir sorun oluştu.", 
      variant: "destructive" 
    });
    return null;
  }
};

export const updateListingStatus = async (
  listingId: string, 
  userId: string, 
  status: string, 
  reason: string | null = null
): Promise<Listing | null> => {
  if (!listingId || !userId || !status) {
    toast({ title: "Hata", description: "İlan durumu güncellemek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.rejection_reason = reason;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing status:', error);
      toast({ title: "Durum Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }

    let statusText = '';
    switch (status) {
      case 'active':
        statusText = 'aktif edildi';
        break;
      case 'inactive':
        statusText = 'pasif edildi';
        break;
      case 'pending_approval':
        statusText = 'onay bekliyor';
        break;
      case 'rejected':
        statusText = 'reddedildi';
        break;
      default:
        statusText = 'güncellendi';
    }

    await addUserActivity(
      userId,
      'listing_status_changed',
      `İlan ${statusText}`,
      `"${data.title}" ilanı ${statusText}`,
      data.id
    );

    return data;
  } catch (error) {
    console.error('Error in updateListingStatus:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan durumu güncellenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const deleteListing = async (listingId: string, userId: string): Promise<boolean> => {
  if (!listingId || !userId) {
    toast({ title: "Hata", description: "İlan silmek için eksik bilgi.", variant: "destructive" });
    return false;
  }

  try {
    const { data: listingData, error: fetchError } = await supabase
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching listing for deletion:', fetchError);
      toast({ title: "İlan Bulunamadı", description: "Silinecek ilan bulunamadı.", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting listing:', error);
      toast({ title: "İlan Silinemedi", description: error.message, variant: "destructive" });
      return false;
    }

    await addUserActivity(
      userId,
      'listing_deleted',
      'İlan silindi',
      `"${listingData.title}" ilanı silindi`,
      listingId
    );

    return true;
  } catch (error) {
    console.error('Error in deleteListing:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan silinirken bir sorun oluştu.", variant: "destructive" });
    return false;
  }
};

export const toggleListingStatus = async (
  listingId: string, 
  newStatus: string, 
  userId: string
): Promise<Listing | null> => {
  if (!listingId || !newStatus || !userId) {
    toast({ title: "Hata", description: "İlan durumu değiştirmek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling listing status:', error);
      toast({ title: "Durum Değiştirilemedi", description: error.message, variant: "destructive" });
      return null;
    }

    const statusText = newStatus === 'active' ? 'aktif edildi' : 'pasif edildi';

    await addUserActivity(
      userId,
      'listing_status_toggled',
      `İlan ${statusText}`,
      `"${data.title}" ilanı ${statusText}`,
      data.id
    );

    toast({ 
      title: "Durum Güncellendi", 
      description: `İlan ${statusText}.` 
    });

    return data;
  } catch (error) {
    console.error('Error in toggleListingStatus:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan durumu değiştirilirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
}; 