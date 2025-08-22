import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Kategori ID mapping'i
const CATEGORY_ID_MAPPING = {
  // Ana kategoriler
  'Elektronik': 1,
  'Araç & Vasıta': 2,
  'Emlak': 3,
  'Moda': 4,
  'Ev & Yaşam': 5,
  'Eğitim & Kitap': 6,
  'Hizmetler': 7,
  'Spor & Outdoor': 8,
  'Sanat & Hobi': 9,
  'Anne & Bebek': 10,
  'Oyun & Eğlence': 11,
  'Seyahat': 12,
  'Kripto & Finans': 13,
  
  // Alt kategoriler - Elektronik
  'Elektronik > Telefon': 101,
  'Elektronik > Bilgisayar': 102,
  'Elektronik > Oyun Konsolu': 103,
  'Elektronik > Kamera & Fotoğraf': 104,
  'Elektronik > TV & Ses Sistemleri': 105,
  'Elektronik > Diğer Elektronik': 106,
  
  // Alt kategoriler - Araç & Vasıta
  'Araç & Vasıta > Otomobil': 201,
  'Araç & Vasıta > Motosiklet': 202,
  'Araç & Vasıta > Ticari Araç': 203,
  'Araç & Vasıta > Deniz Araçları': 204,
  'Araç & Vasıta > Diğer Vasıta': 205,
  
  // Alt kategoriler - Emlak
  'Emlak > Konut': 301,
  'Emlak > İş Yeri': 302,
  'Emlak > Arsa': 303,
  'Emlak > Projeler': 304,
  'Emlak > Diğer Emlak': 305,
};

// Reverse mapping (ID -> Name)
const CATEGORY_ID_TO_NAME = Object.fromEntries(
  Object.entries(CATEGORY_ID_MAPPING).map(([name, id]) => [id, name])
);

export const useCategoryCounts = () => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Local storage cache functions
  const CACHE_KEY = 'category_counts_cache';
  const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

  const getCachedCategoryCounts = () => {
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
  };

  const setCachedCategoryCounts = (data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  };

  // Elasticsearch'ten category counts çek
  const fetchCategoryCountsFromElasticsearch = async () => {
    try {
      const ADMIN_BACKEND_URL = import.meta.env.VITE_ADMIN_BACKEND_URL || 'http://localhost:3002';
      const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/elasticsearch/category-counts`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Category counts fetched from Elasticsearch');
        return result.data || {};
      }
    } catch (error) {
      console.error('Elasticsearch category counts error:', error);
    }
    return null;
  };

  // Supabase'den category counts çek (fallback)
  const fetchCategoryCountsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('category_id')
        .eq('status', 'active');

      if (error) throw error;

      const counts = {};
      data.forEach(listing => {
        const categoryId = listing.category_id;
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      });

      console.log('📊 Category counts fetched from Supabase');
      return counts;
    } catch (error) {
      console.error('Supabase category counts error:', error);
      return {};
    }
  };

  // Ana fetch fonksiyonu
  const fetchCategoryCounts = async () => {
    try {
      // 1. Local cache kontrol
      const localCached = getCachedCategoryCounts();
      if (localCached) {
        console.log('📦 Category counts loaded from local cache');
        return localCached;
      }
      
      // 2. Elasticsearch'ten çek
      const elasticsearchCounts = await fetchCategoryCountsFromElasticsearch();
      
      if (elasticsearchCounts) {
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
  };

  // Kategori path'ine göre sayı getir (ID tabanlı)
  const getCategoryCount = (categoryPath) => {
    if (!categoryPath || categoryPath.length === 0) {
      // Tüm ilanlar için toplam sayı
      return Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    }
    
    const fullPath = categoryPath.join(' > ');
    const categoryId = CATEGORY_ID_MAPPING[fullPath];
    
    if (categoryId) {
      const count = categoryCounts[categoryId] || 0;
      console.log('🔍 getCategoryCount - Path:', fullPath, 'ID:', categoryId, 'Count:', count);
      return count;
    }
    
    // Alt kategorileri de dahil et
    let totalCount = 0;
    Object.entries(CATEGORY_ID_MAPPING).forEach(([name, id]) => {
      if (name.startsWith(fullPath + ' >') || name === fullPath) {
        totalCount += categoryCounts[id] || 0;
      }
    });
    
    console.log('🔍 getCategoryCount - Path:', fullPath, 'Count:', totalCount);
    return totalCount;
  };

  // Alt kategorileri getir
  const getSubcategories = (parentPath = []) => {
    const parentString = parentPath.join(' > ');
    const subcategories = [];
    
    Object.entries(CATEGORY_ID_MAPPING).forEach(([name, id]) => {
      if (name.startsWith(parentString + ' >')) {
        const parts = name.split(' > ');
        if (parts.length === parentPath.length + 1) {
          const subcategoryName = parts[parentPath.length];
          subcategories.push({
            name: subcategoryName,
            count: categoryCounts[id] || 0
          });
        }
      }
    });

    return subcategories;
  };

  useEffect(() => {
    const loadCategoryCounts = async () => {
      setIsLoading(true);
      const counts = await fetchCategoryCounts();
      setCategoryCounts(counts);
      setIsLoading(false);
    };
    
    loadCategoryCounts();
  }, []);

  return {
    categoryCounts,
    getCategoryCount,
    getSubcategories,
    isLoading,
    totalListings: Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
  };
};
