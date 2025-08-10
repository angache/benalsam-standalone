import { useQuery } from '@tanstack/react-query';
import { getSimilarListings, getSimilarListingsByCategory } from '../../services/similarListingsService';

/**
 * Verilen ilana benzer ilanları getiren hook
 */
export const useSimilarListings = (listingId: string, limit = 8) => {
  return useQuery({
    queryKey: ['similar-listings', listingId, limit],
    queryFn: () => getSimilarListings(listingId, limit),
    enabled: !!listingId,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 20 * 60 * 1000, // 20 dakika
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Kategori bazlı benzer ilanları getiren hook
 */
export const useSimilarListingsByCategory = (category: string, excludeListingId?: string, limit = 8) => {
  return useQuery({
    queryKey: ['similar-listings-by-category', category, excludeListingId, limit],
    queryFn: () => getSimilarListingsByCategory(category, excludeListingId, limit),
    enabled: !!category,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 20 * 60 * 1000, // 20 dakika
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 