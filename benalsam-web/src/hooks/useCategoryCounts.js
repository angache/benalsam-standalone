import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useCategoryCounts = () => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Local storage cache functions
  // Bump cache version to invalidate stale/partial caches
  const CACHE_KEY = 'category_counts_cache_v8';
  const CACHE_TTL = 10 * 60 * 1000; // 10 dakika
  const RATE_LIMIT = 30 * 1000; // 30 saniye
  const lastFetchTime = useRef(0);
  const isInitialized = useRef(false);

  const getCachedCategoryCounts = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      // Guard: ignore partial caches (must contain 'all' or at least 2 keys)
      if (!data || typeof data !== 'object' || Object.keys(data).length < 2 || !('all' in data)) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }, []);

  const setCachedCategoryCounts = useCallback((data) => {
    try {
      // Guard: don't cache empty objects
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return;
      }
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }, []);

  // Categories Service üzerinden category counts çek (tercih)
  const fetchCategoryCountsFromElasticsearch = useCallback(async () => {
    try {
      const CATEGORIES_SERVICE_URL = import.meta.env.VITE_CATEGORIES_SERVICE_URL || 'http://localhost:3015';
      // 1) Try Categories Service
      let response = await fetch(`${CATEGORIES_SERVICE_URL}/api/v1/categories/counts`);
      if (response.ok) {
        const result = await response.json();
        if (result?.counts) return result.counts;
        if (result?.data?.counts) return result.data.counts;
        // NEW: support { success, data: { '499': 1, '500': 1, ... } }
        if (result?.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          return result.data;
        }
      }

      // 2) Fallback to Search Service / ES Service stats if categories service unavailable
      const ES_PUBLIC_URL = import.meta.env.VITE_ELASTICSEARCH_PUBLIC_URL || 'http://localhost:3006';
      const SEARCH_SERVICE_URL = import.meta.env.VITE_SEARCH_SERVICE_URL || '';
      const statsUrl = SEARCH_SERVICE_URL
        ? `${SEARCH_SERVICE_URL}/api/v1/search/stats`
        : `${ES_PUBLIC_URL}/api/v1/search/stats`;
      response = await fetch(statsUrl);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Category counts fetched from service:', result);
        // Try several shapes: { data: { categoryCounts } } or { categoryCounts } or { aggregations }
        if (result?.data?.categoryCounts) return result.data.categoryCounts;
        if (result?.categoryCounts) return result.categoryCounts;
        if (result?.aggregations?.categories?.buckets) {
          const counts = {};
          result.aggregations.categories.buckets.forEach(b => {
            const key = b.key; const docCount = b.doc_count || 0;
            if (key !== null && key !== undefined) counts[key] = docCount;
          });
          return counts;
        }
        return {};
      }
    } catch (error) {
      console.error('Elasticsearch category counts error:', error);
    }
    return null;
  }, []);

  // Supabase'den category counts çek (fallback)
  const fetchCategoryCountsFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('category_id')
        .eq('status', 'active');

      if (error) throw error;

      const counts = {};
      data.forEach(listing => {
        const categoryId = listing.category_id;
        if (categoryId) {
          counts[categoryId] = (counts[categoryId] || 0) + 1;
        }
      });

      console.log('📊 Category counts fetched from Supabase');
      return counts;
    } catch (error) {
      console.error('Supabase category counts error:', error);
      return {};
    }
  }, []);

  // Ana fetch fonksiyonu
  const fetchCategoryCounts = useCallback(async () => {
    try {
      // Rate limiting kontrol
      const now = Date.now();
      if (now - lastFetchTime.current < RATE_LIMIT) {
        console.log('⏱️ Rate limit active, using cached data');
        const cached = getCachedCategoryCounts();
        if (cached) return cached;
      }

      // 1. Local cache kontrol
      const localCached = getCachedCategoryCounts();
      if (localCached) {
        console.log('📦 Category counts loaded from local cache');
        return localCached;
      }
      
      lastFetchTime.current = now;
      
      // 2. Elasticsearch'ten çek
      const elasticsearchCounts = await fetchCategoryCountsFromElasticsearch();
      
      if (elasticsearchCounts && Object.keys(elasticsearchCounts).length > 0) {
        console.log('💾 Caching Elasticsearch counts:', elasticsearchCounts);
        setCachedCategoryCounts(elasticsearchCounts);
        return elasticsearchCounts;
      }
      
      // 3. Supabase fallback
      console.log('🔄 Falling back to Supabase for category counts');
      const supabaseCounts = await fetchCategoryCountsFromSupabase();
      
      if (supabaseCounts && Object.keys(supabaseCounts).length > 0) {
        setCachedCategoryCounts(supabaseCounts);
      }
      
      return supabaseCounts;
    } catch (error) {
      console.error('Error in fetchCategoryCounts:', error);
      return {};
    }
  }, [getCachedCategoryCounts, fetchCategoryCountsFromElasticsearch, fetchCategoryCountsFromSupabase, setCachedCategoryCounts]);

  // Kategori ID'sine göre sayı getir
  const getCategoryCount = useCallback((categoryId) => {
    // Support: undefined/null, empty array, or explicit 'all'
    const isAll =
      categoryId === undefined || categoryId === null ||
      (Array.isArray(categoryId) && categoryId.length === 0) ||
      categoryId === 'all';
    if (isAll) {
      // Prefer 'all' from service; fallback to sum of numeric ids only
      if (categoryCounts && typeof categoryCounts.all === 'number') return categoryCounts.all;
      return Object.entries(categoryCounts)
        .filter(([k]) => k !== 'all')
        .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0);
    }

    const key = String(categoryId);
    const count = categoryCounts[key] || 0;
    console.log(`🔍 Category count for ID ${key}: ${count}`);
    return count;
  }, [categoryCounts]);

  useEffect(() => {
    const loadCategoryCounts = async () => {
      if (isInitialized.current) return;
      
      setIsLoading(true);
      const counts = await fetchCategoryCounts();
      setCategoryCounts(counts);
      setIsLoading(false);
      isInitialized.current = true;
    };
    
    loadCategoryCounts();
  }, [fetchCategoryCounts]);

  // Memoize total listings
  const totalListings = useMemo(() => 
    Object.values(categoryCounts).reduce((sum, count) => sum + count, 0), 
    [categoryCounts]
  );

  return {
    categoryCounts,
    getCategoryCount,
    isLoading,
    totalListings,
    clearCache: () => {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem('category_counts_cache'); // Eski cache'i de temizle
      isInitialized.current = false;
    },
    refresh: async () => {
      isInitialized.current = false;
      lastFetchTime.current = 0;
      setIsLoading(true);
      const counts = await fetchCategoryCounts();
      setCategoryCounts(counts);
      setIsLoading(false);
    }
  };
};
