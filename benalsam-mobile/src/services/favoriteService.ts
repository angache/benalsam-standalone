import { supabase  } from '../services/supabaseClient';
import { Listing, ApiResponse } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

export const addFavorite = async (userId: string, listingId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!userId || !listingId) {
      throw new ValidationError('User ID and listing ID are required');
    }

    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        listing_id: listingId,
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      throw new DatabaseError('Failed to add to favorites');
    }

    return { data: true };
  } catch (error) {
    return handleError(error);
  }
};

export const removeFavorite = async (userId: string, listingId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!userId || !listingId) {
      throw new ValidationError('User ID and listing ID are required');
    }

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) {
      throw new DatabaseError('Failed to remove from favorites');
    }

    return { data: true };
  } catch (error) {
    return handleError(error);
  }
};

export const isFavorite = async (userId: string, listingId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!userId || !listingId) {
      throw new ValidationError('User ID and listing ID are required');
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('listing_id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is expected
      throw new DatabaseError('Failed to check favorite status');
    }

    return { data: !!data };
  } catch (error) {
    return handleError(error);
  }
};

export const fetchUserFavoriteListings = async (userId: string): Promise<ApiResponse<Listing[]>> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // First get favorite listing IDs
    const { data: favoriteIds, error: favoriteError } = await supabase
      .from('user_favorites')
      .select('listing_id')
      .eq('user_id', userId);

    if (favoriteError) {
      throw new DatabaseError('Failed to fetch favorite IDs');
    }

    if (!favoriteIds?.length) {
      return { data: [] };
    }

    // Then fetch the actual listings
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        user:user_id (
          id,
          name,
          avatar_url,
          rating,
          total_ratings,
          rating_sum
        )
      `)
      .in('id', favoriteIds.map(f => f.listing_id));

    if (error) {
      throw new DatabaseError('Failed to fetch favorite listings');
    }

    // Add is_favorited flag since these are all favorites
    const listingsWithFavorited = data?.map(listing => ({
      ...listing,
      is_favorited: true
    })) || [];

    return { data: listingsWithFavorited as Listing[] };
  } catch (error) {
    return handleError(error);
  }
};

export const fetchUserFavoriteStatusForListings = async (userId: string, listingIds: string[]): Promise<ApiResponse<{ [key: string]: boolean }>> => {
  try {
    if (!userId || !listingIds.length) {
      throw new ValidationError('User ID and listing IDs are required');
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('listing_id')
      .eq('user_id', userId)
      .in('listing_id', listingIds);

    if (error) {
      throw new DatabaseError('Failed to fetch favorite statuses');
    }

    const favoriteStatus = listingIds.reduce((acc, id) => {
      acc[id] = data?.some(fav => fav.listing_id === id) || false;
      return acc;
    }, {} as { [key: string]: boolean });

    return { data: favoriteStatus };
  } catch (error) {
    return handleError(error);
  }
};

export const toggleFavorite = async (userId: string, listingId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!userId || !listingId) {
      throw new ValidationError('User ID and listing ID are required');
    }

    // Önce mevcut durumu kontrol et
    const { data: existingFavorite } = await isFavorite(userId, listingId);

    if (existingFavorite) {
      // Eğer zaten favorilerdeyse, çıkar
      return removeFavorite(userId, listingId);
    } else {
      // Değilse ekle
      return addFavorite(userId, listingId);
    }
  } catch (error) {
    return handleError(error);
  }
}; 