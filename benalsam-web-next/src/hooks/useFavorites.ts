/**
 * useFavorites Hook
 * 
 * Fetches user's favorite listings with React Query
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { fetchUserFavoriteListings } from '@/services/favoriteService'
import { removeFavorite } from '@/services/favoriteService'
import { useToast } from '@/components/ui/use-toast'
import type { Listing } from '@/types'

/**
 * Hook to fetch user's favorite listings
 */
export function useFavorites() {
  const { user } = useAuth()
  const { toast } = useToast()

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return await fetchUserFavoriteListings(user.id)
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  })
}

/**
 * Hook to remove a favorite listing
 */
export function useRemoveFavorite() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!user?.id) throw new Error('User not authenticated')
      return await removeFavorite(user.id, listingId)
    },
    onSuccess: () => {
      // Invalidate favorites query
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      // Also invalidate filtered listings to update favorite status
      queryClient.invalidateQueries({ queryKey: ['filtered-listings'] })
      
      toast({
        title: 'Favorilerden Kaldırıldı',
        description: 'İlan favorilerinizden kaldırıldı.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: 'Favori kaldırılırken bir hata oluştu.',
        variant: 'destructive',
      })
    },
  })
}

