import { Listing, ApiResponse, QueryFilters } from '@/types';
import { supabase } from '@/lib/supabaseClient';

// Search Service API endpoint'i
const SEARCH_SERVICE_URL = import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:3016';

export interface ElasticsearchSearchParams {
  query?: string;
  filters?: {
    category_id?: number; // ✅ Sadece category_id kullan
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    urgency?: string;
    attributes?: Record<string, string[]>;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface ElasticsearchSearchResult {
  hits: Array<{
    id: string;
    score: number;
    title: string;
    description: string;
    category: string;
    budget: number;
    location: string;
    urgency: string;
    attributes: any;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    popularity_score: number;
    is_premium: boolean;
    tags: string[];
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Elasticsearch üzerinden arama yapar (backend üzerinden)
 */
export const searchListingsWithElasticsearch = async (
  params: ElasticsearchSearchParams,
  currentUserId: string | null = null
): Promise<ApiResponse<Listing[]>> => {
  try {
    // Convert frontend params to Search Service expected payload
    const page = params.page || 1;
    const limit = params.limit || 20;
    const from = (page - 1) * limit;
    const query = (params.query && params.query.trim().length > 0) ? params.query : '*';
    const sortField = params.sort?.field || 'created_at';
    // Default to only active listings on homepage
    const filters = {
      ...(params.filters || {}),
      status: (params.filters as any)?.status || 'active'
    } as Record<string, any>;

    const servicePayload = {
      query,
      size: limit,
      from,
      sort: sortField,
      filters
    };

    console.log('🔍 Elasticsearch search - Payload:', servicePayload);

    // Call Search Service
    const response = await fetch(`${SEARCH_SERVICE_URL}/api/v1/search/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(servicePayload),
    });

    if (!response.ok) {
      console.error('❌ Elasticsearch API error:', response.status, response.statusText);
      // Fallback to Supabase search
      return await searchListingsWithSupabase(params, currentUserId);
    }

    const responseData = await response.json();

    // Validate response
    if (!responseData.success || !responseData.data) {
      console.error('❌ Invalid Search Service response format:', responseData);
      return await searchListingsWithSupabase(params, currentUserId);
    }

    // Normalize to hits array
    let esHits: any[] = [];
    let total = 0;
    if (Array.isArray(responseData.data)) {
      // Some wrappers may return an array of docs directly
      esHits = responseData.data;
      total = responseData.pagination?.total || esHits.length || 0;
    } else if (responseData.data?.hits?.hits) {
      esHits = responseData.data.hits.hits;
      // ES 7 returns total as object or number
      const totalObj = responseData.data.hits.total;
      total = typeof totalObj === 'number' ? totalObj : (totalObj?.value ?? esHits.length);
    } else {
      console.warn('⚠️ Unknown Search Service data shape. Falling back.');
      return await searchListingsWithSupabase(params, currentUserId);
    }

    // Convert to listing IDs
    if (!esHits || esHits.length === 0) {
      console.log('⚠️ No hits found in Elasticsearch');
      return { data: [] };
    }

    const listingIds = esHits
      .map((hit: any) => hit.id || hit._id || hit._source?.id)
      .filter(id => id && id !== 'undefined' && id !== undefined); // undefined değerleri filtrele
    
    if (listingIds.length === 0) {
      console.log('⚠️ No valid listing IDs found in Elasticsearch hits');
      return { data: [] };
    }
    
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) {
      console.error('❌ Error fetching listings from Supabase:', error);
      return { data: [] };
    }

    // Preserve ES order
    const sortedListings = listingIds
      .map(id => listings?.find(listing => listing.id === id))
      .filter(Boolean) as Listing[];

    console.log('✅ Elasticsearch search completed:', {
      hits: result.hits.length,
      total: result.total,
      listings: sortedListings.length
    });

    return {
      data: sortedListings,
      total
    };

  } catch (error) {
    console.error('❌ Unexpected error in Elasticsearch search:', error);
    // Fallback to Supabase search
    return await searchListingsWithSupabase(params, currentUserId);
  }
};

/**
 * Supabase fallback search (mevcut sistem)
 */
const searchListingsWithSupabase = async (
  params: ElasticsearchSearchParams,
  currentUserId: string | null = null
): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔄 Using Supabase fallback search');
    
    // Mevcut fetchFilteredListings fonksiyonunu kullan
    const { fetchFilteredListings } = await import('./listingService/fetchers');
    
    const filterParams: QueryFilters = {
      search: params.query,
      category: params.filters?.category_id, // Supabase'de category_id kullanılıyor
      location: params.filters?.location,
      minBudget: params.filters?.minBudget,
      maxBudget: params.filters?.maxBudget,
      urgency: params.filters?.urgency,
      attributes: params.filters?.attributes,
      sortBy: params.sort?.field || 'created_at',
      sortOrder: params.sort?.order || 'desc'
    };

    const page = params.page || 1;
    const limit = params.limit || 20;

    const result = await fetchFilteredListings(filterParams, currentUserId, page, limit);
    
    return { data: result.listings };
  } catch (error) {
    console.error('❌ Error in Supabase fallback search:', error);
    return { data: [] };
  }
};

/**
 * Elasticsearch health check
 */
export const checkElasticsearchHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SEARCH_SERVICE_URL}/api/v1/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ Search Service health check failed:', error);
    return false;
  }
};
