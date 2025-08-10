import { supabase  } from '../services/supabaseClient';
import { processImagesForSupabase } from './imageService';

export const fetchInventoryItems = async (userId: string) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
    return data;
  } catch (e) {
    console.error('Unexpected error in fetchInventoryItems:', e);
    return [];
  }
};

export const addInventoryItem = async (itemData: any, currentUserId: string, onProgress?: (progress: number) => void) => {
  try {
    const { mainImageUrl, additionalImageUrls } = await processImagesForSupabase(
      itemData.images,
      itemData.mainImageIndex,
      'item_images',
      'inventory',
      currentUserId,
      itemData.category,
      onProgress
    );

    const itemToInsert = {
      user_id: currentUserId,
      name: itemData.name,
      category: itemData.category,
      description: itemData.description,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
      image_url: mainImageUrl, 
    };

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error adding inventory item:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Unexpected error in addInventoryItem:', e);
    
    // Authentication session expired error'ını kontrol et
    if (e instanceof Error && e.message.includes('Authentication session expired')) {
      throw new Error('SESSION_EXPIRED');
    }
    
    return null;
  }
};

export const updateInventoryItem = async (itemData: any, currentUserId: string, onProgress?: (progress: number) => void) => {
  try {
    const { mainImageUrl, additionalImageUrls } = await processImagesForSupabase(
      itemData.images,
      itemData.mainImageIndex,
      'item_images',
      'inventory',
      currentUserId,
      itemData.category,
      onProgress,
      itemData.initialImageUrls
    );
    
    const itemToUpdate = {
      name: itemData.name,
      category: itemData.category,
      description: itemData.description,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
      image_url: mainImageUrl,
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
      return null;
    }
    return data;
  } catch (e) {
    console.error('Unexpected error in updateInventoryItem:', e);
    
    // Authentication session expired error'ını kontrol et
    if (e instanceof Error && e.message.includes('Authentication session expired')) {
      throw new Error('SESSION_EXPIRED');
    }
    
    return null;
  }
};

export const deleteInventoryItem = async (itemId: string, currentUserId: string) => {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', currentUserId);

    if (error) {
      return false;
    }
    return true;
  } catch (e) {
    console.error('Unexpected error in deleteInventoryItem:', e);
    return false;
  }
};

export const getInventoryItemById = async (itemId: string) => {
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

    return data;
  } catch (error) {
    console.error('Error in getInventoryItemById:', error);
    return null;
  }
};

// Alias for fetchInventoryItems to match web version
export const fetchUserInventory = fetchInventoryItems; 