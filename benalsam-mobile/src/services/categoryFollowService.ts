import { supabase  } from '../services/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { UserProfile, Listing, ListingWithFavorite } from '../types';

// Error types
export class CategoryFollowError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'CategoryFollowError';
  }
}

export class ValidationError extends CategoryFollowError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends CategoryFollowError {
  constructor(message: string, pgError?: PostgrestError) {
    super(message, pgError?.code);
    this.name = 'DatabaseError';
  }
}

// Types and Interfaces
export interface FollowedCategory {
  user_id: string;
  category_name: string;
  created_at: string;
}

export interface CategoryWithListings {
  category_name: string;
  listings: ListingWithFavorite[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: CategoryFollowError | null;
}

// Service functions
export const followCategory = async (
  userId: string, 
  categoryName: string
): Promise<ApiResponse<FollowedCategory>> => {
  if (!userId || !categoryName) {
    return {
      data: null,
      error: new ValidationError('Missing userId or categoryName')
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('user_followed_categories')
      .insert([{ user_id: userId, category_name: categoryName }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          data: { user_id: userId, category_name: categoryName, created_at: new Date().toISOString() },
          error: null
        };
      }
      return {
        data: null,
        error: new DatabaseError('Error following category', error)
      };
    }
    
    return { data, error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: new CategoryFollowError(`Unexpected error in followCategory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
  }
};

export const unfollowCategory = async (
  userId: string, 
  categoryName: string
): Promise<ApiResponse<boolean>> => {
  if (!userId || !categoryName) {
    return {
      data: null,
      error: new ValidationError('Missing userId or categoryName')
    };
  }
  
  try {
    const { error } = await supabase
      .from('user_followed_categories')
      .delete()
      .eq('user_id', userId)
      .eq('category_name', categoryName);

    if (error) {
      return {
        data: null,
        error: new DatabaseError('Error unfollowing category', error)
      };
    }
    
    return { data: true, error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: new CategoryFollowError(`Unexpected error in unfollowCategory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
  }
};

export const checkIfFollowingCategory = async (
  userId: string, 
  categoryName: string
): Promise<ApiResponse<boolean>> => {
  if (!userId || !categoryName) {
    return {
      data: null,
      error: new ValidationError('Missing userId or categoryName')
    };
  }
  
  try {
    const { count, error } = await supabase
      .from('user_followed_categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category_name', categoryName);

    if (error) {
      return {
        data: null,
        error: new DatabaseError('Error checking category follow status', error)
      };
    }
    
    return { data: (count || 0) > 0, error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: new CategoryFollowError(`Unexpected error in checkIfFollowingCategory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
  }
};

export const fetchFollowedCategories = async (
  userId: string
): Promise<ApiResponse<FollowedCategory[]>> => {
  if (!userId) {
    return {
      data: null,
      error: new ValidationError('Missing userId')
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('user_followed_categories')
      .select('user_id, category_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: new DatabaseError('Error fetching followed categories', error)
      };
    }
    
    return { data: data || [], error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: new CategoryFollowError(`Unexpected error in fetchFollowedCategories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
  }
};

export const fetchListingsForFollowedCategories = async (
  userId: string, 
  limitPerCategory: number = 3, 
  currentUserId: string | null = null
): Promise<ApiResponse<CategoryWithListings[]>> => {
  if (!userId) {
    return {
      data: null,
      error: new ValidationError('Missing userId')
    };
  }
  
  try {
    const followedCategoriesResponse = await fetchFollowedCategories(userId);
    if (followedCategoriesResponse.error || !followedCategoriesResponse.data?.length) {
      return {
        data: [],
        error: followedCategoriesResponse.error
      };
    }

    const listingsByCategories = await Promise.all(
      followedCategoriesResponse.data.map(async (fc: FollowedCategory) => {
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*, profiles (id, name, avatar_url, rating, total_ratings, rating_sum)')
          .ilike('category', `${fc.category_name}%`)
          .order('created_at', { ascending: false })
          .limit(limitPerCategory);

        if (listingsError) {
          throw new DatabaseError(
            `Error fetching listings for category ${fc.category_name}`,
            listingsError
          );
        }
        
        let listingsWithUser = listingsData.map((listing: any) => ({
          ...listing,
          user: {
            id: listing.profiles.id,
            name: listing.profiles.name,
            avatar_url: listing.profiles.avatar_url,
            rating: listing.profiles.rating,
            total_ratings: listing.profiles.total_ratings,
            rating_sum: listing.profiles.rating_sum
          },
          is_favorited: false
        })) as ListingWithFavorite[];

        if (currentUserId && listingsWithUser.length > 0) {
          const listingIds = listingsWithUser.map(l => l.id);
          const { data: favoriteStatusesData, error: favError } = await supabase
            .from('user_favorites')
            .select('listing_id')
            .eq('user_id', currentUserId)
            .in('listing_id', listingIds);

          if (favError) {
            throw new DatabaseError('Error fetching favorite statuses', favError);
          }

          const favoriteStatuses: { [key: string]: boolean } = {};
          if (favoriteStatusesData) {
            favoriteStatusesData.forEach((fav: { listing_id: string }) => {
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
    
    const filteredListings = listingsByCategories.filter(
      (cat: CategoryWithListings) => cat.listings.length > 0
    );
    
    return { data: filteredListings, error: null };
  } catch (error: unknown) {
    if (error instanceof CategoryFollowError) {
      return { data: null, error };
    }
    return {
      data: null,
      error: new CategoryFollowError(`Unexpected error in fetchListingsForFollowedCategories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
  }
}; 