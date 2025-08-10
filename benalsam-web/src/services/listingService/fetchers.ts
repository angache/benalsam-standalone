import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { addPremiumSorting, processFetchedListings } from './core';
import { getListingHistory, getLastSearch } from '@/services/userActivityService';
import { Listing, ApiResponse, QueryFilters } from '@/types';

export const fetchListings = async (currentUserId: string | null = null): Promise<Listing[]> => {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      
    query = addPremiumSorting(query).order('created_at', { ascending: false });

    const { data: listingsData, error: listingsError } = await query;

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      if (listingsError.message.toLowerCase().includes('failed to fetch')) {
        toast({ title: "Ağ Hatası", description: "İlanlar yüklenemedi. İnternet bağlantınızı kontrol edin.", variant: "destructive" });
      } else {
        toast({ title: "Veri Çekme Hatası", description: "İlanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
      }
      return [];
    }

    return await processFetchedListings(listingsData, currentUserId);

  } catch (e) {
    console.error('Unexpected error in fetchListings:', e);
    toast({ title: "Beklenmedik İlan Hatası", description: "İlanlar yüklenirken beklenmedik bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchSingleListing = async (listingId: string, currentUserId: string | null = null): Promise<Listing | null> => {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Error fetching single listing:', error);
      toast({ title: "İlan Bulunamadı", description: "İlan detayları yüklenemedi.", variant: "destructive" });
      return null;
    }

    if (!listing) {
      return null;
    }

    const processedListings = await processFetchedListings([listing], currentUserId);
    return processedListings[0] || null;

  } catch (error) {
    console.error('Unexpected error in fetchSingleListing:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan detayları yüklenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const fetchPopularListings = async (currentUserId: string | null = null): Promise<Listing[]> => {
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
      console.error('Error fetching popular listings:', error);
      toast({ title: "Popüler İlanlar Yüklenemedi", description: error.message, variant: "destructive" });
      return [];
    }
    return await processFetchedListings(data, currentUserId);
  } catch (e) {
    console.error('Unexpected error in fetchPopularListings:', e);
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
      console.error('Error fetching most offered listings:', listingsError);
      toast({ title: "En Çok Teklif Alanlar Yüklenemedi", description: listingsError.message, variant: "destructive" });
      return [];
    }

    const listingsWithOfferCounts = listingsData.reduce((acc: any[], listing: any) => {
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
        console.error('Error fetching fallback listings:', fallbackError);
        return [];
      }
      
      return await processFetchedListings(fallbackData, currentUserId);
    }

    return await processFetchedListings(sortedListings, currentUserId);
  } catch (e) {
    console.error('Unexpected error in fetchMostOfferedListings:', e);
    toast({ title: "Beklenmedik Hata", description: "En çok teklif alan ilanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchTodaysDeals = async (currentUserId: string | null = null): Promise<Listing[]> => {
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
      toast({ title: "Günün Fırsatları Yüklenemedi", description: error.message, variant: "destructive" });
      return [];
    }
    return await processFetchedListings(data, currentUserId);
  } catch (e) {
    console.error('Unexpected error in fetchTodaysDeals:', e);
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
    let query = supabase
      .from('listings')
      .select('*')
      .in('id', history)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    query = addPremiumSorting(query);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recently viewed listings:', error);
      return [];
    }

    const listingsMap = new Map(data.map(l => [l.id, l]));
    const orderedListingsData = history.map(id => listingsMap.get(id)).filter(Boolean);

    return await processFetchedListings(orderedListingsData, currentUserId);
  } catch (e) {
    console.error('Unexpected error in fetchRecentlyViewedListings:', e);
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
      console.error('Error fetching listings by last search:', error);
      return { listings: [], totalCount: 0 };
    }

    if (!data || data.length === 0) {
      return { listings: [], totalCount: 0 };
    }
    
    const listings = await processFetchedListings(data, currentUserId);
    const totalCount = data[0]?.total_count || 0;

    return { listings, totalCount };
  } catch (e) {
    console.error('Unexpected error in fetchListingsMatchingLastSearch:', e);
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
      console.error('Error fetching my listings:', listingsError);
      toast({ title: "İlanlarım Yüklenemedi", description: listingsError.message, variant: "destructive" });
      return [];
    }

    return await processFetchedListings(listingsData, userId);
  } catch (error) {
    console.error('Unexpected error in fetchMyListings:', error);
    toast({ title: "Beklenmedik Hata", description: "İlanlarım yüklenirken bir sorun oluştu.", variant: "destructive" });
    return [];
  }
};

export const fetchFilteredListings = async (
  filterParams: QueryFilters,
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<{ listings: Listing[], totalCount: number }> => {
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
      // Fallback to basic search
      return await fetchFilteredListingsFallback(filterParams, currentUserId, page, pageSize);
    }

    if (!data || data.length === 0) {
      return { listings: [], totalCount: 0 };
    }

    const listings = await processFetchedListings(data, currentUserId);
    const totalCount = data[0]?.total_count || 0;

    console.log('🔍 fetchFilteredListings - Processed results:', { 
      listingsCount: listings.length, 
      totalCount 
    });

    return { listings, totalCount };
  } catch (error) {
    console.error('❌ Unexpected error in fetchFilteredListings:', error);
    toast({ title: "Arama Hatası", description: "İlanlar aranırken bir sorun oluştu.", variant: "destructive" });
    return { listings: [], totalCount: 0 };
  }
};

const fetchFilteredListingsFallback = async (
  filterParams: QueryFilters,
  currentUserId: string | null = null,
  page = 1,
  pageSize = 20
): Promise<{ listings: Listing[], totalCount: number }> => {
  try {
    console.log('🔄 Using fallback search method');

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Apply search filter
    if (filterParams.search) {
      query = query.or(`title.ilike.%${filterParams.search}%,description.ilike.%${filterParams.search}%`);
    }

    // Apply category filter
    if (filterParams.category) {
      query = query.eq('category', filterParams.category);
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
      console.error('❌ Error in fallback search:', error);
      toast({ title: "Arama Hatası", description: "İlanlar aranırken bir sorun oluştu.", variant: "destructive" });
      return { listings: [], totalCount: 0 };
    }

    const listings = await processFetchedListings(data || [], currentUserId);
    const totalCount = count || 0;

    return { listings, totalCount };
  } catch (error) {
    console.error('❌ Error in fallback search:', error);
    return { listings: [], totalCount: 0 };
  }
};

export const fetchAttributeStatistics = async (category?: string): Promise<any[]> => {
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
      console.error('Error fetching attribute statistics:', error);
      return [];
    }

    // Process attributes to get statistics
    const attributeStats: { [key: string]: { [value: string]: number } } = {};

    data?.forEach((listing: any) => {
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
    console.error('Error in fetchAttributeStatistics:', error);
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
      console.error('Error searching by attribute values:', error);
      return [];
    }

    // Filter listings by attribute values
    const filteredListings = data?.filter((listing: any) => {
      if (!listing.attributes) return false;
      
      const attributes = typeof listing.attributes === 'string' 
        ? JSON.parse(listing.attributes) 
        : listing.attributes;

      const listingValue = attributes[attributeKey];
      return listingValue && attributeValues.includes(String(listingValue));
    }) || [];

    return await processFetchedListings(filteredListings, null);
  } catch (error) {
    console.error('Error in searchByAttributeValues:', error);
    return [];
  }
}; 