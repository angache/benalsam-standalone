/**
 * useListingFavorites Hook
 * 
 * Handles favorite toggle with optimistic updates
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleFavorite } from '@/services/favoriteService'
import { useToast } from '@/components/ui/use-toast'
import type { FilterState } from '@/components/home/FilterSidebar'
import type { SortOption } from './useFilteredListings'

interface UseListingFavoritesParams {
  userId: string
  filters: FilterState
  sortBy: SortOption
}

/**
 * Hook to handle listing favorite toggle with optimistic updates
 */
export function useListingFavorites({
  userId,
  filters,
  sortBy,
}: UseListingFavoritesParams) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string, isFavorited: boolean }) => {
      // Real API call
      const newIsFavorited = await toggleFavorite(userId, listingId)
      return { listingId, isFavorited: newIsFavorited }
    },
    onMutate: async ({ listingId, isFavorited }) => {
      // Show toast
      toast({
        title: isFavorited ? "❤️ Favorilere Eklendi" : "Favorilerden Çıkarıldı",
        description: isFavorited ? "İlan favorilerinize kaydedildi" : "İlan favorilerinizden kaldırıldı",
        duration: 2000,
      })
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['filtered-listings'] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['filtered-listings', filters, userId, sortBy])

      // Optimistically update the cache
      queryClient.setQueryData(['filtered-listings', filters, userId, sortBy], (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            listings: page.listings.map((listing: any) =>
              listing.id === listingId
                ? { ...listing, is_favorited: isFavorited }
                : listing
            )
          }))
        }
      })

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Show error toast
      toast({
        title: "❌ Hata",
        description: "Favori işlemi başarısız oldu",
        variant: "destructive",
        duration: 3000,
      })
      
      // Revert the optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['filtered-listings', filters, userId, sortBy], context.previousData)
      }
    },
    onSuccess: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['filtered-listings'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

