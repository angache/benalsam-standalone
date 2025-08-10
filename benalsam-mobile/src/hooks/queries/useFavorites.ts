import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { queryKeys } from '../../lib/queryClient';
import {
  fetchUserFavoriteListings,
  fetchUserFavoriteStatusForListings,
  addFavorite,
  removeFavorite,
  toggleFavorite as toggleFavoriteService,
} from '../../services/favoriteService';
import { Listing, ApiResponse } from '../../types';

// User's favorite listings hook
export const useFavoriteListings = (options?: UseQueryOptions<Listing[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.favorites.all(user?.id || ''),
    queryFn: async () => {
      const response = await fetchUserFavoriteListings(user?.id || '');
      if (response.error) throw response.error;
      return response.data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 dakika fresh - favorites sık değişebilir
    ...options,
  });
};

// Favorite status for multiple listings hook
export const useFavoriteStatus = (
  listingIds: string[],
  options?: UseQueryOptions<{ [key: string]: boolean }, Error>
) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.favorites.status(user?.id || '', listingIds),
    queryFn: async () => {
      const response = await fetchUserFavoriteStatusForListings(user?.id || '', listingIds);
      if (response.error) throw response.error;
      return response.data || {};
    },
    enabled: !!user?.id && listingIds.length > 0,
    staleTime: 1 * 60 * 1000, // 1 dakika fresh - status hızlı değişir
    ...options,
  });
};

// Add to favorites mutation
export const useAddToFavorites = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (listingId: string) => addFavorite(user?.id || '', listingId),
    onMutate: async (listingId: string) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all(user.id) });
      
      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData<Listing[]>(queryKeys.favorites.all(user.id));
      
      // Optimistically update to the new value - bu kısım listing objesini eklemek için geliştirilmeli
      // Şimdilik sadece invalidate edeceğiz
      
      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFavorites && user?.id) {
        queryClient.setQueryData(queryKeys.favorites.all(user.id), context.previousFavorites);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all(user.id) });
        // Also invalidate listings to update is_favorited status
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      }
    },
  });
};

// Remove from favorites mutation
export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (listingId: string) => removeFavorite(user?.id || '', listingId),
    onMutate: async (listingId: string) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all(user.id) });
      
      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData<Listing[]>(queryKeys.favorites.all(user.id));
      
      // Optimistically remove from the list
      if (previousFavorites) {
        const updatedFavorites = previousFavorites.filter(fav => fav.id !== listingId);
        queryClient.setQueryData(queryKeys.favorites.all(user.id), updatedFavorites);
      }
      
      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFavorites && user?.id) {
        queryClient.setQueryData(queryKeys.favorites.all(user.id), context.previousFavorites);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all(user.id) });
        // Also invalidate listings to update is_favorited status
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      }
    },
  });
};

// Toggle favorite helper hook
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { mutateAsync: toggleFavorite } = useMutation({
    mutationFn: (listingId: string) => toggleFavoriteService(user?.id || '', listingId),
    onMutate: async (listingId: string) => {
      if (!user?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all(user.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.all });
      
      // Snapshot the previous values
      const previousFavorites = queryClient.getQueryData<Listing[]>(queryKeys.favorites.all(user.id));
      const previousListings = queryClient.getQueryData<Listing[]>(queryKeys.listings.all);
      
      // Optimistically update the UI
      if (previousListings) {
        const updatedListings = previousListings.map(listing => {
          if (listing.id === listingId) {
            return {
              ...listing,
              is_favorited: !listing.is_favorited
            };
          }
          return listing;
        });
        queryClient.setQueryData(queryKeys.listings.all, updatedListings);
      }
      
      return { previousFavorites, previousListings };
    },
    onError: (err, variables, context) => {
      if (!user?.id || !context) return;
      
      // Rollback on error
      if (context.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all(user.id), context.previousFavorites);
      }
      if (context.previousListings) {
        queryClient.setQueryData(queryKeys.listings.all, context.previousListings);
      }
    },
    onSettled: (data, error, listingId) => {
      if (!user?.id) return;
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.status(user.id, [listingId]) });
    },
  });

  return { toggleFavorite };
}; 