/**
 * useFilteredListings Hook
 * 
 * Handles infinite query for filtered listings
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { listingService } from '@/services/listingService'
import type { FilterState } from '@/components/home/FilterSidebar'

export type SortOption = 'newest' | 'price_low' | 'price_high' | 'popular'

interface UseFilteredListingsParams {
  filters: FilterState
  sortBy: SortOption
  userId?: string | null
  pageSize?: number
}

/**
 * Hook to fetch filtered listings with infinite scroll
 */
export function useFilteredListings({
  filters,
  sortBy,
  userId,
  pageSize = 12,
}: UseFilteredListingsParams) {
  // Convert sort option to API params
  const getSortParams = (sort: SortOption) => {
    switch (sort) {
      case 'newest':
        return { sortField: 'created_at', sortOrder: 'desc' as const }
      case 'price_low':
        return { sortField: 'budget', sortOrder: 'asc' as const }
      case 'price_high':
        return { sortField: 'budget', sortOrder: 'desc' as const }
      case 'popular':
        return { sortField: 'view_count', sortOrder: 'desc' as const }
      default:
        return { sortField: 'created_at', sortOrder: 'desc' as const }
    }
  }

  const { sortField, sortOrder } = getSortParams(sortBy)

  return useInfiniteQuery({
    queryKey: ['filtered-listings', filters, userId, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      console.log('🔍 [useFilteredListings] Fetching page:', pageParam, 'with filters:', filters, 'sortBy:', sortBy)
      
      const result = await listingService.getListingsWithFilters(
        userId || null,
        {
          search: filters.searchQuery || undefined,
          categoryId: filters.categoryId || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          location: filters.location || undefined,
          urgency: filters.urgency || undefined,
          sortBy: sortField,
          sortOrder: sortOrder,
        },
        {
          page: pageParam,
          limit: pageSize,
        }
      )

      return {
        listings: result.listings,
        totalCount: result.total,
        page: pageParam,
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.totalCount / pageSize)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Retry on network errors or 5xx errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('timeout')
        ) {
          return failureCount < 3
        }
      }
      return failureCount < 2 // Default: retry once
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 10000)
    },
  })
}

