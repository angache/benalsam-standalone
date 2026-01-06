import type { ComponentType } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { addPremiumSorting, processFetchedListings } from './core';
import { getListingHistory, getLastSearch } from '@/services/userActivityService';
import { Listing, ApiResponse, QueryFilters } from '@/types';
import { searchListingsWithElasticsearch, fetchListingByIdFromES } from '@/services/elasticsearchService';
import { incrementSourceCount } from '@/lib/debugSource';
import { logger } from '@/utils/production-logger';

// Type helpers for listing operations
type ListingWithSource = Listing & { __src?: 'S' | 'E' };
type Favorite = { user_id: string; listing_id: string };
type ListingWithOfferCount = Listing & { actual_offers_count: number };
type AttributeStatistic = { attribute: string; values: Array<{ value: string; count: number }> };

export const fetchListings = async (
  currentUserId: string | null = null, 
  options: { page?: number; limit?: number } = {}
): Promise<{ listings: Listing[]; total: number; hasMore: boolean }> => {
  try {
    const { page = 1, limit = 24 } = options;
    logger.debug('[ListingService] fetchListings - Using Elasticsearch', { page, limit });
    
    // Elasticsearch'ten çek
    const searchParams = {
      query: '',
      filters: {},
      sort: {
        field: 'created_at',
        order: 'desc'
      },
      page,
      limit
    };

    const result = await searchListingsWithElasticsearch(searchParams, currentUserId);
    
    if (result.data && result.data.length > 0) {
      // Check source from debug flag (set in dev mode)
      const firstListing = result.data[0] as ListingWithSource;
      const source = firstListing?.__src === 'S' ? 'Supabase' : 
                     firstListing?.__src === 'E' ? 'Elasticsearch' : 'Unknown';
      logger.debug(`[ListingService] fetchListings - Found ${result.data.length} listings from ${source}`, { total: result.total });
      return {
        listings: result.data,
        total: result.total || 0,
        hasMore: result.data.length === limit
      };
    }

    // Fallback to Supabase
    logger.warn('[ListingService] fetchListings - Elasticsearch failed, falling back to Supabase');
    
    // Count total listings first
    const { count: totalCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Fetch paginated listings
    const offset = (page - 1) * limit;
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .range(offset, offset + limit - 1);
      
    query = addPremiumSorting(query).order('created_at', { ascending: false });

    const { data: listingsData, error: listingsError } = await query;

    if (listingsError) {
      logger.error('[ListingService] Error fetching listings from Supabase', { error: listingsError });
      if (listingsError.message.toLowerCase().includes('failed to fetch')) {
        toast({ title: "Ağ Hatası", description: "İlanlar yüklenemedi. İnternet bağlantınızı kontrol edin.", variant: "destructive" });
      } else {
        toast({ title: "Veri Çekme Hatası", description: "İlanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
      }
      return { listings: [], total: 0, hasMore: false };
    }

    const processedListings = await processFetchedListings(listingsData, currentUserId);
    // Mark source for debug (only used in development)
    if (process.env.NODE_ENV !== 'production') {
      (processedListings as ListingWithSource[]).forEach(l => { 
        try { 
          (l as ListingWithSource).__src = 'S'; 
        } catch (_) {} 
      });
      incrementSourceCount('S', processedListings.length);
    }
    
    return {
      listings: processedListings,
      total: totalCount || 0,
      hasMore: offset + limit < (totalCount || 0)
    };

  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchListings', { error: e });
    toast({ title: "Beklenmedik İlan Hatası", description: "İlanlar yüklenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return { listings: [], total: 0, hasMore: false };
  }
};

/**
 * Fetch listings with advanced filters (ES + Supabase fallback)
 */
export const fetchListingsWithFilters = async (
  currentUserId: string | null = null,
  filters: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    urgency?: string;
    dateRange?: string;
    featured?: boolean;
    showcase?: boolean;
    urgent?: boolean;
    attributes?: Record<string, string[]>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {},
  options: { page?: number; limit?: number } = {}
): Promise<{ listings: Listing[]; total: number; hasMore: boolean }> => {
  try {
    const { page = 1, limit = 12 } = options;
    logger.debug('[ListingService] fetchListingsWithFilters - Filters', { filters, page });
    
    // Elasticsearch search params
    const searchParams = {
      query: filters.search || '',
      filters: {
        category_id: filters.categoryId,
        location: filters.location,
        minBudget: filters.minPrice,
        maxBudget: filters.maxPrice,
        urgency: filters.urgency,
        // 🆕 Advanced filters
        dateRange: filters.dateRange,
        featured: filters.featured,
        showcase: filters.showcase,
        urgent: filters.urgent,
        attributes: filters.attributes,
      },
      sort: {
        field: filters.sortBy || 'created_at',
        order: filters.sortOrder || 'desc' as 'asc' | 'desc'
      },
      page,
      limit
    };

    const result = await searchListingsWithElasticsearch(searchParams, currentUserId);
    
    if (result.data && result.data.length > 0) {
      // Check source from debug flag (set in dev mode)
      const firstListing = result.data[0] as ListingWithSource;
      const source = firstListing?.__src === 'S' ? 'Supabase' : 
                     firstListing?.__src === 'E' ? 'Elasticsearch' : 'Unknown';
      logger.debug(`[ListingService] fetchListings - Found ${result.data.length} listings from ${source}`, { total: result.total });
      return {
        listings: result.data,
        total: result.total || 0,
        hasMore: result.data.length === limit
      };
    }

    // Fallback to Supabase WITH FILTERS
    logger.warn('[ListingService] fetchListingsWithFilters - ES failed, using Supabase fallback with filters');
    
    const offset = (page - 1) * limit;
    
    // Build Supabase query with ALL filters
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Apply search filter
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    // Apply category filter
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    // Apply price range filters
    if (filters.minPrice) {
      query = query.gte('budget', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('budget', filters.maxPrice);
    }
    
    // Apply location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    // Apply urgency filter
    if (filters.urgency) {
      query = query.eq('urgency', filters.urgency);
    }

    // Apply sorting
    const sortField = filters.sortBy || 'created_at';
    const sortAscending = filters.sortOrder === 'asc';
    query = addPremiumSorting(query).order(sortField, { ascending: sortAscending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: listingsData, error: listingsError, count: totalCount } = await query;

    if (listingsError) {
      logger.error('[ListingService] Error fetching listings from Supabase', { error: listingsError });
      toast({ title: "Veri Hatası", description: "İlanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
      return { listings: [], total: 0, hasMore: false };
    }

    const processedListings = await processFetchedListings(listingsData || [], currentUserId);
    
    // Mark source for debug
    if (process.env.NODE_ENV !== 'production') {
      (processedListings as ListingWithSource[]).forEach(l => { 
        try { 
          (l as ListingWithSource).__src = 'S'; 
        } catch (_) {} 
      });
      incrementSourceCount('S', processedListings.length);
    }
    
    logger.debug(`[ListingService] fetchListingsWithFilters - Got ${processedListings.length} from Supabase`, { total: totalCount });
    
    return {
      listings: processedListings,
      total: totalCount || 0,
      hasMore: offset + limit < (totalCount || 0)
    };

  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchListingsWithFilters', { error: e });
    toast({ title: "Beklenmedik Hata", description: "İlanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
    return { listings: [], total: 0, hasMore: false };
  }
};

export const fetchSingleListing = async (listingId: string, currentUserId: string | null = null): Promise<Listing | null> => {
  try {
    // Try Elasticsearch first
    const esDoc = await fetchListingByIdFromES(listingId);
    if (esDoc) {
      const processed = await processFetchedListings([esDoc], currentUserId);
      return processed[0] || null;
    }

    logger.debug('[ListingService] fetchSingleListing started', { listingId, currentUserId });
    
    // Fetch listing with favorite status in ONE query using LEFT JOIN
    let selectQuery = '*';
    
    if (currentUserId) {
      // LEFT JOIN with user_favorites to check if it's favorited
      selectQuery = `
        *,
        user_favorites!left(user_id, listing_id)
      `;
    }
    
    logger.debug('[ListingService] Executing Supabase query');
    const { data: listing, error } = await supabase
      .from('listings')
      .select(selectQuery)
      .eq('id', listingId)
      .maybeSingle();

    logger.debug('[ListingService] Supabase response', { hasListing: !!listing, hasError: !!error });

    if (error) {
      logger.error('[ListingService] Error fetching single listing', { error });
      toast({ title: "İlan Bulunamadı", description: "İlan detayları yüklenemedi.", variant: "destructive" });
      return null;
    }

    if (!listing) {
      return null;
    }

    // Check if favorite exists from the JOIN
    if (currentUserId && listing.user_favorites) {
      const favorites = Array.isArray(listing.user_favorites) ? listing.user_favorites : [listing.user_favorites];
      const isFavorited = (favorites as Favorite[]).some((fav) => 
        fav && fav.user_id === currentUserId && fav.listing_id === listingId
      );
      listing.is_favorited = isFavorited;
      logger.debug('[ListingService] Favorite status from JOIN', { isFavorited, favoritesCount: favorites.length });
    } else {
      listing.is_favorited = false;
      logger.debug('[ListingService] No favorites (user not logged in or no favorites)');
    }
    
    // Remove the join data from the result
    delete listing.user_favorites;

    logger.debug('[ListingService] Processing listings');
    // Process listing (add profile data, etc) WITHOUT fetching favorites again
    const processedListings = await processFetchedListings([listing], null); // Pass null to skip favorite check
    
    // Restore the is_favorited we already set
    if (processedListings[0]) {
      processedListings[0].is_favorited = listing.is_favorited;
    }
    
    logger.debug('[ListingService] fetchSingleListing completed', { is_favorited: processedListings[0]?.is_favorited });
    return processedListings[0] || null;

  } catch (error) {
    logger.error('[ListingService] Unexpected error in fetchSingleListing', { error });
    toast({ title: "Beklenmedik Hata", description: "İlan detayları yüklenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const fetchPopularListings = async (currentUserId: string | null = null): Promise<Listing[]> => {
  try {
    const es = await searchListingsWithElasticsearch({
      query: '',
      sort: { field: 'popularity_score', order: 'desc' },
      page: 1,
      limit: 10
    }, currentUserId);

    const docs = es.data || [];
    if (process.env.NODE_ENV !== 'production') {
      (docs as ListingWithSource[]).forEach(d => { 
        try { 
          (d as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
    }
    const processed = await processFetchedListings(docs, currentUserId);
    if (process.env.NODE_ENV !== 'production') {
      (processed as ListingWithSource[]).forEach(d => { 
        try { 
          (d as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
    }
    return processed;
  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchPopularListings', { error: e });
    toast({ title: "Beklenmedik Hata", description: "Popüler ilanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchMostOfferedListings = async (currentUserId: string | null = null): Promise<Listing[]> => {
  try {
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select(`
        *,
        offers!offers_listing_id_fkey!inner(listing_id)
      `)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (listingsError) {
      logger.error('[ListingService] Error fetching most offered listings', { error: listingsError });
      toast({ title: "En Çok Teklif Alanlar Yüklenemedi", description: listingsError.message, variant: "destructive" });
      return [];
    }

    const listingsWithOfferCounts = listingsData.reduce((acc: ListingWithOfferCount[], listing: Listing) => {
      const existingListing = acc.find(l => l.id === listing.id);
      if (existingListing) {
        existingListing.actual_offers_count = (existingListing.actual_offers_count || 0) + 1;
      } else {
        acc.push({
          ...listing,
          actual_offers_count: 1
        });
      }
      return acc;
    }, []);

    const sortedListings = listingsWithOfferCounts
      .filter(listing => listing.actual_offers_count > 0)
      .sort((a, b) => {
        if (a.is_urgent_premium !== b.is_urgent_premium) {
          return b.is_urgent_premium ? 1 : -1;
        }
        if (a.is_featured !== b.is_featured) {
          return b.is_featured ? 1 : -1;
        }
        if (a.is_showcase !== b.is_showcase) {
          return b.is_showcase ? 1 : -1;
        }
        return b.actual_offers_count - a.actual_offers_count;
      })
      .slice(0, 10);

    if (sortedListings.length === 0) {
      let fallbackQuery = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(10);

      fallbackQuery = addPremiumSorting(fallbackQuery).order('created_at', { ascending: false });
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        logger.error('[ListingService] Error fetching fallback listings', { error: fallbackError });
        return [];
      }
      
      return await processFetchedListings(fallbackData, currentUserId);
    }

    return await processFetchedListings(sortedListings, currentUserId);
  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchMostOfferedListings', { error: e });
    toast({ title: "Beklenmedik Hata", description: "En çok teklif alan ilanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchTodaysDeals = async (currentUserId: string | null = null): Promise<Listing[]> => {
  try {
    // Approximation: latest created listings as today's deals
    const es = await searchListingsWithElasticsearch({
      query: '',
      sort: { field: 'created_at', order: 'desc' },
      page: 1,
      limit: 10
    }, currentUserId);

    const docs = es.data || [];
    if (process.env.NODE_ENV !== 'production') {
      (docs as ListingWithSource[]).forEach(d => { 
        try { 
          (d as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
    }
    const processed = await processFetchedListings(docs, currentUserId);
    if (process.env.NODE_ENV !== 'production') {
      (processed as ListingWithSource[]).forEach(d => { 
        try { 
          (d as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
    }
    return processed;
  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchTodaysDeals', { error: e });
    toast({ title: "Beklenmedik Hata", description: "Günün fırsatları yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchRecentlyViewedListings = async (currentUserId: string): Promise<Listing[]> => {
  const history = getListingHistory();
  if (!history || history.length === 0 || !currentUserId) {
    return [];
  }

  try {
    // Fetch each id from ES (keeps order by history)
    const docs = (await Promise.all(history.map(id => fetchListingByIdFromES(id)))).filter(Boolean) as Listing[];
    if (process.env.NODE_ENV !== 'production') {
      (docs as ListingWithSource[]).forEach(d => { 
        try { 
          (d as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
    }
    const processed = await processFetchedListings(docs, currentUserId);
    if (process.env.NODE_ENV !== 'production') {
      (processed as ListingWithSource[]).forEach(d => { 
        try { 
          (d as ListingWithSource).__src = 'E'; 
        } catch (_) {} 
      });
    }
    return processed;
  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchRecentlyViewedListings', { error: e });
    return [];
  }
};

export const fetchListingsMatchingLastSearch = async (currentUserId: string): Promise<{ listings: Listing[], totalCount: number }> => {
  const searchCriteria = getLastSearch();
  if (!searchCriteria || !currentUserId) {
    return { listings: [], totalCount: 0 };
  }

  try {
    const { query, categories, filters } = searchCriteria;
    
    const allKeywords = [query, filters?.keywords].filter(Boolean).join(' ').trim();
    
    let categoryPaths = null;
    if (categories && categories.length > 0) {
        const pathString = categories.map(c => c.name).join(' > ');
        categoryPaths = [pathString + '%'];
    }

    const { data, error } = await supabase.rpc('search_listings_with_count', {
      search_query: allKeywords,
      p_categories: categoryPaths,
      p_location: filters?.location,
      p_urgency: filters?.urgency || 'Tümü',
      min_price: filters?.priceRange?.[0],
      max_price: filters?.priceRange?.[1],
      p_page: 1,
      p_page_size: 10,
      sort_key: 'created_at',
      sort_direction: 'desc'
    });
    
    if (error) {
      logger.error('[ListingService] Error fetching listings by last search', { error });
      return { listings: [], totalCount: 0 };
    }

    if (!data || data.length === 0) {
      return { listings: [], totalCount: 0 };
    }
    
    const listings = await processFetchedListings(data, currentUserId);
    const totalCount = data[0]?.total_count || 0;

    return { listings, totalCount };
  } catch (e) {
    logger.error('[ListingService] Unexpected error in fetchListingsMatchingLastSearch', { error: e });
    return { listings: [], totalCount: 0 };
  }
};

export const fetchMyListings = async (userId: string): Promise<Listing[]> => {
  try {
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (listingsError) {
      logger.error('[ListingService] Error fetching my listings', { error: listingsError });
      toast({ title: "İlanlarım Yüklenemedi", description: listingsError.message, variant: "destructive" });
      return [];
    }

    return await processFetchedListings(listingsData, userId);
  } catch (error) {
    logger.error('[ListingService] Unexpected error in fetchMyListings', { error });
    toast({ title: "Beklenmedik Hata", description: "İlanlarım yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchFilteredListings = async (
  filterParams: QueryFilters & { selectedCategories?: Array<{ name: string; icon?: string | ComponentType | null }> },
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<{ listings: Listing[], totalCount: number }> => {
  try {
    logger.debug('[ListingService] fetchFilteredListings - Input params', {
      filterParams,
      currentUserId,
      page,
      pageSize
    });

    // Use the new database function for better performance and attribute filtering
    const rpcParams = {
      search_query: filterParams.search || null,
      p_categories: filterParams.selectedCategories && filterParams.selectedCategories.length > 0 
        ? (() => {
            const lastCategoryId = filterParams.selectedCategories[filterParams.selectedCategories.length - 1].id;
            return lastCategoryId && lastCategoryId !== null ? [lastCategoryId] : null;
          })()
        : null,
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

    logger.debug('[ListingService] fetchFilteredListings - RPC category params', {
      selectedCategories: filterParams.selectedCategories,
      lastCategoryId: filterParams.selectedCategories && filterParams.selectedCategories.length > 0 
        ? filterParams.selectedCategories[filterParams.selectedCategories.length - 1].id
        : null,
      p_categories: rpcParams.p_categories
    });

    logger.debug('[ListingService] fetchFilteredListings - RPC params', { rpcParams });

    const { data, error } = await supabase.rpc('search_listings_with_attributes', rpcParams);

    logger.debug('[ListingService] fetchFilteredListings - Response', { hasData: !!data, hasError: !!error });

    if (error) {
      logger.error('[ListingService] Error calling search_listings_with_attributes', { error });
      // Fallback to basic search
      return await fetchFilteredListingsFallback(filterParams, currentUserId, page, pageSize);
    }

    if (!data || data.length === 0) {
      return { listings: [], totalCount: 0 };
    }

    const listings = await processFetchedListings(data, currentUserId);
    const totalCount = data[0]?.total_count || 0;

    logger.debug('[ListingService] fetchFilteredListings - Processed results', { 
      listingsCount: listings.length, 
      totalCount 
    });

    return { listings, totalCount };
  } catch (error) {
    logger.error('[ListingService] Unexpected error in fetchFilteredListings', { error });
    toast({ title: "Arama Hatası", description: "İlanlar aranırken bir sorun oluştu.", variant: "destructive" });
    return { listings: [], totalCount: 0 };
  }
};

const fetchFilteredListingsFallback = async (
  filterParams: QueryFilters & { selectedCategories?: Array<{ name: string; icon?: string | ComponentType | null }> },
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<{ listings: Listing[], totalCount: number }> => {
  try {
    logger.debug('[ListingService] Using fallback search method');

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Apply search filter
    if (filterParams.search) {
      query = query.or(`title.ilike.%${filterParams.search}%,description.ilike.%${filterParams.search}%`);
    }

    // Apply category filter - use ONLY category_id for exact match
    if (filterParams.selectedCategories && filterParams.selectedCategories.length > 0) {
      const lastCategory = filterParams.selectedCategories[filterParams.selectedCategories.length - 1];
      logger.debug('[ListingService] Category filtering - selectedCategories', {
        selectedCategories: filterParams.selectedCategories,
        lastCategory,
        lastCategoryId: lastCategory?.id,
        lastCategoryName: lastCategory?.name
      });
      
      // Use ONLY category_id for exact match
      if (lastCategory.id && lastCategory.id !== null) {
        logger.debug('[ListingService] Category filtering - using ONLY category_id', { categoryId: lastCategory.id });
        query = query.eq('category_id', lastCategory.id);
      } else {
        logger.warn('[ListingService] Category filtering - lastCategory.id is null or undefined', { categoryId: lastCategory.id });
      }
    } else if (filterParams.category) {
      // Fallback for single category string - try to find category_id first
      logger.debug('[ListingService] Category filtering - fallback category', { category: filterParams.category });
      // For now, skip category filtering if only category name is provided
      logger.warn('[ListingService] Category name filtering skipped - need category_id for exact match');
    } else {
      logger.debug('[ListingService] Category filtering - no category filters applied');
    }

    // Apply location filter
    if (filterParams.location) {
      query = query.eq('location', filterParams.location);
    }

    // Apply urgency filter
    if (filterParams.urgency && filterParams.urgency !== 'Tümü') {
      query = query.eq('urgency', filterParams.urgency);
    }

    // Apply budget filters
    if (filterParams.minBudget) {
      query = query.gte('budget', filterParams.minBudget);
    }
    if (filterParams.maxBudget) {
      query = query.lte('budget', filterParams.maxBudget);
    }

    // Apply sorting
    const sortKey = filterParams.sortBy || 'created_at';
    const sortDirection = filterParams.sortOrder || 'desc';
    query = query.order(sortKey, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('[ListingService] Error in fallback search', { error });
      toast({ title: "Arama Hatası", description: "İlanlar aranırken bir sorun oluştu.", variant: "destructive" });
      return { listings: [], totalCount: 0 };
    }

    const listings = await processFetchedListings(data || [], currentUserId);
    const totalCount = count || 0;

    return { listings, totalCount };
  } catch (error) {
    logger.error('[ListingService] Error in fallback search', { error });
    return { listings: [], totalCount: 0 };
  }
};

export const fetchAttributeStatistics = async (category?: string): Promise<AttributeStatistic[]> => {
  try {
    let query = supabase
      .from('listings')
      .select('attributes')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[ListingService] Error fetching attribute statistics', { error });
      return [];
    }

    // Process attributes to get statistics
    const attributeStats: { [key: string]: { [value: string]: number } } = {};

    data?.forEach((listing: { attributes?: string | Record<string, unknown> }) => {
      if (listing.attributes) {
        const attributes = typeof listing.attributes === 'string' 
          ? JSON.parse(listing.attributes) 
          : listing.attributes;

        Object.entries(attributes).forEach(([key, value]) => {
          if (!attributeStats[key]) {
            attributeStats[key] = {};
          }
          const valueStr = String(value);
          attributeStats[key][valueStr] = (attributeStats[key][valueStr] || 0) + 1;
        });
      }
    });

    return Object.entries(attributeStats).map(([key, values]) => ({
      attribute: key,
      values: Object.entries(values).map(([value, count]) => ({ value, count }))
    }));
  } catch (error) {
    logger.error('[ListingService] Error in fetchAttributeStatistics', { error });
    return [];
  }
};

export const searchByAttributeValues = async (
  attributeKey: string,
  attributeValues: string[]
): Promise<Listing[]> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) {
      logger.error('[ListingService] Error searching by attribute values', { error });
      return [];
    }

    // Filter listings by attribute values
    const filteredListings = data?.filter((listing: Listing) => {
      if (!listing.attributes) return false;
      
      const attributes = typeof listing.attributes === 'string' 
        ? JSON.parse(listing.attributes) 
        : listing.attributes;

      const listingValue = attributes[attributeKey];
      return listingValue && attributeValues.includes(String(listingValue));
    }) || [];

    return await processFetchedListings(filteredListings, null);
  } catch (error) {
    logger.error('[ListingService] Error in searchByAttributeValues', { error });
    return [];
  }
}; 