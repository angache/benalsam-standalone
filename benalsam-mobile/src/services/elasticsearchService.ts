import { supabase } from './supabaseClient';
import { Listing, ApiResponse, QueryFilters } from '../types';
import { processFetchedListings } from './listingService/core';

// Elasticsearch API endpoint (admin-backend üzerinden)
const ELASTICSEARCH_API_URL = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL;

if (!ELASTICSEARCH_API_URL) {
  throw new Error('EXPO_PUBLIC_ADMIN_BACKEND_URL environment variable is not set');
}

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
 * Elasticsearch üzerinden arama yapar
 */
export const searchListingsWithElasticsearch = async (
  params: ElasticsearchSearchParams,
  currentUserId: string | null = null
): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔍 Elasticsearch search - Params:', params);

    // Admin-backend'deki Elasticsearch endpoint'ini kullan
    const response = await fetch(`${ELASTICSEARCH_API_URL}/api/v1/elasticsearch/search`, {
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
    // Search response received
    
    // Admin-backend response formatını kontrol et
    if (!responseData.success || !responseData.data) {
      console.error('❌ Invalid Elasticsearch response format:', responseData);
      return await searchListingsWithSupabase(params, currentUserId);
    }
    
    const result: ElasticsearchSearchResult = responseData.data;
    // Search result processed

    // Elasticsearch sonuçlarını Supabase'den tam listing verilerine çevir
    if (!result.hits || result.hits.length === 0) {
      console.log('⚠️ No hits found in Elasticsearch');
      return { data: [] };
    }
    
    const listingIds = result.hits.map(hit => hit.id);
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds);

    if (error) {
      console.error('❌ Error fetching listings from Supabase:', error);
      return { data: [] };
    }

    // Elasticsearch sıralamasını koru
    const listingsMap = new Map(listings?.map(l => [l.id, l]) || []);
    const orderedListings = result.hits
      .map(hit => listingsMap.get(hit.id))
      .filter(Boolean) as Listing[];

    // User data ve favorite status ekle
    const processedListings = await processFetchedListings(orderedListings, currentUserId);

    return { data: processedListings };
  } catch (error) {
    console.error('❌ Elasticsearch search error:', error);
    // Fallback to Supabase search
    return await searchListingsWithSupabase(params, currentUserId);
  }
};

/**
 * Supabase fallback arama (mevcut sistem)
 */
const searchListingsWithSupabase = async (
  params: ElasticsearchSearchParams,
  currentUserId: string | null = null
): Promise<ApiResponse<Listing[]>> => {
  try {
    console.log('🔄 Falling back to Supabase search');
    
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
      sortOrder: params.sort?.order || 'desc',
    };

    return await fetchFilteredListings(filterParams, currentUserId, params.page || 1, params.limit || 20);
  } catch (error) {
    console.error('❌ Supabase fallback search error:', error);
    return { data: [] };
  }
};

/**
 * Elasticsearch bağlantı durumunu kontrol eder
 */
export const checkElasticsearchHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${ELASTICSEARCH_API_URL}/api/v1/elasticsearch/health`);
    return response.ok;
  } catch (error) {
    console.error('❌ Elasticsearch health check failed:', error);
    return false;
  }
};

/**
 * Elasticsearch index istatistiklerini alır
 */
export const getElasticsearchStats = async (): Promise<any> => {
  try {
    const response = await fetch(`${ELASTICSEARCH_API_URL}/api/v1/elasticsearch/stats`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching Elasticsearch stats:', error);
    return null;
  }
};

 