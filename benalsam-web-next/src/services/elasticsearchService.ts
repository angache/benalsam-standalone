import { Listing, ApiResponse, QueryFilters } from '@/types';
import { supabase } from '@/lib/supabase';
import { incrementSourceCount } from '@/lib/debugSource';

// Search Service API endpoint'i
const SEARCH_SERVICE_URL = process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:3016';
const ELASTICSEARCH_PUBLIC_URL = process.env.NEXT_PUBLIC_ELASTICSEARCH_PUBLIC_URL || 'http://localhost:3006';

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
    const query = params.query || '';
    const sortBy = params.sort?.field || 'created_at';
    const sortOrder = params.sort?.order || 'desc';

    // Search Service expected payload
    const servicePayload = {
      query,
      page,
      pageSize: limit,
      sortBy,
      sortOrder
    } as any;

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

    // Search Service returns full listing objects directly
    const docs: Listing[] = responseData.data as Listing[];
    const total = responseData.pagination?.total || docs.length || 0;

    if (!docs || docs.length === 0) {
      console.log('⚠️ No hits found in Elasticsearch');
      return { data: [] };
    }

    const sortedListings = docs;

    // Mark source for debug (only used in development)
    if (import.meta.env.MODE !== 'production') {
      sortedListings.forEach((l: any) => { try { l.__src = 'E'; } catch (_) {} });
      incrementSourceCount('E', sortedListings.length);
    }

    console.log('✅ Elasticsearch search completed:', {
      returned: sortedListings.length,
      total
    });

    return { data: sortedListings, total };

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

/**
 * Fetch single listing by id directly from Elasticsearch Service
 */
export const fetchListingByIdFromES = async (listingId: string): Promise<Listing | null> => {
  try {
    const res = await fetch(`${ELASTICSEARCH_PUBLIC_URL}/api/v1/search/listings/${listingId}`, {
      // Suppress 404 errors in console (normal for new listings not yet indexed)
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      // Silently fail for 404 (listing not indexed yet)
      return null;
    }
    const data = await res.json();
    const doc = data?.data;
    if (!doc) return null;
    if (import.meta.env.MODE !== 'production') {
      try { (doc as any).__src = 'E'; incrementSourceCount('E', 1); } catch (_) {}
    }
    return doc as Listing;
  } catch {
    return null;
  }
};
