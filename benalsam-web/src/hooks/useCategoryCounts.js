import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useCategoryCounts = () => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Local storage cache functions
  const CACHE_KEY = 'category_counts_cache_v6';
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
      
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }, []);

  const setCachedCategoryCounts = useCallback((data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }, []);

  // Elasticsearch'ten category counts çek
  const fetchCategoryCountsFromElasticsearch = useCallback(async () => {
    try {
      const ADMIN_BACKEND_URL = import.meta.env.VITE_ADMIN_BACKEND_URL || 'http://localhost:3002';
      const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/elasticsearch/category-counts`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Category counts fetched from Elasticsearch:', result);
        return result.data || {};
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
      
      if (elasticsearchCounts) {
        console.log('💾 Caching Elasticsearch counts:', elasticsearchCounts);
        setCachedCategoryCounts(elasticsearchCounts);
        return elasticsearchCounts;
      }
      
      // 3. Supabase fallback
      console.log('🔄 Falling back to Supabase for category counts');
      const supabaseCounts = await fetchCategoryCountsFromSupabase();
      
      if (supabaseCounts) {
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
    if (!categoryId) {
      // Tüm ilanlar için toplam sayı
      return Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    }
    
    // Kategori ID'si ile direkt eşleştirme
    const count = categoryCounts[categoryId] || 0;
    
    console.log(`🔍 Category count for ID ${categoryId}: ${count}`);
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
