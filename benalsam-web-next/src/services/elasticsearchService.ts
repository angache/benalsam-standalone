import { Listing, ApiResponse, QueryFilters } from '@/types';
import { supabase } from '@/lib/supabase';
import { incrementSourceCount } from '@/lib/debugSource';
import { processFetchedListings } from './listingService/core';
import { logger } from '@/utils/production-logger';

// Search Service API endpoint'i
// URL format: https://api.benalsam.com/api/v1 (env'den)
// Endpoint'ler: /search/listings, /search/health, vb.
const SEARCH_SERVICE_URL = process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:3016/api/v1';
const ELASTICSEARCH_PUBLIC_URL = process.env.NEXT_PUBLIC_ELASTICSEARCH_PUBLIC_URL || 'http://localhost:3016/api/v1';

export interface ElasticsearchSearchParams {
  query?: string;
  filters?: {
    category_id?: number; // ✅ Sadece category_id kullan
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    urgency?: string;
    attributes?: Record<string, string[]>;
    // 🆕 Advanced filters
    dateRange?: string;
    featured?: boolean;
    showcase?: boolean;
    urgent?: boolean;
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
    attributes: Record<string, unknown>;
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

// Type helper for listings with debug source marker
interface ListingWithSource extends Listing {
  __src?: 'E' | 'S';
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
    interface SearchServicePayload {
      query: string;
      page: number;
      pageSize: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      categoryIds?: number[];
      location?: string;
      minPrice?: number;
      maxPrice?: number;
      urgency?: string;
      dateRange?: string;
      featured?: boolean;
      showcase?: boolean;
      urgent?: boolean;
    }

    const servicePayload: SearchServicePayload = {
      query,
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      // Add filters (Search Service expects these field names)
      categoryIds: params.filters?.category_id ? [params.filters.category_id] : undefined,
      location: params.filters?.location,
      minPrice: params.filters?.minBudget,
      maxPrice: params.filters?.maxBudget,
      urgency: params.filters?.urgency,
      // 🆕 Advanced filters
      dateRange: params.filters?.dateRange,
      featured: params.filters?.featured,
      showcase: params.filters?.showcase,
      urgent: params.filters?.urgent,
    };

    logger.debug('[ElasticsearchService] Search payload', { payload: servicePayload });

    // Call Search Service
    // URL: NEXT_PUBLIC_SEARCH_SERVICE_URL=https://api.benalsam.com/api/v1
    // Endpoint: /search/listings
    const searchEndpoint = '/search/listings';
    const response = await fetch(`${SEARCH_SERVICE_URL}${searchEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(servicePayload),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      // Handle different error statuses
      if (response.status === 429) {
        logger.warn('[ElasticsearchService] Search Service rate limit exceeded, using Supabase fallback');
        // Fallback to Supabase search
        return await searchListingsWithSupabase(params, currentUserId);
      }
      if (response.status === 500) {
        logger.warn('[ElasticsearchService] Search Service internal error (500), using Supabase fallback');
        // Fallback to Supabase search
        return await searchListingsWithSupabase(params, currentUserId);
      }
      logger.warn('[ElasticsearchService] Elasticsearch service unavailable, using Supabase fallback', {
        status: response.status,
        statusText: response.statusText
      });
      // Fallback to Supabase search
      return await searchListingsWithSupabase(params, currentUserId);
    }

    const responseData = await response.json();

    // Validate response
    if (!responseData.success || !responseData.data) {
      logger.error('[ElasticsearchService] Invalid Search Service response format', { responseData });
      return await searchListingsWithSupabase(params, currentUserId);
    }

    // Search Service returns full listing objects directly
    const docs: Listing[] = responseData.data as Listing[];
    const total = responseData.pagination?.total || docs.length || 0;

    if (!docs || docs.length === 0) {
      logger.debug('[ElasticsearchService] No hits found in Elasticsearch');
      return { data: [] };
    }

    // 🔍 DEBUG: Search Service RAW response (disabled after fix)

    // Process listings to add is_favorited and user profiles
    const processedListings = await processFetchedListings(docs, currentUserId);

    // Mark source for debug (only used in development)
    if (process.env.NODE_ENV !== 'production') {
      processedListings.forEach((l) => { 
        try { 
          (l as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
      incrementSourceCount('elasticsearch');
    }

    logger.debug('[ElasticsearchService] Elasticsearch search completed', {
      returned: processedListings.length,
      total,
      hasFavorites: processedListings.some(l => l.is_favorited)
    });

    return { data: processedListings, total };

  } catch (error) {
    // Silent fallback for network errors (ES service not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.debug('[ElasticsearchService] Elasticsearch service not available, using Supabase');
    } else {
      logger.error('[ElasticsearchService] Unexpected error in Elasticsearch search', { error });
    }
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
    logger.debug('[ElasticsearchService] Using Supabase fallback search');
    
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
    
    // Mark source for debug (only used in development)
    if (process.env.NODE_ENV !== 'production') {
      result.listings.forEach((l) => { 
        try { 
          (l as ListingWithSource).__src = 'S'; 
        } catch (_) {} 
      });
      incrementSourceCount('supabase');
    }
    
    return { data: result.listings };
  } catch (error) {
    logger.error('[ElasticsearchService] Error in Supabase fallback search', { error });
    return { data: [] };
  }
};

/**
 * Elasticsearch health check
 */
export const checkElasticsearchHealth = async (): Promise<boolean> => {
  try {
    // URL: NEXT_PUBLIC_SEARCH_SERVICE_URL=https://api.benalsam.com/api/v1
    // Endpoint: /search/health
    const healthEndpoint = '/search/health';
    const response = await fetch(`${SEARCH_SERVICE_URL}${healthEndpoint}`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    logger.error('[ElasticsearchService] Search Service health check failed', { error });
    return false;
  }
};

/**
 * Fetch single listing by id directly from Elasticsearch Service
 */
export const fetchListingByIdFromES = async (listingId: string): Promise<Listing | null> => {
  try {
    // URL: NEXT_PUBLIC_ELASTICSEARCH_PUBLIC_URL=https://api.benalsam.com/api/v1
    // Endpoint: /search/listings/{id}
    const listingEndpoint = `/search/listings/${listingId}`;
    const res = await fetch(`${ELASTICSEARCH_PUBLIC_URL}${listingEndpoint}`, {
      // Suppress 404 errors in console (normal for new listings not yet indexed)
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      // Silently fail for 404 (listing not indexed yet)
      return null;
    }
    const data = await res.json();
    const doc = data?.data as Listing | undefined;
    if (!doc) return null;
    if (process.env.NODE_ENV !== 'production') {
      try { 
        (doc as ListingWithSource).__src = 'E'; 
        incrementSourceCount('elasticsearch'); 
      } catch (_) {}
    }
    return doc;
  } catch {
    return null;
  }
};
