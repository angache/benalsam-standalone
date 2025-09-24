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
    console.log('🔍 Elasticsearch search - Params:', params);

    // Search Service endpoint'ini kullan
    const response = await fetch(`${SEARCH_SERVICE_URL}/api/v1/search/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('❌ Elasticsearch API error:', response.status, response.statusText);
      // Fallback to Supabase search
      return await searchListingsWithSupabase(params, currentUserId);
    }

    const responseData = await response.json();
    
    // Search Service response formatını kontrol et
    if (!responseData.success || !responseData.data) {
      console.error('❌ Invalid Search Service response format:', responseData);
      return await searchListingsWithSupabase(params, currentUserId);
    }
    
    // Search Service response'unu Elasticsearch formatına çevir
    const result: ElasticsearchSearchResult = {
      hits: responseData.data,
      total: responseData.pagination?.total || responseData.data.length,
      page: responseData.pagination?.page || 1,
      limit: responseData.pagination?.pageSize || 20,
      totalPages: responseData.pagination?.totalPages || 1
    };

    // Elasticsearch sonuçlarını Supabase'den tam listing verilerine çevir
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in Elasticsearch');
      return { data: [] };
    }
    
    const listingIds = result.hits.map(hit => hit.id);
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) {
      console.error('❌ Error fetching listings from Supabase:', error);
      return { data: [] };
    }

    // Elasticsearch'teki sıralamayı koru
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
      total: result.total 
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
