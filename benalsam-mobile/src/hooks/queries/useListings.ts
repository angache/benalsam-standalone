import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { queryKeys, queryClient } from '../../lib/queryClient';
import {
  fetchListings,
  fetchPopularListings,
  fetchTodaysDeals,
  fetchMostOfferedListings,
  fetchFilteredListings,
  fetchMyListings,
} from '../../services/listingService';
import { fetchSingleListing } from '../../services/listingService/fetchers';
import { Listing, QueryFilters } from '../../types';
import { ListingWithUser } from '../../services/listingService/core';

// Main listings hook
export const useListings = (options?: UseQueryOptions<ListingWithUser[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<ListingWithUser[], Error>({
    queryKey: queryKeys.listings.list(),
    queryFn: async () => {
      const result = await fetchListings(user?.id || null);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch listings');
      }
      return result.data || [];
    },
    enabled: true, // Her zaman çalışsın, user olmasa da
    ...options,
  });
};

// Single listing detail hook
export const useListing = (
  listingId: string,
  options?: UseQueryOptions<ListingWithUser | null, Error>
) => {
  const { user } = useAuthStore();
  
  return useQuery<ListingWithUser | null, Error>({
    queryKey: queryKeys.listings.detail(listingId),
    queryFn: async () => {
      const result = await fetchSingleListing(listingId, user?.id || null);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch listing');
      }
      return result.data || null;
    },
    enabled: !!listingId,
    ...options,
  });
};

// Popular listings hook
export const usePopularListings = (options?: UseQueryOptions<ListingWithUser[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<ListingWithUser[], Error>({
    queryKey: queryKeys.listings.popular(),
    queryFn: async () => {
      const result = await fetchPopularListings(user?.id || null);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch popular listings');
      }
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 dakika fresh - popular listings daha sık güncellenir
    ...options,
  });
};

// Today's deals hook
export const useTodaysDeals = (options?: UseQueryOptions<ListingWithUser[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<ListingWithUser[], Error>({
    queryKey: queryKeys.listings.todaysDeals(),
    queryFn: async () => {
      const result = await fetchTodaysDeals(user?.id || null);
      if (!Array.isArray(result)) {
        throw new Error('Failed to fetch today\'s deals');
      }
      return result;
    },
    staleTime: 1 * 60 * 1000, // 1 dakika fresh - günün fırsatları çok dinamik
    ...options,
  });
};

// Most offered listings hook
export const useMostOfferedListings = (options?: UseQueryOptions<ListingWithUser[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery<ListingWithUser[], Error>({
    queryKey: queryKeys.listings.mostOffered(),
    queryFn: async () => {
      const result = await fetchMostOfferedListings(user?.id || null);
      if (!Array.isArray(result)) {
        throw new Error('Failed to fetch most offered listings');
      }
      return result;
    },
    staleTime: 3 * 60 * 1000, // 3 dakika fresh
    ...options,
  });
};

// Filtered listings hook
export const useFilteredListings = (
  filters: QueryFilters,
  page = 1,
  pageSize = 20,
  options?: UseQueryOptions<ListingWithUser[], Error>
) => {
  const { user } = useAuthStore();
  
  return useQuery<ListingWithUser[], Error>({
    queryKey: queryKeys.listings.filtered({ ...filters, page, pageSize }),
    queryFn: async () => {
      const result = await fetchFilteredListings(filters, user?.id || null, page, pageSize);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch filtered listings');
      }
      return result.data || [];
    },
    enabled: !!filters && Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000, // 2 dakika fresh
    ...options,
  });
};

// User's own listings hook
export const useUserListings = (
  userId?: string,
  options?: UseQueryOptions<ListingWithUser[], Error>
) => {
  const { user } = useAuthStore();
  const targetUserId = userId || user?.id;
  
  return useQuery<ListingWithUser[], Error>({
    queryKey: queryKeys.listings.userListings(targetUserId || ''),
    queryFn: async () => {
      if (!targetUserId) return [];
      const result = await fetchMyListings(targetUserId);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch user listings');
      }
      return result.data || [];
    },
    enabled: !!targetUserId,
    ...options,
  });
};

// Prefetch helper functions
export const prefetchListing = (listingId: string) => {
  const { user } = useAuthStore.getState();
  return queryClient.prefetchQuery({
    queryKey: queryKeys.listings.detail(listingId),
    queryFn: async () => {
      const result = await fetchSingleListing(listingId, user?.id || null);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch listing');
      }
      return result.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const prefetchPopularListings = () => {
  const { user } = useAuthStore.getState();
  return queryClient.prefetchQuery({
    queryKey: queryKeys.listings.popular(),
    queryFn: async () => {
      const result = await fetchPopularListings(user?.id || null);
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch popular listings');
      }
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}; 