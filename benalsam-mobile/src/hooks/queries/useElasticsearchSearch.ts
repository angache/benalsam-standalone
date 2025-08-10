import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { 
  searchListingsWithElasticsearch, 
  checkElasticsearchHealth, 
  getElasticsearchStats,
  ElasticsearchSearchParams 
} from '../../services/elasticsearchService';

// Query keys
export const elasticsearchKeys = {
  all: ['elasticsearch'] as const,
  health: () => [...elasticsearchKeys.all, 'health'] as const,
  stats: () => [...elasticsearchKeys.all, 'stats'] as const,
  search: (params: ElasticsearchSearchParams) => [...elasticsearchKeys.all, 'search', params] as const,
};

/**
 * Elasticsearch bağlantı durumunu kontrol eder
 */
export const useElasticsearchHealth = () => {
  return useQuery({
    queryKey: elasticsearchKeys.health(),
    queryFn: checkElasticsearchHealth,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Elasticsearch index istatistiklerini alır
 */
export const useElasticsearchStats = () => {
  return useQuery({
    queryKey: elasticsearchKeys.stats(),
    queryFn: getElasticsearchStats,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 15 * 60 * 1000, // 15 dakika
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Elasticsearch ile arama yapar
 */
export const useElasticsearchSearch = (
  params: ElasticsearchSearchParams,
  enabled = true
) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: elasticsearchKeys.search(params),
    queryFn: () => searchListingsWithElasticsearch(params, user?.id || null),
    enabled: enabled && !!params.query?.trim(),
    staleTime: 2 * 60 * 1000, // 2 dakika (arama sonuçları daha volatile)
    gcTime: 5 * 60 * 1000, // 5 dakika
    retry: 1,
    retryDelay: 500,
    select: (data: any) => {
      console.log('🔍 Elasticsearch search result:', data);
      
      // API'den dönen veri yapısını kontrol et
      if (data?.data && Array.isArray(data.data)) {
        return {
          listings: data.data,
          totalCount: data.data.length,
        };
      } else if (Array.isArray(data)) {
        return {
          listings: data,
          totalCount: data.length,
        };
      } else if (data?.listings) {
        return {
          listings: data.listings,
          totalCount: data.totalCount || data.listings.length,
        };
      } else {
        return {
          listings: [],
          totalCount: 0,
        };
      }
    },
  });
};

/**
 * Elasticsearch arama işlemleri için helper hook
 */
export const useElasticsearchSearchActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Arama state'ini ayrı tut
  const [searchState, setSearchState] = useState<ElasticsearchSearchParams>({
    query: '',
    filters: {
      category: '',
      location: '',
      minBudget: undefined,
      maxBudget: undefined,
      urgency: '',
      attributes: {},
    },
    sort: {
      field: 'created_at',
      order: 'desc',
    },
    page: 1,
    limit: 20,
  });
  
  // Arama yapılıp yapılmadığını kontrol et
  const [hasSearched, setHasSearched] = useState(false);
  
  // Elasticsearch arama
  const { 
    data: searchResults, 
    isLoading: isSearchLoading, 
    error: searchError,
    refetch: refetchSearch 
  } = useElasticsearchSearch(
    searchState,
    hasSearched // Sadece arama yapıldığında tetiklensin
  );

  const performSearch = useCallback(async (query?: string) => {
    const searchText = query || searchState.query || '';
    
    console.log('🔍 Elasticsearch performSearch - Called with:', { query, searchText });
    
    if (searchText.trim()) {
      // Arama state'ini güncelle
      const newSearchState = {
        ...searchState,
        query: searchText,
        page: 1, // Yeni arama için sayfa 1'e dön
      };
      
      console.log('🔍 Elasticsearch performSearch - Setting new searchState:', newSearchState);
      setSearchState(newSearchState);
      
      // Arama yapıldığını işaretle
      console.log('🔍 Elasticsearch performSearch - Setting hasSearched to true');
      setHasSearched(true);
      
      // Arama otomatik olarak tetiklenecek (hasSearched state'i değiştiği için)
      console.log('🔍 Elasticsearch performSearch - Search will be triggered automatically');
    }
  }, [searchState]);

  const updateFilters = useCallback((newFilters: Partial<typeof searchState.filters>) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      page: 1, // Filtre değiştiğinde sayfa 1'e dön
    }));
    
    // Filtre değiştiğinde arama yap
    if (hasSearched) {
      setHasSearched(true);
    }
  }, [hasSearched]);

  const updateSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSearchState(prev => ({
      ...prev,
      sort: { field, order },
      page: 1, // Sıralama değiştiğinde sayfa 1'e dön
    }));
    
    // Sıralama değiştiğinde arama yap
    if (hasSearched) {
      setHasSearched(true);
    }
  }, [hasSearched]);

  const loadMore = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      page: (prev.page || 1) + 1,
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      filters: {
        category: '',
        location: '',
        minBudget: undefined,
        maxBudget: undefined,
        urgency: '',
        attributes: {},
      },
      sort: {
        field: 'created_at',
        order: 'desc',
      },
      page: 1,
      limit: 20,
    });
    setHasSearched(false);
  }, []);

  return {
    // State
    searchState,
    hasSearched,
    
    // Results
    searchResults,
    isSearchLoading,
    searchError,
    
    // Actions
    performSearch,
    updateFilters,
    updateSort,
    loadMore,
    clearSearch,
    refetchSearch,
  };
};

// Import useState and useCallback
import { useState, useCallback } from 'react'; 