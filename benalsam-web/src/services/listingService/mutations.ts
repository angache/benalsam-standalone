import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { listingServiceClient, pollJobStatus } from '@/services/listingServiceClient';
import { uploadImagesWithProgress } from '@/services/uploadServiceClient';
import { listingServiceCircuitBreaker } from '@/utils/circuitBreaker';
import { handleListingServiceError, getUserFriendlyMessage } from '@/utils/errorHandler';
import { Listing } from '@/types';
import { ListingStatus } from 'benalsam-shared-types';

import { categoriesConfig } from '@/config/categories';

// Kategori path'ini ID'lere çevir
const getCategoryIds = (categoryString: string) => {
  if (!categoryString) return { category_id: null, category_path: null };
  
  console.log('🔍 Processing category string:', categoryString);
  console.log('🔍 categoriesConfig:', categoriesConfig);
  
  // Kategori path'ini parçala
  const pathParts = categoryString.split(' > ');
  console.log('🔍 Path parts:', pathParts);
  
  if (pathParts.length === 0) {
    console.log('⚠️ No path parts found');
    return { category_id: null, category_path: null };
  }
  
  // Ana kategoriyi bul
  const mainCategory = categoriesConfig.find(cat => cat.name === pathParts[0]);
  if (!mainCategory) {
    console.log('⚠️ Main category not found:', pathParts[0]);
    return { category_id: null, category_path: null };
  }
  
  // Ana kategori ID'si (1-13 arası)
  const mainCategoryId = categoriesConfig.findIndex(cat => cat.name === pathParts[0]) + 1;
  console.log('✅ Main category found:', pathParts[0], 'ID:', mainCategoryId);
  
  const categoryPath = [mainCategoryId];
  let categoryId = mainCategoryId;
  
  // Alt kategori varsa
  if (pathParts.length > 1 && mainCategory.subcategories) {
    const subCategory = mainCategory.subcategories.find(sub => sub.name === pathParts[1]);
    if (subCategory) {
      // Alt kategori ID'si (101-1303 arası)
      const subCategoryId = mainCategoryId * 100 + mainCategory.subcategories.findIndex(sub => sub.name === pathParts[1]) + 1;
      categoryPath.push(subCategoryId);
      categoryId = subCategoryId;
      console.log('✅ Subcategory found:', pathParts[1], 'ID:', subCategoryId);
      
      // Alt-alt kategori varsa
      if (pathParts.length > 2 && subCategory.subcategories) {
        const subSubCategory = subCategory.subcategories.find(subSub => subSub.name === pathParts[2]);
        if (subSubCategory) {
          // Alt-alt kategori ID'si (1001-9999 arası)
          const subSubCategoryId = subCategoryId * 10 + subCategory.subcategories.findIndex(subSub => subSub.name === pathParts[2]) + 1;
          categoryPath.push(subSubCategoryId);
          categoryId = subSubCategoryId;
          console.log('✅ Sub-subcategory found:', pathParts[2], 'ID:', subSubCategoryId);
        }
      }
    }
  }
  
  console.log('✅ Final result - Category ID:', categoryId, 'Path:', categoryPath);
  
  return {
    category_id: categoryId,
    category_path: categoryPath
  };
};



export const createListing = async (
  listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'> & {
    images: string[];
    mainImageIndex: number;
    duration?: number;
  }, 
  currentUserId: string, 
  onProgress?: (progress: number) => void
): Promise<Listing | null> => {
  // Input validation
  if (!listingData || !currentUserId) {
    toast({ 
      title: "Hata", 
      description: "İlan oluşturmak için eksik bilgi.", 
      variant: "destructive" 
    });
    return null;
  }

  try {
    console.log('🚀 Creating listing via Listing Service...');
    
    // Step 1: Upload images to Upload Service
    let uploadedImages: string[] = [];
    if (listingData.images && listingData.images.length > 0) {
      console.log('📤 Uploading images to Upload Service...', { count: listingData.images.length });
      
      try {
        // Debug: Check what's in listingData.images
        console.log('🔍 Debug - listingData.images:', listingData.images);
        console.log('🔍 Debug - listingData.images length:', listingData.images.length);
        console.log('🔍 Debug - listingData.images types:', listingData.images.map((img: any, index: number) => ({
          index,
          type: typeof img,
          isFile: img instanceof File,
          constructor: img?.constructor?.name,
          hasFile: !!img?.file,
          hasUri: !!img?.uri,
          hasPreview: !!img?.preview,
          keys: Object.keys(img || {}),
          fileType: typeof img?.file,
          fileConstructor: img?.file?.constructor?.name,
          fileIsFile: img?.file instanceof File,
          fileKeys: img?.file ? Object.keys(img.file) : 'no file',
          value: img
        })));
        
        // Check if images are in the old format (with .file property)
        const hasFileProperty = listingData.images.some((img: any) => img && img.file);
        console.log('🔍 Debug - hasFileProperty:', hasFileProperty);
        
        // listingData.images should contain File objects, not URLs
        // Filter out any non-File objects and extract File objects
        const imageFiles: File[] = listingData.images
          .filter((img: any) => img instanceof File)
          .map((file: File) => file);
        
        console.log('🔍 Debug - filtered File objects:', imageFiles.length);
        
        // If no File objects found, check if images have .file property
        if (imageFiles.length === 0 && hasFileProperty) {
          console.log('🔍 Debug - Trying to extract files from .file property');
          
          // Debug: Check what's in .file property
          listingData.images.forEach((img: any, index: number) => {
            if (img && img.file) {
              console.log(`🔍 Debug - img[${index}].file:`, {
                type: typeof img.file,
                constructor: img.file?.constructor?.name,
                isFile: img.file instanceof File,
                keys: Object.keys(img.file || {}),
                value: img.file
              });
            }
          });
          
          // Eski sistem gibi: img.file'ı direkt kullan (instanceof File kontrolü yapma)
          const filesFromProperty = listingData.images
            .filter((img: any) => img && img.file)
            .map((img: any) => {
              // Eğer Blob ise File'a çevir
              if (img.file instanceof Blob && !(img.file instanceof File)) {
                const file = new File([img.file], img.name || `image_${Date.now()}.jpg`, {
                  type: img.file.type || 'image/jpeg'
                });
                console.log('🔧 Converted Blob to File:', { 
                  originalType: img.file.type, 
                  newType: file.type,
                  newName: file.name 
                });
                return file;
              }
              return img.file;
            });
          
          console.log('🔍 Debug - files from .file property:', filesFromProperty.length);
          
          if (filesFromProperty.length > 0) {
            const uploadResult = await uploadImagesWithProgress(
              filesFromProperty,
              currentUserId,
              (progress) => {
                if (onProgress) {
                  onProgress(Math.floor(progress * 0.5));
                }
              }
            );
            
            uploadedImages = uploadResult.images.map(img => img.url);
            console.log('✅ Images uploaded successfully from .file property:', uploadedImages);
          } else {
            console.warn('No valid File objects found in .file property, using original URLs');
            uploadedImages = listingData.images.filter((img: any) => typeof img === 'string');
          }
        } else if (imageFiles.length === 0) {
          console.warn('No valid File objects found in images, using original URLs');
          uploadedImages = listingData.images.filter((img: any) => typeof img === 'string');
        } else {
          const uploadResult = await uploadImagesWithProgress(
            imageFiles,
            currentUserId,
            (progress) => {
              // Update progress for image upload (0-50%)
              if (onProgress) {
                onProgress(Math.floor(progress * 0.5));
              }
            }
          );
          
          uploadedImages = uploadResult.images.map(img => img.url);
          console.log('✅ Images uploaded successfully:', uploadedImages);
        }
      } catch (error) {
        console.error('❌ Image upload failed, using original URLs:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error: error
        });
        // Fallback: use original image URLs
        uploadedImages = listingData.images.filter((img: any) => typeof img === 'string');
        console.log('🔄 Fallback - using original URLs:', uploadedImages);
      }
    }
    
    // Step 2: Prepare data for Listing Service
    const listingServiceData = {
      title: listingData.title,
      description: listingData.description,
      category: listingData.category,
      budget: listingData.budget,
      location: listingData.location,
      urgency: listingData.urgency || 'medium',
      acceptTerms: listingData.accept_terms || true,
      images: uploadedImages, // Use uploaded image URLs
      mainImageIndex: listingData.mainImageIndex,
      duration: listingData.duration,
      // Add other fields as needed
    };

    // Use Circuit Breaker to call Listing Service
    const { data: { jobId } } = await listingServiceCircuitBreaker.execute(
      () => listingServiceClient.createListing(listingServiceData, currentUserId)
    );
    
    console.log('📤 Job created with ID:', jobId);

          // Step 3: Poll job status for listing creation
          console.log('🔄 Starting job status polling for jobId:', jobId);
          const result = await pollJobStatus(
            jobId,
            currentUserId,
            (progress) => {
              console.log('📊 Job progress:', progress);
              // Update progress for listing creation (50-100%)
              if (onProgress) {
                onProgress(50 + Math.floor(progress * 0.5));
              }
            },
            (completedResult) => {
              console.log('✅ Listing created successfully:', completedResult);
              toast({
                title: "İlan Oluşturuldu! 🎉",
                description: "İlanınız başarıyla yayınlandı."
              });
            },
            (error) => {
              console.error('❌ Listing creation failed:', error);
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

    return result;
  } catch (error) {
    console.error('❌ Listing Service failed:', error);
    
    // Handle error with unified error handler
    const serviceError = handleListingServiceError(error);
    const userMessage = getUserFriendlyMessage(serviceError);
    
    toast({ 
      title: "İlan Oluşturulamadı", 
      description: userMessage, 
      variant: "destructive" 
    });

    // Log error for monitoring
    console.error('Listing Service Error Details:', {
      code: serviceError.code,
      message: serviceError.message,
      details: serviceError.details,
      timestamp: serviceError.timestamp
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