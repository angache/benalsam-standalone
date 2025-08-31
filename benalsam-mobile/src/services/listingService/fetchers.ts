import { supabase  } from '../../services/supabaseClient';
import { addPremiumSorting, processFetchedListings } from './core';
import { Listing, ApiResponse, QueryFilters } from '../../types';
import { DatabaseError, handleError } from '../../utils/errors';

export const fetchListings = async (currentUserId: string | null = null): Promise<ApiResponse<Listing[]>> => {
  try {
    // Backend API'yi kullan
    const backendUrl = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;
    if (!backendUrl) {
      console.log('⚠️ Backend URL not configured, falling back to Supabase');
      return await fetchListingsFromSupabase(currentUserId);
    }

    console.log('🔍 fetchListings - Using Backend API:', backendUrl);

    const response = await fetch(`${backendUrl}/api/v1/elasticsearch/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        filters: {},
        page: 1,
        limit: 20
      }),
    });

    if (!response.ok) {
      console.log('⚠️ Backend API failed, falling back to Supabase');
      return await fetchListingsFromSupabase(currentUserId);
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.log('⚠️ Invalid backend response, falling back to Supabase');
      return await fetchListingsFromSupabase(currentUserId);
    }

    const result = responseData.data;
    
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in backend API');
      return { data: [] };
    }

    // Backend'den gelen verileri işle
    const processedListings = await processFetchedListings(result.hits, currentUserId);
    return { data: processedListings };

  } catch (error) {
    console.error('❌ Backend API error, falling back to Supabase:', error);
    return await fetchListingsFromSupabase(currentUserId);
  }
};

// Fallback function using Supabase
const fetchListingsFromSupabase = async (currentUserId: string | null = null): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔄 fetchListings - Using Supabase fallback');
    
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
    console.error('❌ Supabase fallback error:', error);
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
    // Backend API'yi kullan
    const backendUrl = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;
    if (!backendUrl) {
      console.log('⚠️ Backend URL not configured, falling back to Supabase');
      return await fetchPopularListingsFromSupabase(currentUserId);
    }

    console.log('🔍 fetchPopularListings - Using Backend API:', backendUrl);

    const response = await fetch(`${backendUrl}/api/v1/elasticsearch/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        filters: {},
        page: 1,
        limit: 10,
        sort: {
          field: 'popularity_score',
          order: 'desc'
        }
      }),
    });

    if (!response.ok) {
      console.log('⚠️ Backend API failed, falling back to Supabase');
      return await fetchPopularListingsFromSupabase(currentUserId);
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.log('⚠️ Invalid backend response, falling back to Supabase');
      return await fetchPopularListingsFromSupabase(currentUserId);
    }

    const result = responseData.data;
    
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in backend API');
      return { data: [] };
    }

    // Backend'den gelen verileri işle
    const processedListings = await processFetchedListings(result.hits, currentUserId);
    return { data: processedListings };
  } catch (error) {
    console.error('❌ Backend API error, falling back to Supabase:', error);
    return await fetchPopularListingsFromSupabase(currentUserId);
  }
};

// Fallback function using Supabase
const fetchPopularListingsFromSupabase = async (currentUserId: string | null = null): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔄 fetchPopularListings - Using Supabase fallback');
    
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
    console.error('❌ Supabase fallback error:', error);
    return handleError(error);
  }
};

export const fetchMostOfferedListings = async (currentUserId: string | null = null) => {
  try {
    // Backend API'yi kullan
    const backendUrl = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;
    if (!backendUrl) {
      console.log('⚠️ Backend URL not configured, falling back to Supabase');
      return await fetchMostOfferedListingsFromSupabase(currentUserId);
    }

    console.log('🔍 fetchMostOfferedListings - Using Backend API:', backendUrl);

    const response = await fetch(`${backendUrl}/api/v1/elasticsearch/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        filters: {
          offers_count: {
            gt: 0
          }
        },
        page: 1,
        limit: 10,
        sort: {
          field: 'offers_count',
          order: 'desc'
        }
      }),
    });

    if (!response.ok) {
      console.log('⚠️ Backend API failed, falling back to Supabase');
      return await fetchMostOfferedListingsFromSupabase(currentUserId);
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.log('⚠️ Invalid backend response, falling back to Supabase');
      return await fetchMostOfferedListingsFromSupabase(currentUserId);
    }

    const result = responseData.data;
    
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in backend API, using fallback');
      return await fetchMostOfferedListingsFallbackFromSupabase(currentUserId);
    }

    // Backend'den gelen verileri işle
    const processedListings = await processFetchedListings(result.hits, currentUserId);
    return processedListings;
  } catch (error) {
    console.error('❌ Backend API error, falling back to Supabase:', error);
    return await fetchMostOfferedListingsFromSupabase(currentUserId);
  }
};

// Fallback function using Supabase
const fetchMostOfferedListingsFromSupabase = async (currentUserId: string | null = null) => {
  try {
    console.log('🔄 fetchMostOfferedListings - Using Supabase fallback');
    
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
      console.error('❌ Supabase fallback error:', error);
      return [];
    }

    // Eğer teklif alan ilan yoksa, en yeni ilanları göster
    if (!data || data.length === 0) {
      return await fetchMostOfferedListingsFallbackFromSupabase(currentUserId);
    }

    const processedData = await processFetchedListings(data || [], currentUserId);
    return processedData;
  } catch (error) {
    console.error('❌ Supabase fallback error:', error);
    return await fetchMostOfferedListingsFallbackFromSupabase(currentUserId);
  }
};

// Fallback to newest listings if no offered listings found
const fetchMostOfferedListingsFallbackFromSupabase = async (currentUserId: string | null = null) => {
  try {
    console.log('🔄 fetchMostOfferedListings - Using newest listings fallback');
    
    let fallbackQuery = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .limit(10);

    fallbackQuery = addPremiumSorting(fallbackQuery).order('created_at', { ascending: false });
    
    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    
    if (fallbackError) {
      console.error('❌ Supabase fallback error:', fallbackError);
      return [];
    }
    
    return await processFetchedListings(fallbackData || [], currentUserId);
  } catch (error) {
    console.error('❌ Supabase fallback error:', error);
    return [];
  }
};

export const fetchTodaysDeals = async (currentUserId: string | null = null) => {
  try {
    // Backend API'yi kullan
    const backendUrl = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;
    if (!backendUrl) {
      console.log('⚠️ Backend URL not configured, falling back to Supabase');
      return await fetchTodaysDealsFromSupabase(currentUserId);
    }

    console.log('🔍 fetchTodaysDeals - Using Backend API:', backendUrl);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const response = await fetch(`${backendUrl}/api/v1/elasticsearch/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        filters: {
          created_at: {
            gte: today.toISOString()
          }
        },
        page: 1,
        limit: 10,
        sort: {
          field: 'budget',
          order: 'asc'
        }
      }),
    });

    if (!response.ok) {
      console.log('⚠️ Backend API failed, falling back to Supabase');
      return await fetchTodaysDealsFromSupabase(currentUserId);
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.log('⚠️ Invalid backend response, falling back to Supabase');
      return await fetchTodaysDealsFromSupabase(currentUserId);
    }

    const result = responseData.data;
    
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in backend API');
      return [];
    }

    // Backend'den gelen verileri işle
    const processedListings = await processFetchedListings(result.hits, currentUserId);
    return processedListings;
  } catch (error) {
    console.error('❌ Backend API error, falling back to Supabase:', error);
    return await fetchTodaysDealsFromSupabase(currentUserId);
  }
};

// Fallback function using Supabase
const fetchTodaysDealsFromSupabase = async (currentUserId: string | null = null) => {
  try {
    console.log('🔄 fetchTodaysDeals - Using Supabase fallback');
    
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
      console.error('❌ Supabase fallback error:', error);
      return [];
    }
    return await processFetchedListings(data, currentUserId);
  } catch (error) {
    console.error('❌ Supabase fallback error:', error);
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

    // Backend API'yi kullan
    const backendUrl = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;
    if (!backendUrl) {
      console.log('⚠️ Backend URL not configured, falling back to Supabase');
      return await fetchFilteredListingsFromSupabase(filterParams, currentUserId, page, pageSize);
    }

    console.log('🔍 fetchFilteredListings - Using Backend API:', backendUrl);

    const response = await fetch(`${backendUrl}/api/v1/elasticsearch/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: filterParams.search || '',
        filters: {
          category: filterParams.category,
          location: filterParams.location,
          minBudget: filterParams.minBudget,
          maxBudget: filterParams.maxBudget,
          urgency: filterParams.urgency,
          attributes: filterParams.attributes
        },
        page: page,
        limit: pageSize,
        sort: {
          field: filterParams.sortBy || 'created_at',
          order: filterParams.sortOrder || 'desc'
        }
      }),
    });

    if (!response.ok) {
      console.log('⚠️ Backend API failed, falling back to Supabase');
      return await fetchFilteredListingsFromSupabase(filterParams, currentUserId, page, pageSize);
    }

    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.log('⚠️ Invalid backend response, falling back to Supabase');
      return await fetchFilteredListingsFromSupabase(filterParams, currentUserId, page, pageSize);
    }

    const result = responseData.data;
    
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in backend API');
      return { data: [] };
    }

    console.log('✅ fetchFilteredListings - Found', result.hits.length, 'results from Backend API');

    // Backend'den gelen verileri işle
    const processedListings = await processFetchedListings(result.hits, currentUserId);
    console.log('✅ fetchFilteredListings - Processed', processedListings.length, 'listings');
    return { data: processedListings };
  } catch (error) {
    console.error('❌ Backend API error, falling back to Supabase:', error);
    return await fetchFilteredListingsFromSupabase(filterParams, currentUserId, page, pageSize);
  }
};

// Fallback function using Supabase
const fetchFilteredListingsFromSupabase = async (
  filterParams: QueryFilters,
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔄 fetchFilteredListings - Using Supabase fallback');

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

    console.log('🔄 fetchFilteredListings - RPC params:', rpcParams);

    const { data, error } = await supabase.rpc('search_listings_with_attributes', rpcParams);

    console.log('🔄 fetchFilteredListings - Response:', { data, error });

    if (error) {
      console.error('❌ Error calling search_listings_with_attributes:', error);
      // Fallback to old method if the function doesn't exist
      return await fetchFilteredListingsFallback(filterParams, currentUserId, page, pageSize);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No data returned from search_listings_with_attributes');
      return { data: [] };
    }

    console.log('✅ fetchFilteredListings - Found', data.length, 'results from Supabase');

    // Process the listings to add user data and favorite status
    const processedListings = await processFetchedListings(data, currentUserId);
    console.log('✅ fetchFilteredListings - Processed', processedListings.length, 'listings');
    return { data: processedListings };
  } catch (error) {
    console.error('❌ Supabase fallback error:', error);
    return await fetchFilteredListingsFallback(filterParams, currentUserId, page, pageSize);
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