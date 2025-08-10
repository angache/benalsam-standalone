import { supabase  } from '../../services/supabaseClient';
import { fetchUserFavoriteStatusForListings } from '../favoriteService';
import { Listing, UserProfile, ApiResponse } from '../../types';
import { DatabaseError, ValidationError, handleError } from '../../utils/errors';

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
      throw new DatabaseError('Failed to fetch profiles for listings', profilesError);
    }

    if (profilesData) {
      profilesMap = new Map(profilesData.map(p => [p.id, p]));
    }
  }
  
  let listings = listingsData.map(listing => ({
    ...listing,
    user: listing.user_id ? profilesMap.get(listing.user_id) : undefined,
    is_favorited: false 
  })) as Listing[];

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
      throw new ValidationError('Search query is required');
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
        query = query.eq('category', category);
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
      throw new DatabaseError('Failed to search listings', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in searchListingsFullText:', error);
    return { error: handleError(error).toJSON().error };
  }
}; 