import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Listing, ApiResponse } from '@/types';
import { logger } from '@/utils/production-logger';

// Error handling helper
const handleError = (error: unknown, title = "Hata", description = "Bir sorun oluştu") => {
  logger.error(`[FavoriteService] Error in ${title}`, { error });
  toast({ 
    title: title, 
    description: error?.message || description, 
    variant: "destructive" 
  });
  return null;
};

// Validation helper
const validateFavoriteData = (userId: string, listingId: string): boolean => {
  if (!userId || !listingId) {
    toast({ title: "Eksik Bilgi", description: "Kullanıcı veya ilan ID'si eksik.", variant: "destructive" });
    return false;
  }
  return true;
};

/**
 * Adds a listing to user's favorites.
 * 
 * @param userId - The UUID of the user
 * @param listingId - The UUID of the listing to add
 * @returns Promise resolving to favorite object or null if failed
 * @returns Returns object with `already_favorited: true` if listing is already in favorites
 * 
 * @example
 * ```typescript
 * const result = await addFavorite('user-123', 'listing-456')
 * if (result?.already_favorited) {
 *   console.log('Already in favorites')
 * }
 * ```
 */
export const addFavorite = async (userId: string, listingId: string) => {
  if (!validateFavoriteData(userId, listingId)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .insert([{ user_id: userId, listing_id: listingId }])
      .select()
      .single();

    if (error) {
      logger.error('[FavoriteService] Supabase error', { error })
      if (error.code === '23505') {
        toast({ title: "Bilgi", description: "Bu ilan zaten favorilerinizde." });
        return { listing_id: listingId, user_id: userId, already_favorited: true };
      }
      return handleError(error, "Favori Eklenemedi", error.message || JSON.stringify(error));
    }

    toast({ 
      title: "Favorilere Eklendi! ❤️", 
      description: "İlan favorilerinize eklendi." 
    });

    return data;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Favori eklenirken bir hata oluştu");
  }
};

/**
 * Removes a listing from user's favorites.
 * 
 * @param userId - The UUID of the user
 * @param listingId - The UUID of the listing to remove
 * @returns Promise resolving to true if successful, false otherwise
 * 
 * @example
 * ```typescript
 * const success = await removeFavorite('user-123', 'listing-456')
 * if (success) {
 *   console.log('Removed from favorites')
 * }
 * ```
 */
export const removeFavorite = async (userId: string, listingId: string): Promise<boolean> => {
  if (!validateFavoriteData(userId, listingId)) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) {
      return handleError(error, "Favori Kaldırılamadı", error.message) ? false : false;
    }

    toast({ 
      title: "Favorilerden Kaldırıldı", 
      description: "İlan favorilerinizden kaldırıldı." 
    });

    return true;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Favori kaldırılırken bir hata oluştu") ? false : false;
  }
};

/**
 * Checks if a listing is in user's favorites.
 * 
 * @param userId - The UUID of the user
 * @param listingId - The UUID of the listing to check
 * @returns Promise resolving to true if listing is favorited, false otherwise
 * 
 * @example
 * ```typescript
 * const favorited = await isFavorite('user-123', 'listing-456')
 * if (favorited) {
 *   console.log('This listing is in favorites')
 * }
 * ```
 */
export const isFavorite = async (userId: string, listingId: string): Promise<boolean> => {
  try {
    if (!userId || !listingId) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('listing_id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is expected
      logger.error('[FavoriteService] Error checking favorite status', { error });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('[FavoriteService] Error in isFavorite', { error });
    return false;
  }
};

/**
 * Fetches favorite status for multiple listings at once.
 * More efficient than calling isFavorite multiple times.
 * 
 * @param userId - The UUID of the user
 * @param listingIds - Array of listing UUIDs to check
 * @returns Promise resolving to object mapping listing IDs to favorite status
 * 
 * @example
 * ```typescript
 * const statuses = await fetchUserFavoriteStatusForListings('user-123', ['listing-1', 'listing-2'])
 * // { data: { 'listing-1': true, 'listing-2': false } }
 * ```
 */
export const fetchUserFavoriteStatusForListings = async (userId: string, listingIds: string[]): Promise<{ data: { [key: string]: boolean } }> => {
  if (!userId || !listingIds || listingIds.length === 0) {
    return { data: {} };
  }
  
  try {
    // Use supabaseAdmin for server-side (bypass RLS)
    // This function is called from queryFn which runs client-side, so we use API route instead
    const response = await fetch('/api/favorites/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingIds })
    });

    if (!response.ok) {
      logger.error('[FavoriteService] API error', { status: response.status });
      return { data: {} };
    }

    const result = await response.json();
    logger.debug('[FavoriteService] Fetched favorite statuses', { userId, count: Object.keys(result.data || {}).length, listingIds });

    return { data: result.data || {} };
  } catch (e) {
    logger.error('[FavoriteService] Unexpected error in fetchUserFavoriteStatusForListings', { error: e });
    return { data: {} };
  }
};

/**
 * Fetches all favorite listings for a user.
 * Returns listings with user profile information and favorite metadata.
 * 
 * @param userId - The UUID of the user
 * @returns Promise resolving to array of Listing objects with favorite metadata
 * 
 * @example
 * ```typescript
 * const favorites = await fetchUserFavoriteListings('user-123')
 * favorites.forEach(listing => {
 *   console.log(listing.title, listing.favorited_at)
 * })
 * ```
 */
export const fetchUserFavoriteListings = async (userId: string): Promise<Listing[]> => {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        listing_id,
        created_at,
        listings (
          *,
          profiles:profiles!listings_user_id_fkey (id, name, avatar_url, rating)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[FavoriteService] Error fetching favorite listings', { error });
      toast({ title: "Favori İlanlar Yüklenemedi", description: error.message, variant: "destructive" });
      return [];
    }
    
    return data?.map(fav => ({
        ...fav.listings,
        user: fav.listings.profiles,
        favorited_at: fav.created_at,
        is_favorited: true
    })) || [];
  } catch (e) {
    logger.error('[FavoriteService] Unexpected error in fetchUserFavoriteListings', { error: e });
    toast({ title: "Beklenmedik Hata", description: "Favori ilanlar yüklenirken bir hata oluştu.", variant: "destructive" });
    return [];
  }
};

/**
 * Toggles favorite status for a listing.
 * If listing is favorited, removes it. If not, adds it.
 * 
 * @param userId - The UUID of the user
 * @param listingId - The UUID of the listing to toggle
 * @returns Promise resolving to true if listing is now favorited, false if removed
 * 
 * @example
 * ```typescript
 * const isNowFavorite = await toggleFavorite('user-123', 'listing-456')
 * console.log(`Listing is now ${isNowFavorite ? 'favorited' : 'unfavorited'}`)
 * ```
 */
export const toggleFavorite = async (userId: string, listingId: string): Promise<boolean> => {
  try {
    if (!userId || !listingId) {
      return false;
    }

    // Önce mevcut durumu kontrol et
    const isCurrentlyFavorite = await isFavorite(userId, listingId);

    if (isCurrentlyFavorite) {
      // Eğer zaten favorilerdeyse, çıkar
      const success = await removeFavorite(userId, listingId);
      return false; // Return false because we removed it
    } else {
      // Değilse ekle
      const result = await addFavorite(userId, listingId);
      return !!result; // Return true if added successfully
    }
  } catch (error) {
    logger.error('[FavoriteService] Error in toggleFavorite', { error });
    return false;
  }
}; 