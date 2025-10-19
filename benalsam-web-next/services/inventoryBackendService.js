import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// Backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || 'http://192.168.1.10:3002';

// Error handling helper
const handleError = (error, title = "Hata", description = "Bir sorun oluştu") => {
  console.error(`Error in ${title}:`, error);
  toast({ 
    title: title, 
    description: error?.message || description, 
    variant: "destructive" 
  });
  return null;
};

// Validation helper
const validateInventoryData = (itemData) => {
  if (!itemData.name || !itemData.category) {
    toast({ title: "Eksik Bilgi", description: "Ürün adı ve kategorisi gereklidir.", variant: "destructive" });
    return false;
  }
  return true;
};

// Get auth token
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Backend API call with fallback to Supabase
const callBackendAPI = async (endpoint, options = {}, fallbackToSupabase = true) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Only add Content-Type for requests with body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Backend API call failed:', error);
    
    if (fallbackToSupabase) {
      console.log('Falling back to Supabase...');
      return null; // Signal to use Supabase fallback
    }
    
    throw error;
  }
};

export const fetchInventoryItems = async (userId) => {
  if (!userId) return [];
  
  try {
    // Try backend API first
    const backendResult = await callBackendAPI('/api/v1/inventory');
    
    if (backendResult && backendResult.success) {
      console.log('📦 [InventoryService] Backend API successful, items found:', backendResult.data?.length || 0);
      return backendResult.data || [];
    }
    
    // Fallback to Supabase
    console.log('📦 [InventoryService] Using Supabase fallback');
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
    
    console.log('📦 [InventoryService] Supabase fallback successful, items found:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in fetchInventoryItems:', error);
    toast({ title: "Beklenmedik Envanter Hatası", description: "Envanter yüklenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const addInventoryItem = async (itemData, currentUserId, onProgress) => {
  if (!validateInventoryData(itemData)) {
    return null;
  }

  try {
    // Prepare image URLs
    const mainImageUrl = itemData.images?.[0]?.url || itemData.images?.[0]?.preview;
    const additionalImageUrls = itemData.images?.slice(1).map(img => img.url || img.preview).filter(Boolean);

    // Try backend API first
    const backendResult = await callBackendAPI('/api/v1/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: itemData.name,
        category: itemData.category,
        description: itemData.description,
        condition: itemData.condition,
        estimated_value: itemData.estimated_value,
        tags: itemData.tags,
        is_available: itemData.is_available ?? true,
        is_featured: itemData.is_featured ?? false,
        main_image_url: mainImageUrl,
        additional_image_urls: additionalImageUrls,
      })
    });
    
    if (backendResult && backendResult.success) {
      console.log('📦 [InventoryService] Backend API add successful');
      return backendResult.data;
    }
    
    // Fallback to Supabase
    console.log('📦 [InventoryService] Using Supabase fallback for add');
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        user_id: currentUserId,
        name: itemData.name || '',
        category: itemData.category || '',
        description: itemData.description,
        condition: itemData.condition,
        estimated_value: itemData.estimated_value,
        tags: itemData.tags,
        is_available: itemData.is_available ?? true,
        is_featured: itemData.is_featured ?? false,
        main_image_url: mainImageUrl,
        additional_image_urls: additionalImageUrls,
        image_url: mainImageUrl,
      }])
      .select()
      .single();

    if (error) {
      return handleError(error, "Envanter Eklenemedi", error.message);
    }

    return data;
  } catch (error) {
    return handleError(error, "Beklenmedik Envanter Ekleme Hatası", "Envantere ürün eklenirken beklenmedik bir sorun oluştu");
  }
};

export const updateInventoryItem = async (itemData, currentUserId, onProgress) => {
  try {
    // Prepare image URLs - support both images array and direct URL fields
    const mainImageUrl = itemData.main_image_url || itemData.images?.[0]?.url || itemData.images?.[0]?.preview;
    const additionalImageUrls = itemData.additional_image_urls || itemData.images?.slice(1).map(img => img.url || img.preview).filter(Boolean);
    
    console.log('📦 [InventoryService] itemData:', itemData);
    console.log('📦 [InventoryService] mainImageUrl:', mainImageUrl);
    console.log('📦 [InventoryService] additionalImageUrls:', additionalImageUrls);

    // Try backend API first
    const requestBody = {
      name: itemData.name,
      category: itemData.category,
      description: itemData.description,
      condition: itemData.condition,
      estimated_value: itemData.estimated_value,
      tags: itemData.tags,
      is_available: itemData.is_available,
      is_featured: itemData.is_featured,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls,
    };
    
    console.log('📦 [InventoryService] Request body for update:', requestBody);
    
    const backendResult = await callBackendAPI(`/api/v1/inventory/${itemData.id}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody)
    });
    
    console.log('📦 [InventoryService] Backend API response:', backendResult);
    
    if (backendResult && backendResult.success) {
      console.log('📦 [InventoryService] Backend API update successful');
      return backendResult.data;
    }
    
    // Fallback to Supabase
    console.log('📦 [InventoryService] Using Supabase fallback for update');
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        name: itemData.name,
        category: itemData.category,
        description: itemData.description,
        condition: itemData.condition,
        estimated_value: itemData.estimated_value,
        tags: itemData.tags,
        is_available: itemData.is_available,
        is_featured: itemData.is_featured,
        main_image_url: mainImageUrl,
        additional_image_urls: additionalImageUrls,
        image_url: mainImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemData.id)
      .eq('user_id', currentUserId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating inventory item:', error);
      toast({ title: "Envanter Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in updateInventoryItem:', error);
    toast({ title: "Beklenmedik Envanter Güncelleme Hatası", description: "Envanter güncellenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const deleteInventoryItem = async (itemId, currentUserId) => {
  try {
    // Try backend API first
    const backendResult = await callBackendAPI(`/api/v1/inventory/${itemId}`, {
      method: 'DELETE'
    });
    
    if (backendResult && backendResult.success) {
      console.log('📦 [InventoryService] Backend API delete successful');
      toast({ 
        title: "Ürün Silindi! ✅", 
        description: "Ürün envanterinizden silindi." 
      });
      return true;
    }
    
    // Fallback to Supabase
    console.log('📦 [InventoryService] Using Supabase fallback for delete');
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

export const getInventoryItemById = async (itemId) => {
  if (!itemId) return null;

  try {
    // Try backend API first
    const backendResult = await callBackendAPI(`/api/v1/inventory/${itemId}`);
    
    if (backendResult && backendResult.success) {
      console.log('📦 [InventoryService] Backend API get by ID successful');
      return backendResult.data;
    }
    
    // Fallback to Supabase
    console.log('📦 [InventoryService] Using Supabase fallback for get by ID');
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('Error fetching inventory item:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getInventoryItemById:', error);
    return null;
  }
};

// Image upload to backend API
export const uploadInventoryImages = async (files, itemId, onProgress) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    
    // Add itemId to formData
    if (itemId) {
      formData.append('itemId', itemId);
    }

    const response = await fetch(`${BACKEND_API_URL}/api/v1/inventory/upload-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Backend upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('📦 [InventoryService] Backend image upload successful');
      return result.data.images.map((img) => ({
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        mediumUrl: img.mediumUrl
      }));
    } else {
      throw new Error(result.message || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ [InventoryService] Backend image upload failed:', error);
    throw error;
  }
};

// Additional functions
export const fetchUserInventory = fetchInventoryItems;

export const searchInventoryItems = async (userId, searchTerm, category) => {
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

    return data || [];
  } catch (error) {
    console.error('Error in searchInventoryItems:', error);
    return [];
  }
};

export const getInventoryStats = async (userId) => {
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
    
    const categories = {};
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
