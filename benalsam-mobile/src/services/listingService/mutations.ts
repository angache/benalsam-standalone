import { supabase  } from '../../services/supabaseClient';
import { processImagesForSupabase } from '../imageService';
import { ApiResponse } from '../../types';
import { ValidationError, DatabaseError, handleError } from '../../utils/errors';
import { 
  Listing, 
  ListingStatus, 
  ListingLocation,
  ListingBudget 
} from 'benalsam-shared-types';
import { categoryService } from '../categoryService';

// CreateListingData interface'ini shared types'dan kullan
type CreateListingData = Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  images: string[];
  mainImageIndex: number;
  duration?: number;
};

export const createListing = async (listingData: CreateListingData): Promise<ApiResponse<Listing>> => {
  try {
    if (!listingData.user_id) {
      throw new ValidationError('User ID is required');
    }

    let mainImageUrl = '';
    let additionalImageUrls: string[] = [];

    if (listingData.images && listingData.images.length > 0) {
      // Unsplash URL'lerini kontrol et
      const isUnsplashImage = listingData.images[0].startsWith('https://images.unsplash.com');
      
      if (isUnsplashImage) {
        // Unsplash görsellerini direkt kullan
        mainImageUrl = listingData.images[0];
        additionalImageUrls = listingData.images.slice(1);
      } else {
        // Local görselleri yükle
        const imageResults = await processImagesForSupabase(
          listingData.images.map(uri => ({ uri, file: { uri }, isUploaded: false })),
          listingData.mainImageIndex,
          'item_images',
          'listings',
          listingData.user_id,
          listingData.category
        );
        
        if (!imageResults) {
          throw new Error('Image processing failed');
        }
        mainImageUrl = imageResults.mainImageUrl;
        additionalImageUrls = imageResults.additionalImageUrls;
      }
    }

    // Kategori ID'lerini API'den al
    const category = await categoryService.getCategoryByPath(listingData.category);
    const category_id = category?.id || null;
    const category_path = category ? [category.id] : null;

    const listingDataForDb = {
      title: listingData.title,
      description: listingData.description,
      category: listingData.category,
      category_id: category_id,
      category_path: category_path,
      budget: listingData.budget,
      location: listingData.location,
      urgency: listingData.urgency,
      user_id: listingData.user_id,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: ListingStatus.PENDING_APPROVAL, // İlan durumunu pending_approval olarak ayarla
      contact_preference: listingData.contact_preference,
      auto_republish: listingData.auto_republish,
      accept_terms: listingData.accept_terms,
      is_featured: listingData.is_featured,
      is_urgent_premium: listingData.is_urgent_premium,
      is_showcase: listingData.is_showcase,
      geolocation: listingData.geolocation,
      condition: listingData.condition || ['İkinci El'],
      attributes: listingData.attributes || {},
    };

    console.log('Creating listing with data:', listingDataForDb);

    const { data, error } = await supabase
      .from('listings')
      .insert(listingDataForDb)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new DatabaseError(`Failed to create listing: ${error.message}`, error);
    }

    if (!data) {
      throw new DatabaseError('No data returned from database');
    }

    return { data };
  } catch (error) {
    console.error('Error in createListing:', error);
    if (error instanceof Error) {
      return { error: { code: 'CREATE_LISTING_ERROR', message: error.message } };
    }
    return { error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } };
  }
};

type UpdateListingData = Partial<Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'>> & {
  mainImageUrl?: string;
  additionalImageUrls?: string[];
};

export const updateListing = async (
  listingId: string,
  updates: UpdateListingData,
  userId: string
): Promise<ApiResponse<Listing>> => {
  try {
    if (!listingId || !updates || !userId) {
      throw new ValidationError('Listing ID, updates and user ID are required');
    }

    // Eğer category güncelleniyorsa, category_id ve category_path'i de güncelle
    let category_id = undefined;
    let category_path = undefined;
    
    if (updates.category) {
      const category = await categoryService.getCategoryByPath(updates.category);
      category_id = category?.id || null;
      category_path = category ? [category.id] : null;
    }

    const dbUpdates: any = {
      title: updates.title,
      description: updates.description,
      category: updates.category,
      category_id: category_id,
      category_path: category_path,
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
      updated_at: new Date().toISOString(),
    };
    if (updates.condition !== undefined) {
      dbUpdates.condition = updates.condition;
    }
    if (updates.attributes !== undefined) {
      dbUpdates.attributes = updates.attributes;
    }

    if (updates.mainImageUrl !== undefined) {
      dbUpdates.main_image_url = updates.mainImageUrl;
      dbUpdates.image_url = updates.mainImageUrl;
    }
    if (updates.additionalImageUrls !== undefined) {
      dbUpdates.additional_image_urls = updates.additionalImageUrls;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(dbUpdates)
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error in updateListing:', error);
      throw new DatabaseError('Failed to update listing', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in updateListing:', error);
    if (error instanceof Error) {
      return { error: { code: 'UPDATE_LISTING_ERROR', message: error.message } };
    }
    return { error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } };
  }
};

export const updateListingStatus = async (
  listingId: string,
  userId: string,
  status: Listing['status'],
  reason: string | null = null
): Promise<ApiResponse<Listing>> => {
  try {
    if (!listingId || !userId || !status) {
      throw new ValidationError('Listing ID, user ID and status are required');
    }

    const updateData: any = {
      status,
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
      console.error('Error in updateListingStatus:', error);
      throw new DatabaseError('Failed to update listing status', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in updateListingStatus:', error);
    if (error instanceof Error) {
      return { error: { code: 'UPDATE_STATUS_ERROR', message: error.message } };
    }
    return { error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } };
  }
};

export const deleteListing = async (
  listingId: string,
  userId: string
): Promise<ApiResponse<boolean>> => {
  try {
    if (!listingId || !userId) {
      throw new ValidationError('Listing ID and user ID are required');
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error in deleteListing:', error);
      throw new DatabaseError('Failed to delete listing', error);
    }

    return { data: true };
  } catch (error) {
    console.error('Error in deleteListing:', error);
    if (error instanceof Error) {
      return { error: { code: 'DELETE_LISTING_ERROR', message: error.message } };
    }
    return { error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } };
  }
};

export const toggleListingStatus = async (listingId: string, newStatus: string, userId: string) => {
  if (!listingId || !newStatus || !userId) {
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
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in toggleListingStatus:', error);
    return null;
  }
}; 