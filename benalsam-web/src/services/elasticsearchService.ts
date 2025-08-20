import { Listing, ApiResponse, QueryFilters } from '@/types';

// Admin backend üzerinden Elasticsearch API endpoint'i
const ADMIN_BACKEND_URL = import.meta.env.VITE_ADMIN_BACKEND_URL || 'http://localhost:3002';

export interface ElasticsearchSearchParams {
  query?: string;
  filters?: {
    category?: string;
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

    // Admin-backend'deki Elasticsearch endpoint'ini kullan
    const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/elasticsearch/search`, {
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
    
    // Admin-backend response formatını kontrol et
    if (!responseData.success || !responseData.data) {
      console.error('❌ Invalid Elasticsearch response format:', responseData);
      return await searchListingsWithSupabase(params, currentUserId);
    }
    
    const result: ElasticsearchSearchResult = responseData.data;

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
      .eq('status', 'active')
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

    return { data: sortedListings };

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
      category: params.filters?.category,
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
    const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/elasticsearch/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ Elasticsearch health check failed:', error);
    return false;
  }
};
