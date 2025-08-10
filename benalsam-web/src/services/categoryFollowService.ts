import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { UserProfile, Listing } from '@/types';

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
const validateCategoryData = (userId: string, categoryName: string): boolean => {
  if (!userId || !categoryName) {
    toast({ title: "Eksik Bilgi", description: "Kullanıcı ID'si veya kategori adı eksik.", variant: "destructive" });
    return false;
  }
  return true;
};

export const followCategory = async (userId: string, categoryName: string) => {
  if (!validateCategoryData(userId, categoryName)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_followed_categories')
      .insert([{ user_id: userId, category_name: categoryName }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Bilgi", description: "Bu kategoriyi zaten takip ediyorsunuz." });
        return { user_id: userId, category_name: categoryName, already_following: true };
      }
      return handleError(error, "Kategori Takip Edilemedi", error.message);
    }

    toast({ 
      title: "Kategori Takip Edildi! 📌", 
      description: `"${categoryName}" kategorisi başarıyla takip edildi.` 
    });

    return data;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Kategori takip edilirken bir hata oluştu");
  }
};

export const unfollowCategory = async (userId: string, categoryName: string): Promise<boolean> => {
  if (!validateCategoryData(userId, categoryName)) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_followed_categories')
      .delete()
      .eq('user_id', userId)
      .eq('category_name', categoryName);

    if (error) {
      return handleError(error, "Kategori Takipten Çıkılamadı", error.message) ? false : false;
    }

    toast({ 
      title: "Kategori Takipten Çıkıldı", 
      description: `"${categoryName}" kategorisi takipten çıkarıldı.` 
    });

    return true;
  } catch (error) {
    return handleError(error, "Beklenmedik Hata", "Kategori takipten çıkarılırken bir hata oluştu") ? false : false;
  }
};

export const checkIfFollowingCategory = async (userId: string, categoryName: string): Promise<boolean> => {
  if (!userId || !categoryName) {
    return false;
  }

  try {
    const { count, error } = await supabase
      .from('user_followed_categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category_name', categoryName);

    if (error) {
      console.error('Error in checkIfFollowingCategory:', error);
      return false;
    }
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error in checkIfFollowingCategory:', error);
    return false;
  }
};

export const fetchFollowedCategories = async (userId: string) => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('user_followed_categories')
      .select('category_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in fetchFollowedCategories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchFollowedCategories:', error);
    return [];
  }
};

export const fetchListingsForFollowedCategories = async (userId: string, limitPerCategory: number = 3, currentUserId: string | null = null) => {
  if (!userId) return [];
  
  try {
    const followedCategories = await fetchFollowedCategories(userId);
    if (!followedCategories || followedCategories.length === 0) {
      return [];
    }

    const listingsByCategories = await Promise.all(
      followedCategories.map(async (fc: any) => {
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*, profiles (id, name, avatar_url, rating, total_ratings, rating_sum)')
          .ilike('category', `${fc.category_name}%`) // Kategori ve alt kategorilerini de alır
          .order('created_at', { ascending: false })
          .limit(limitPerCategory);

        if (listingsError) {
          console.error(`Error fetching listings for category ${fc.category_name}:`, listingsError);
          return { category_name: fc.category_name, listings: [] };
        }
        
        let listingsWithUser = listingsData?.map((listing: any) => ({
          ...listing,
          user: listing.profiles,
          is_favorited: false
        })) || [];

        if (currentUserId && listingsWithUser.length > 0) {
          const listingIds = listingsWithUser.map(l => l.id);
          const { data: favoriteStatusesData, error: favError } = await supabase
            .from('user_favorites')
            .select('listing_id')
            .eq('user_id', currentUserId)
            .in('listing_id', listingIds);

          const favoriteStatuses: { [key: string]: boolean } = {};
          if (favoriteStatusesData) {
            favoriteStatusesData.forEach(fav => {
              favoriteStatuses[fav.listing_id] = true;
            });
          }
          
          listingsWithUser = listingsWithUser.map(l => ({
            ...l,
            is_favorited: favoriteStatuses[l.id] || false
          }));
        }

        return { category_name: fc.category_name, listings: listingsWithUser };
      })
    );
    return listingsByCategories.filter(cat => cat.listings.length > 0);
  } catch (e) {
    console.error('Unexpected error in fetchListingsForFollowedCategories:', e);
    toast({ title: "Beklenmedik Hata", description: "Takip edilen kategorilerin ilanları yüklenirken bir hata oluştu.", variant: "destructive" });
    return [];
  }
}; 