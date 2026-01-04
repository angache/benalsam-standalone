import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { processImagesForUploadService } from '@/services/uploadService';
import type { ImageFile } from '@/types/listing';

// Supabase error type
interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  statusCode?: number;
}

// Inventory item interface
interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description?: string;
  main_image_url?: string;
  additional_image_urls?: string[];
  image_url?: string;
  created_at: string;
  updated_at?: string;
  condition?: string;
  estimated_value?: number;
  tags?: string[];
  is_available?: boolean;
  is_featured?: boolean;
  view_count?: number;
  favorite_count?: number;
  offer_count?: number;
}

// Import unified error handler
import { handleError as unifiedHandleError } from '@/utils/errorHandler';

// Error handling helper
const handleError = (error: unknown, title: string = "Hata"): null => {
  unifiedHandleError(error, {
    component: 'inventory-service',
    action: title.toLowerCase().replace(/\s+/g, '-')
  });
  return null;
};

// Validation helper
const validateInventoryData = (itemData: Partial<InventoryItem>): boolean => {
  if (!itemData.name || !itemData.category) {
    toast({ title: "Eksik Bilgi", description: "Ürün adı ve kategorisi gereklidir.", variant: "destructive" });
    return false;
  }
  return true;
};

export const fetchInventoryItems = async (userId: string): Promise<InventoryItem[]> => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in fetchInventoryItems:', error);
      if (error.message.toLowerCase().includes('failed to fetch')) {
        toast({ title: "Ağ Hatası", description: "Envanter yüklenemedi. İnternet bağlantınızı kontrol edin.", variant: "destructive" });
      } else {
        toast({ title: "Envanter Yüklenemedi", description: "Envanteriniz yüklenirken bir sorun oluştu.", variant: "destructive" });
      }
      return [];
    }
    return (data || []) as InventoryItem[];
  } catch (error) {
    console.error('Error in fetchInventoryItems:', error);
    toast({ title: "Beklenmedik Envanter Hatası", description: "Envanter yüklenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const addInventoryItem = async (
  itemData: Partial<InventoryItem> & { images?: File[]; mainImageIndex?: number }, 
  currentUserId: string, 
  onProgress?: (progress: number) => void
): Promise<InventoryItem | null> => {
  if (!validateInventoryData(itemData)) {
    return null;
  }

  try {
    let mainImageUrl: string | null = null;
    let additionalImageUrls: string[] = [];
    
    try {
      // itemData.images is already File[] from useInventoryForm
      const images = itemData.images || [];
      let imageFiles: File[] = [];
      
      // Check if images is File[] or ImageItem[]
      // More robust check: File objects have name, size, type properties
      if (images.length > 0) {
        const firstItem = images[0];
        const isFile = firstItem instanceof File || 
                      (firstItem && typeof firstItem === 'object' && 
                       'name' in firstItem && 'size' in firstItem && 'type' in firstItem &&
                       typeof (firstItem as File).name === 'string' &&
                       typeof (firstItem as File).size === 'number');
        
        if (isFile) {
          // Already File[]
          imageFiles = images as File[];
        } else if (firstItem && typeof firstItem === 'object' && 'file' in firstItem) {
          // ImageFile[] format - extract File objects
          imageFiles = (images as unknown as ImageFile[])
            .filter((img: ImageFile) => img.file && !img.isUploaded)
            .map((img: ImageFile) => img.file)
            .filter((file): file is File => file instanceof File);
        } else {
          // Fallback: try to use as File[] if items look like Files
          imageFiles = images.filter((item: unknown): item is File => {
            if (item instanceof File) {
              return true;
            }
            if (item && typeof item === 'object') {
              return 'name' in item || 'size' in item;
            }
            return false;
          });
        }
      }
      
      console.log('📸 Processing images:', {
        totalImages: images.length,
        filesToUpload: imageFiles.length,
        mainImageIndex: itemData.mainImageIndex || 0,
        firstImageType: images.length > 0 ? typeof images[0] : 'none',
        firstImageIsFile: images.length > 0 ? images[0] instanceof File : false,
        imageFiles: imageFiles.map(f => ({ name: f.name, size: f.size }))
      });
      
      if (imageFiles.length > 0) {
        // Ensure mainImageIndex is valid (0-based index)
        const mainImageIndex = itemData.mainImageIndex ?? 0;
        const validMainImageIndex = mainImageIndex >= 0 && mainImageIndex < imageFiles.length 
          ? mainImageIndex 
          : 0;
        
        console.log('📤 Uploading images:', {
          imageFilesCount: imageFiles.length,
          mainImageIndex: validMainImageIndex,
          originalMainImageIndex: itemData.mainImageIndex
        });
        
        const imageResult = await processImagesForUploadService(
          imageFiles,
          validMainImageIndex,
      'inventory',
      currentUserId,
      onProgress
    );
        mainImageUrl = imageResult.mainImageUrl;
        additionalImageUrls = imageResult.additionalImageUrls;
        
        console.log('✅ Images processed:', {
          mainImageUrl,
          additionalImageUrlsCount: additionalImageUrls.length,
          additionalImageUrls
        });
      } else {
        console.warn('⚠️ No images to upload - imageFiles is empty');
      }
    } catch (imageError) {
      console.error('❌ Error processing images:', imageError);
      console.error('❌ Image error details:', {
        error: imageError,
        message: imageError instanceof Error ? imageError.message : String(imageError),
        stack: imageError instanceof Error ? imageError.stack : undefined
      });
      // Continue without images if image processing fails
      toast({ 
        title: "Görsel Yükleme Hatası", 
        description: "Görseller yüklenemedi, ancak ürün kaydedilecek.", 
        variant: "destructive" 
      });
    }

    // Build item object, removing undefined values (Supabase doesn't accept undefined)
    // Note: is_available and is_featured columns may not exist in the database schema
    const itemToInsert: Record<string, unknown> = {
      user_id: currentUserId,
      name: itemData.name || '',
      category: itemData.category || '',
    };
    
    // Only add optional fields if they have values
    if (itemData.description) {
      itemToInsert.description = itemData.description;
    }
    if (mainImageUrl) {
      itemToInsert.main_image_url = mainImageUrl;
      itemToInsert.image_url = mainImageUrl;
    }
    if (additionalImageUrls.length > 0) {
      itemToInsert.additional_image_urls = additionalImageUrls;
    }
    // Note: condition, estimated_value columns may not exist in the database schema
    // Uncomment if your database has these columns:
    // if (itemData.condition) {
    //   itemToInsert.condition = itemData.condition;
    // }
    // if (itemData.estimated_value !== undefined && itemData.estimated_value !== null) {
    //   itemToInsert.estimated_value = itemData.estimated_value;
    // }
    // Note: tags kolonu mevcut şemada yok; Supabase 42703 hatası veriyor.
    // İleride tabloya eklenirse burayı tekrar açabiliriz.
    // if (itemData.tags && Array.isArray(itemData.tags) && itemData.tags.length > 0) {
    //   itemToInsert.tags = itemData.tags;
    // }
    
    // Only add is_available and is_featured if they exist in the schema
    // These columns may not exist in all database schemas
    // Uncomment if your database has these columns:
    // if (itemData.is_available !== undefined) {
    //   itemToInsert.is_available = itemData.is_available ?? true;
    // }
    // if (itemData.is_featured !== undefined) {
    //   itemToInsert.is_featured = itemData.is_featured ?? false;
    // }

    // Log the data being inserted for debugging
    console.log('📦 Inserting inventory item:', {
      user_id: itemToInsert.user_id,
      name: itemToInsert.name,
      category: itemToInsert.category,
      hasDescription: !!itemToInsert.description,
      hasMainImage: !!itemToInsert.main_image_url,
      hasAdditionalImages: !!itemToInsert.additional_image_urls,
      itemToInsert,
      itemToInsertKeys: Object.keys(itemToInsert)
    });

    // Explicitly select only the columns that exist in the schema
    // Don't use .select() without parameters as it may try to select non-existent columns
    // Note: condition, estimated_value, tags, is_available, is_featured columns may not exist
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemToInsert])
      .select('id, user_id, name, category, description, main_image_url, additional_image_urls, image_url, created_at, updated_at')
      .single();

    if (error) {
      // Safely extract Supabase error details
      // Supabase errors can have different structures, so we need to check multiple properties
      const supabaseError = error as SupabaseError;
      const errorMessage = supabaseError?.message || supabaseError?.details || supabaseError?.hint || String(error) || 'Database error';
      const errorCode = supabaseError?.code || String(supabaseError?.statusCode) || 'UNKNOWN_ERROR';
      const errorDetails = supabaseError?.details || null;
      const errorHint = supabaseError?.hint || null;
      
      // Log error with all possible properties
      console.error('❌ Supabase error occurred:');
      console.error('  - Message:', errorMessage);
      console.error('  - Code:', errorCode);
      console.error('  - Details:', errorDetails);
      console.error('  - Hint:', errorHint);
      console.error('  - Full error object:', error);
      console.error('  - Error type:', typeof error);
      console.error('  - Error constructor:', error?.constructor?.name);
      if (error && typeof error === 'object') {
        console.error('  - Error keys:', Object.keys(error));
        console.error('  - Error values:', Object.values(error));
      }
      
      // Try to stringify the error object safely
      try {
        const errorString = JSON.stringify(error, null, 2);
        console.error('  - Error JSON:', errorString);
      } catch (e) {
        console.error('  - Could not stringify error:', e);
      }
      
      // Create a more descriptive error message
      let userFriendlyMessage = "Veritabanı hatası oluştu";
      if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        userFriendlyMessage = "Bu ürün zaten envanterinizde mevcut.";
      } else if (errorCode === '23503' || errorMessage.includes('foreign key')) {
        userFriendlyMessage = "Geçersiz kategori veya kullanıcı bilgisi.";
      } else if (errorCode === '23502' || errorMessage.includes('not null')) {
        userFriendlyMessage = "Gerekli alanlar eksik. Lütfen tüm zorunlu alanları doldurun.";
      } else if (errorCode === '42703' || errorMessage.includes('does not exist')) {
        // Column doesn't exist error
        const missingColumn = errorMessage.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i)?.[1];
        userFriendlyMessage = missingColumn 
          ? `Veritabanı şemasında '${missingColumn}' kolonu bulunamadı. Lütfen yöneticiye bildirin.`
          : "Veritabanı şeması hatası. Lütfen yöneticiye bildirin.";
      } else if (errorCode === '400' || errorMessage.includes('400')) {
        userFriendlyMessage = "Geçersiz veri formatı. Lütfen tüm alanları kontrol edin.";
      } else if (errorMessage && errorMessage !== 'Database error') {
        userFriendlyMessage = errorMessage;
      }
      
      toast({
        title: "Envanter Eklenemedi",
        description: userFriendlyMessage,
        variant: "destructive"
      });
      return handleError(
        new Error(errorMessage),
        "Envanter Eklenemedi"
      );
    }

    toast({ 
      title: "Ürün Eklendi! 🎉", 
      description: "Ürün envanterinize başarıyla eklendi." 
    });

    return data as InventoryItem;
  } catch (error) {
    console.error('Unexpected error in addInventoryItem:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error) || "Bilinmeyen bir hata oluştu";
    toast({
      title: "Beklenmedik Envanter Ekleme Hatası",
      description: errorMessage,
      variant: "destructive"
    });
    return handleError(
      error instanceof Error ? error : new Error(errorMessage),
      "Beklenmedik Envanter Ekleme Hatası"
    );
  }
};

export const updateInventoryItem = async (
  itemData: Partial<InventoryItem> & { 
    id: string; 
    images?: File[]; 
    mainImageIndex?: number; 
    initialImageUrls?: string[] 
  }, 
  currentUserId: string, 
  onProgress?: (progress: number) => void
): Promise<InventoryItem | null> => {
  try {
    const { mainImageUrl, additionalImageUrls } = await processImagesForUploadService(
      itemData.images || [],
      itemData.mainImageIndex || 0,
      'inventory',
      currentUserId,
      onProgress,
      itemData.initialImageUrls || []
    );
    
    // Build update object, removing undefined values (Supabase doesn't accept undefined)
    const itemToUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Only add fields that are provided
    if (itemData.name) {
      itemToUpdate.name = itemData.name;
    }
    if (itemData.category) {
      itemToUpdate.category = itemData.category;
    }
    if (itemData.description !== undefined) {
      itemToUpdate.description = itemData.description;
    }
    if (mainImageUrl) {
      itemToUpdate.main_image_url = mainImageUrl;
      itemToUpdate.image_url = mainImageUrl;
    }
    if (additionalImageUrls.length > 0) {
      itemToUpdate.additional_image_urls = additionalImageUrls;
    } else if (additionalImageUrls.length === 0 && mainImageUrl === null) {
      // If no images, set to null
      itemToUpdate.additional_image_urls = null;
      itemToUpdate.main_image_url = null;
      itemToUpdate.image_url = null;
    }
    if (itemData.condition !== undefined) {
      itemToUpdate.condition = itemData.condition;
    }
    if (itemData.estimated_value !== undefined && itemData.estimated_value !== null) {
      itemToUpdate.estimated_value = itemData.estimated_value;
    }
    if (itemData.tags !== undefined) {
      if (Array.isArray(itemData.tags) && itemData.tags.length > 0) {
        itemToUpdate.tags = itemData.tags;
      } else {
        itemToUpdate.tags = null;
      }
    }
    
    // Only add is_available and is_featured if they exist in the schema
    // These columns may not exist in all database schemas
    // Uncomment if your database has these columns:
    // if (itemData.is_available !== undefined) {
    //   itemToUpdate.is_available = itemData.is_available;
    // }
    // if (itemData.is_featured !== undefined) {
    //   itemToUpdate.is_featured = itemData.is_featured;
    // }

    const { data, error } = await supabase
      .from('inventory_items')
      .update(itemToUpdate)
      .eq('id', itemData.id)
      .eq('user_id', currentUserId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating inventory item:', error);
      toast({ title: "Envanter Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ 
      title: "Ürün Güncellendi! ✅", 
      description: "Ürün başarıyla güncellendi." 
    });

    return data as InventoryItem;
  } catch (error) {
    console.error('Unexpected error in updateInventoryItem:', error);
    toast({ title: "Beklenmedik Envanter Güncelleme Hatası", description: "Envanter güncellenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const deleteInventoryItem = async (itemId: string, currentUserId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', currentUserId);

    if (error) {
      toast({ title: "Envanter Silinemedi", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ 
      title: "Ürün Silindi! ✅", 
      description: "Ürün envanterinizden silindi." 
    });

    return true;
  } catch (error) {
    console.error('Unexpected error in deleteInventoryItem:', error);
    toast({ title: "Beklenmedik Envanter Silme Hatası", description: "Envanter silinirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return false;
  }
};

export const getInventoryItemById = async (itemId: string): Promise<InventoryItem | null> => {
  if (!itemId) return null;

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Error fetching inventory item:', error);
      return null;
    }

    return data as InventoryItem;
  } catch (error) {
    console.error('Error in getInventoryItemById:', error);
    return null;
  }
};

// Additional functions from mobile version
export const fetchUserInventory = fetchInventoryItems;

export const searchInventoryItems = async (
  userId: string, 
  searchTerm: string, 
  category?: string
): Promise<InventoryItem[]> => {
  if (!userId) return [];
  
  try {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching inventory items:', error);
      return [];
    }

    return (data || []) as InventoryItem[];
  } catch (error) {
    console.error('Error in searchInventoryItems:', error);
    return [];
  }
};

export const getInventoryStats = async (userId: string): Promise<{
  totalItems: number;
  availableItems: number;
  featuredItems: number;
  totalValue: number;
  categories: Record<string, number>;
} | null> => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting inventory stats:', error);
      return null;
    }

    const items = data || [];
    const totalItems = items.length;
    // Note: is_available and is_featured may not exist in the schema
    // If these columns don't exist, treat all items as available
    const availableItems = items.filter(item => item.is_available !== false).length;
    const featuredItems = items.filter(item => item.is_featured === true).length;
    const totalValue = items.reduce((sum, item) => sum + (item.estimated_value || 0), 0);
    
    const categories: Record<string, number> = {};
    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    return {
      totalItems,
      availableItems,
      featuredItems,
      totalValue,
      categories
    };
  } catch (error) {
    console.error('Error in getInventoryStats:', error);
    return null;
  }
}; 