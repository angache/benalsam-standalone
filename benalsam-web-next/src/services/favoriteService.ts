import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Listing, ApiResponse } from '@/types';

// Error handling helper
const handleError = (error: any, title = "Hata", description = "Bir sorun oluştu") => {
  console.error(`Error in ${title}:`, error);
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
      console.error('❌ [FAVORITE] Supabase error:', error)
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
      console.error('Error checking favorite status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isFavorite:', error);
    return false;
  }
};

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
      console.error('❌ [FAVORITE] API error:', response.status);
      return { data: {} };
    }

    const result = await response.json();
    console.log('✅ [FAVORITE] Fetched favorite statuses:', { userId, count: Object.keys(result.data || {}).length, listingIds });

    return { data: result.data || {} };
  } catch (e) {
    console.error('❌ [FAVORITE] Unexpected error in fetchUserFavoriteStatusForListings:', e);
    return { data: {} };
  }
};

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
      console.error('Error fetching favorite listings:', error);
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
    console.error('Unexpected error in fetchUserFavoriteListings:', e);
    toast({ title: "Beklenmedik Hata", description: "Favori ilanlar yüklenirken bir hata oluştu.", variant: "destructive" });
    return [];
  }
};

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
    console.error('Error in toggleFavorite:', error);
    return false;
  }
}; 