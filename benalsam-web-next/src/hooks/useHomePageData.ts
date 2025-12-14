/**
 * Homepage Data Hook
 * 
 * Fetches all homepage data using batch API calls
 * Uses React Query for caching and state management
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchHomePageData, fetchHomePageStats } from '@/services/homePageService'
import { useAuth } from '@/hooks/useAuth'
import { useQueryWithRetry } from './useQueryWithRetry'

/**
 * Hook to fetch all homepage data in a single batch call
 * Enhanced with retry mechanism
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, retry } = useHomePageData()
 * 
 * if (isLoading) return <Loading />
 * if (error) return <Error onRetry={retry} />
 * 
 * return (
 *   <div>
 *     <TodaysListings listings={data.todaysListings} />
 *     <FlashDeals listings={data.flashDeals} />
 *   </div>
 * )
 * ```
 */
export function useHomePageData() {
  const { user } = useAuth()

  return useQueryWithRetry({
    queryKey: ['homepage-data', user?.id],
    queryFn: () => fetchHomePageData(user?.id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    maxRetries: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    // Request deduplication: React Query automatically deduplicates requests with the same queryKey
    // Multiple components using this hook will share the same request
    refetchOnMount: 'always', // Always refetch on mount if data is stale
    refetchOnReconnect: true, // Refetch when connection is restored
  })
}

/**
 * Hook to fetch homepage statistics
 * Enhanced with retry mechanism
 * 
 * @example
 * ```tsx
 * const { data, error, retry } = useHomePageStats()
 * 
 * return <div>{data.totalListings}+ İlan</div>
 * ```
 */
export function useHomePageStats() {
  return useQueryWithRetry({
    queryKey: ['homepage-stats'],
    queryFn: fetchHomePageStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    maxRetries: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    // Request deduplication: React Query automatically deduplicates requests
    refetchOnMount: 'always', // Always refetch on mount if data is stale
    refetchOnReconnect: true, // Refetch when connection is restored
  })
}

