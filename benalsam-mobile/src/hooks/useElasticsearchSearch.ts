import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { searchListings, SearchParams, SearchResponse } from '../services/searchService';

// Single search query hook
export const useElasticsearchSearch = (
  params: SearchParams,
  options?: Omit<UseQueryOptions<SearchResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['elasticsearch-search', params],
    queryFn: () => searchListings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Infinite search query hook (for pagination)
export const useInfiniteElasticsearchSearch = (
  params: Omit<SearchParams, 'page'>,
  options?: Omit<UseInfiniteQueryOptions<SearchResponse, Error>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) => {
  return useInfiniteQuery({
    queryKey: ['elasticsearch-infinite-search', params],
    queryFn: ({ pageParam }) => 
      searchListings({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page + 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Search suggestions hook
export const useSearchSuggestions = (
  query: string,
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      
      const response = await searchListings({
        query,
        limit: 5,
        filters: { categories: [] } // No category filter for suggestions
      });
      
      // Extract suggestions from response
      return response.suggestions || [];
    },
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// Popular searches hook
export const usePopularSearches = (
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      // This could be fetched from admin-backend analytics
      // For now, return static popular searches
      return [
        'iPhone',
        'Samsung',
        'Laptop',
        'Araba',
        'Ev',
        'Telefon',
        'Bilgisayar',
        'Tablet'
      ];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  });
};

// Search analytics hook
export const useSearchAnalytics = (
  query: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['search-analytics', query],
    queryFn: async () => {
      // This could fetch search analytics from admin-backend
      // For now, return basic analytics
      return {
        query,
        timestamp: new Date().toISOString(),
        resultCount: 0,
        searchDuration: 0,
        source: 'elasticsearch'
      };
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}; 