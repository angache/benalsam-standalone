import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { fetchUserFavoriteStatusForListings } from '@/services/favoriteService';
import { Listing, UserProfile, ApiResponse } from '@/types';

// ListingWithUser artık Listing'den extend etmiyor çünkü user ve is_favorited zaten Listing içinde var
export type ListingWithUser = Listing;

export const addPremiumSorting = (query: any) => {
  return query
    .order('is_urgent_premium', { ascending: false, nullsLast: true })
    .order('is_featured', { ascending: false, nullsLast: true })
    .order('is_showcase', { ascending: false, nullsLast: true })
    .order('upped_at', { ascending: false, nullsLast: true });
};

export const processFetchedListings = async (
  listingsData: Partial<Listing>[],
  currentUserId: string | null
): Promise<Listing[]> => {
  if (!listingsData || listingsData.length === 0) {
    return [];
  }

  const userIds = [...new Set(listingsData.map(l => l.user_id).filter(id => id))];
  
  let profilesMap = new Map<string, Partial<UserProfile>>();
  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, rating, total_ratings, rating_sum')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for listings:', profilesError);
      toast({ title: "Profil Bilgisi Hatası", description: "İlan sahiplerinin bilgileri yüklenirken bir sorun oluştu.", variant: "destructive" });
    } else if (profilesData) {
      profilesMap = new Map(profilesData.map(p => [p.id, p]));
    }
  }
  
  let listings = listingsData.map(listing => {
    // Combine main_image_url and additional_image_urls into images array
    const images = [
      listing.main_image_url,
      ...(listing.additional_image_urls || [])
    ].filter(Boolean) as string[]
    
    return {
      ...listing,
      images, // Add images array
      user: listing.user_id ? profilesMap.get(listing.user_id) : undefined,
      is_favorited: false 
    }
  }) as Listing[];

  if (currentUserId && listings.length > 0) {
    const listingIds = listings.map(l => l.id);
    const response = await fetchUserFavoriteStatusForListings(currentUserId, listingIds);
    const favoriteStatuses = response.data || {};
    listings = listings.map(l => ({
      ...l,
      is_favorited: favoriteStatuses[l.id] || false
    }));
  }
  
  return listings;
};

export const searchListingsFullText = async (
  searchQuery: string,
  options: {
    limit?: number;
    offset?: number;
    filters?: {
      category?: string;
      location?: string;
      minBudget?: number;
      maxBudget?: number;
      status?: string;
    };
  } = {}
): Promise<ApiResponse<ListingWithUser[]>> => {
  try {
    if (!searchQuery.trim()) {
      toast({ title: "Arama Hatası", description: "Arama terimi gerekli.", variant: "destructive" });
      return { data: [] };
    }

    let query = supabase
      .from('listings')
      .select(`
        *,
        user:profiles!listings_user_id_fkey (
          id,
          name,
          avatar_url,
          rating
        )
      `)
      .textSearch('fts', searchQuery);

    // Apply filters if provided
    if (options.filters) {
      const { category, location, minBudget, maxBudget, status } = options.filters;

      if (category) {
        // Use category_path for hierarchical filtering instead of category field
        query = query.ilike('category_path', `%${category}%`);
      }
      if (location) {
        query = query.eq('location', location);
      }
      if (minBudget) {
        query = query.gte('budget', minBudget);
      }
      if (maxBudget) {
        query = query.lte('budget', maxBudget);
      }
      if (status) {
        query = query.eq('status', status);
      }
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching listings:', error);
      toast({ title: "Arama Hatası", description: "İlanlar aranırken bir sorun oluştu.", variant: "destructive" });
      return { data: [] };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in searchListingsFullText:', error);
    toast({ title: "Beklenmedik Hata", description: "Arama yapılırken bir sorun oluştu.", variant: "destructive" });
    return { data: [] };
  }
}; 