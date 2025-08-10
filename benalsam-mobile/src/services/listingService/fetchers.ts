import { supabase  } from '../../services/supabaseClient';
import { addPremiumSorting, processFetchedListings } from './core';
import { Listing, ApiResponse, QueryFilters } from '../../types';
import { DatabaseError, handleError } from '../../utils/errors';

export const fetchListings = async (currentUserId: string | null = null): Promise<ApiResponse<Listing[]>> => {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      
    query = addPremiumSorting(query).order('created_at', { ascending: false });

    const { data: listingsData, error: listingsError } = await query;

    if (listingsError) {
      throw new DatabaseError('Failed to fetch listings', listingsError);
    }

    const processedListings = await processFetchedListings(listingsData || [], currentUserId);
    return { data: processedListings };

  } catch (error) {
    console.error('Unexpected error in fetchListings:', error);
    return handleError(error);
  }
};

export const fetchSingleListing = async (listingId: string, currentUserId: string | null = null): Promise<ApiResponse<Listing | null>> => {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch listing', error);
    }

    if (!listing) {
      return { data: null };
    }

    const processedListings = await processFetchedListings([listing], currentUserId);
    return { data: processedListings[0] || null };

  } catch (error) {
    console.error('Unexpected error in fetchSingleListing:', error);
    return handleError(error);
  }
};

export const fetchPopularListings = async (currentUserId: string | null = null): Promise<ApiResponse<Listing[]>> => {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gt('popularity_score', 0)
      .limit(10);

    query = addPremiumSorting(query).order('popularity_score', { ascending: false, nullsFirst: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw new DatabaseError('Failed to fetch popular listings', error);
    }

    const processedListings = await processFetchedListings(data || [], currentUserId);
    return { data: processedListings };
  } catch (error) {
    console.error('Unexpected error in fetchPopularListings:', error);
    return handleError(error);
  }
};

export const fetchMostOfferedListings = async (currentUserId: string | null = null) => {
  try {
    // Gerçek teklif sayısına göre sırala
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gt('offers_count', 0) // Sadece teklif alan ilanları
      .limit(10);

    query = addPremiumSorting(query).order('offers_count', { ascending: false, nullsFirst: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching most offered listings:', error);
      return [];
    }

    // Eğer teklif alan ilan yoksa, en yeni ilanları göster
    if (!data || data.length === 0) {
      let fallbackQuery = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(10);

      fallbackQuery = addPremiumSorting(fallbackQuery).order('created_at', { ascending: false });
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        console.error('Error fetching fallback listings:', fallbackError);
        return [];
      }
      
      return await processFetchedListings(fallbackData || [], currentUserId);
    }

    const processedData = await processFetchedListings(data || [], currentUserId);

    return processedData;
  } catch (e) {
    console.error('Unexpected error in fetchMostOfferedListings:', e);
    return [];
  }
};

export const fetchTodaysDeals = async (currentUserId: string | null = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gte('created_at', today.toISOString())
      .limit(10);

    query = addPremiumSorting(query).order('budget', { ascending: true, nullsFirst: false });
      
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching today\'s deals:', error);
      return [];
    }
    return await processFetchedListings(data, currentUserId);
  } catch (e) {
    console.error('Unexpected error in fetchTodaysDeals:', e);
    return [];
  }
};

export const fetchRecentlyViewedListings = async (currentUserId: string) => {
  // For mobile, we'll implement this later with local storage
  return [];
};

export const fetchListingsMatchingLastSearch = async (currentUserId: string) => {
  // For mobile, we'll implement this later with local storage
  return [];
};

export const fetchMyListings = async (userId: string): Promise<ApiResponse<Listing[]>> => {
  try {
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (listingsError) {
      throw new DatabaseError('Failed to fetch my listings', listingsError);
    }

    const processedListings = await processFetchedListings(listingsData || [], userId);
    return { data: processedListings };
  } catch (error) {
    console.error('Unexpected error in fetchMyListings:', error);
    return handleError(error);
  }
};

export const fetchFilteredListings = async (
  filterParams: QueryFilters,
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔍 fetchFilteredListings - Input params:', {
      filterParams,
      currentUserId,
      page,
      pageSize
    });

    // Use the new database function for better performance and attribute filtering
    const rpcParams = {
      search_query: filterParams.search || null,
      p_categories: filterParams.category ? [filterParams.category] : null,
      p_location: filterParams.location || null,
      p_urgency: filterParams.urgency || 'Tümü',
      min_price: filterParams.minBudget || null,
      max_price: filterParams.maxBudget || null,
      p_attributes: filterParams.attributes && Object.keys(filterParams.attributes).length > 0 ? JSON.stringify(filterParams.attributes) : null,
      p_page: page,
      p_page_size: pageSize,
      sort_key: filterParams.sortBy || 'created_at',
      sort_direction: filterParams.sortOrder || 'desc'
    };

    console.log('🔍 fetchFilteredListings - RPC params:', rpcParams);

    const { data, error } = await supabase.rpc('search_listings_with_attributes', rpcParams);

    console.log('🔍 fetchFilteredListings - Response:', { data, error });

    if (error) {
      console.error('❌ Error calling search_listings_with_attributes:', error);
      // Fallback to old method if the function doesn't exist
      return await fetchFilteredListingsFallback(filterParams, currentUserId, page, pageSize);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No data returned from search_listings_with_attributes');
      return { data: [] };
    }

    console.log('✅ fetchFilteredListings - Found', data.length, 'results');

    // Process the listings to add user data and favorite status
    const processedListings = await processFetchedListings(data, currentUserId);
    console.log('✅ fetchFilteredListings - Processed', processedListings.length, 'listings');
    return { data: processedListings };
  } catch (error) {
    console.error('Unexpected error in fetchFilteredListings:', error);
    return handleError(error);
  }
};

// Fallback method using the old approach
const fetchFilteredListingsFallback = async (
  filterParams: QueryFilters,
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<Listing[]>> => {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (filterParams.category) {
      query = query.eq('category', filterParams.category);
    }

    if (filterParams.minBudget) {
      query = query.gte('budget', filterParams.minBudget);
    }

    if (filterParams.maxBudget) {
      query = query.lte('budget', filterParams.maxBudget);
    }

    if (filterParams.location) {
      query = query.ilike('location', `%${filterParams.location}%`);
    }

    if (filterParams.urgency) {
      query = query.eq('urgency', filterParams.urgency);
    }

    // Attribute filtering
    if (filterParams.attributes && Object.keys(filterParams.attributes).length > 0) {
      Object.entries(filterParams.attributes).forEach(([key, values]) => {
        if (values && values.length > 0) {
          // JSONB array overlap operator to check if any of the selected values match
          const jsonPath = `$.${key}`;
          const valuesJson = JSON.stringify(values);
          query = query.filter(`attributes->>'${key}'`, 'in', `(${values.map(v => `"${v}"`).join(',')})`);
        }
      });
    }

    query = addPremiumSorting(query).order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch filtered listings', error);
    }

    const processedListings = await processFetchedListings(data || [], currentUserId);
    return { data: processedListings };
  } catch (error) {
    console.error('Unexpected error in fetchFilteredListingsFallback:', error);
    return handleError(error);
  }
}; 

// Attribute istatistikleri için yardımcı fonksiyon
export const fetchAttributeStatistics = async (category?: string): Promise<ApiResponse<any[]>> => {
  try {
    const { data, error } = await supabase.rpc('get_attribute_statistics', {
      p_category: category || null
    });

    if (error) {
      console.error('Error fetching attribute statistics:', error);
      return { data: [] };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Unexpected error in fetchAttributeStatistics:', error);
    return handleError(error);
  }
};

// Belirli attribute değerlerine göre arama
export const searchByAttributeValues = async (
  attributeKey: string,
  attributeValues: string[]
): Promise<ApiResponse<Listing[]>> => {
  try {
    const { data, error } = await supabase.rpc('search_by_attribute_values', {
      attribute_key: attributeKey,
      attribute_values: attributeValues
    });

    if (error) {
      console.error('Error searching by attribute values:', error);
      return { data: [] };
    }

    const processedListings = await processFetchedListings(data || [], null);
    return { data: processedListings };
  } catch (error) {
    console.error('Unexpected error in searchByAttributeValues:', error);
    return handleError(error);
  }
}; 