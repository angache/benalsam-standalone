import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { processImagesForUploadService } from '@/services/uploadService';

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
const handleError = (error: unknown, title: string = "Hata", description: string = "Bir sorun oluştu"): null => {
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
    const { mainImageUrl, additionalImageUrls } = await processImagesForUploadService(
      itemData.images || [],
      itemData.mainImageIndex || 0,
      'inventory',
      currentUserId,
      onProgress
    );

    const itemToInsert = {
      user_id: currentUserId,
      name: itemData.name || '',
      category: itemData.category || '',
      description: itemData.description,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
      image_url: mainImageUrl,
      condition: itemData.condition,
      estimated_value: itemData.estimated_value,
      tags: itemData.tags,
      is_available: itemData.is_available ?? true,
      is_featured: itemData.is_featured ?? false,
    };

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemToInsert])
      .select()
      .single();

    if (error) {
      return handleError(error, "Envanter Eklenemedi", error.message);
    }

    toast({ 
      title: "Ürün Eklendi! 🎉", 
      description: "Ürün envanterinize başarıyla eklendi." 
    });

    return data as InventoryItem;
  } catch (error) {
    return handleError(error, "Beklenmedik Envanter Ekleme Hatası", "Envantere ürün eklenirken beklenmedik bir sorun oluştu");
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
      onProgress
    );
    
    const itemToUpdate = {
      name: itemData.name,
      category: itemData.category,
      description: itemData.description,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
      image_url: mainImageUrl,
      condition: itemData.condition,
      estimated_value: itemData.estimated_value,
      tags: itemData.tags,
      is_available: itemData.is_available,
      is_featured: itemData.is_featured,
      updated_at: new Date().toISOString(),
    };

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
    const availableItems = items.filter(item => item.is_available).length;
    const featuredItems = items.filter(item => item.is_featured).length;
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