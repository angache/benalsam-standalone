/**
 * useQueryWithRetry Hook
 * 
 * Wrapper around React Query's useQuery with enhanced retry logic
 * Provides better error handling and retry mechanism
 */

'use client'

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import { useRetry } from './useRetry'

interface UseQueryWithRetryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'retry'> {
  /**
   * Maximum number of retries
   * @default 3
   */
  maxRetries?: number
  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number
  /**
   * Callback when retry limit is reached
   */
  onMaxRetriesReached?: () => void
}

/**
 * Enhanced useQuery hook with better retry logic
 * 
 * @example
 * ```tsx
 * const { data, error, isLoading, retry } = useQueryWithRetry({
 *   queryKey: ['listings'],
 *   queryFn: fetchListings,
 *   maxRetries: 3,
 *   retryDelay: 1000,
 * })
 * ```
 */
export function useQueryWithRetry<TData = unknown, TError = Error>(
  options: UseQueryWithRetryOptions<TData, TError>
): UseQueryResult<TData, TError> & { retry: () => void } {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onMaxRetriesReached,
    ...queryOptions
  } = options

  const { retry, reset, retryState } = useRetry({
    maxRetries,
    retryDelay,
    onMaxRetriesReached,
  })

  // Use React Query's built-in retry with exponential backoff
  const queryResult = useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error) => {
      // Don't retry if max retries reached
      if (failureCount >= maxRetries) {
        return false
      }

      // Retry on network errors or 5xx errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('timeout')
        ) {
          return true
        }
      }

      // Check if error is a response with 5xx status
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status
        if (status >= 500 && status < 600) {
          return true
        }
      }

      return failureCount < maxRetries
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      return Math.min(1000 * Math.pow(2, attemptIndex), 30000)
    },
  })

  // Manual retry function
  const handleRetry = () => {
    reset()
    queryResult.refetch()
  }

  return {
    ...queryResult,
    retry: handleRetry,
  }
}

