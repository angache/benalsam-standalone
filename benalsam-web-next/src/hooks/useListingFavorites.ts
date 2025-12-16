/**
 * useListingFavorites Hook
 * 
 * Handles favorite toggle with optimistic updates
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import type { FilterState } from '@/components/home/FilterSidebar'
import type { SortOption } from './useFilteredListings'

interface UseListingFavoritesParams {
  userId: string
  filters: FilterState
  sortBy: SortOption
}

/**
 * Hook to handle listing favorite toggle
 *
 * Basitleştirilmiş mantık:
 * - API'de favori ekleme/silme yapılır
 * - Başarılı olduğunda ilgili query'ler invalidate edilir
 * - Favori durumu server'dan yeniden hesaplanır (processFetchedListings + /api/favorites/check)
 */
export function useListingFavorites({
  userId,
  filters,
  sortBy,
}: UseListingFavoritesParams) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      if (!userId) {
        throw new Error('Giriş yapmalısınız')
      }

      // API route'larını kullan (daha güvenli ve tutarlı)
      if (isFavorited) {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Favori eklenemedi')
        }

        return { listingId, isFavorited: true }
      } else {
        // Remove favorite
        const response = await fetch(`/api/favorites?listingId=${listingId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Favori kaldırılamadı')
        }

        return { listingId, isFavorited: false }
      }
    },
    onMutate: async ({ listingId, isFavorited }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['filtered-listings'] })

      // Optimistically update ALL filtered-listings queries
      queryClient.setQueriesData(
        { queryKey: ['filtered-listings'] },
        (old: any) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              listings: page.listings.map((listing: any) =>
                listing.id === listingId
                  ? { ...listing, is_favorited: isFavorited }
                  : listing
              ),
            })),
          }
        }
      )

      // Show toast
      toast({
        title: isFavorited ? '❤️ Favorilere Eklendi' : 'Favorilerden Çıkarıldı',
        description: isFavorited
          ? 'İlan favorilerinize kaydedildi'
          : 'İlan favorilerinizden kaldırıldı',
        duration: 2000,
      })

      // Return context for rollback
      return { listingId }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context) {
        queryClient.invalidateQueries({ queryKey: ['filtered-listings'] })
      }

      toast({
        title: '❌ Hata',
        description: error instanceof Error ? error.message : 'Favori işlemi başarısız oldu',
        variant: 'destructive',
        duration: 3000,
      })
    },
    onSuccess: () => {
      // Invalidate to ensure consistency (optimistic update already done)
      queryClient.invalidateQueries({ queryKey: ['filtered-listings'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

