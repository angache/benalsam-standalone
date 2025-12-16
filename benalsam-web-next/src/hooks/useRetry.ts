/**
 * useRetry Hook
 * 
 * Provides retry mechanism for async operations
 * Useful for API calls and data fetching
 */

'use client'

import { useState, useCallback } from 'react'

interface UseRetryOptions {
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
   * Exponential backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number
  /**
   * Callback when retry limit is reached
   */
  onMaxRetriesReached?: () => void
}

interface RetryState {
  retryCount: number
  isRetrying: boolean
  lastError: Error | null
}

/**
 * Hook to handle retry logic for async operations
 * 
 * @example
 * ```tsx
 * const { retry, retryState, reset } = useRetry({
 *   maxRetries: 3,
 *   retryDelay: 1000,
 * })
 * 
 * const handleFetch = async () => {
 *   try {
 *     await fetchData()
 *   } catch (error) {
 *     retry(() => fetchData())
 *   }
 * }
 * ```
 */
export function useRetry(options: UseRetryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onMaxRetriesReached,
  } = options

  const [state, setState] = useState<RetryState>({
    retryCount: 0,
    isRetrying: false,
    lastError: null,
  })

  const retry = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      // Use functional update to avoid stale closure
      let currentRetryCount: number
      setState((prev) => {
        currentRetryCount = prev.retryCount
        
        if (prev.retryCount >= maxRetries) {
          if (onMaxRetriesReached) {
            onMaxRetriesReached()
          }
          throw new Error(`Max retries (${maxRetries}) reached`)
        }
        
        return {
          ...prev,
          isRetrying: true,
        }
      })

      // Calculate delay with exponential backoff using current retry count
      const delay = retryDelay * Math.pow(backoffMultiplier, currentRetryCount!)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      try {
        const result = await fn()
        
        // Success - reset retry state
        setState({
          retryCount: 0,
          isRetrying: false,
          lastError: null,
        })
        
        return result
      } catch (error) {
        // Increment retry count using functional update
        setState((prev) => {
          const newRetryCount = prev.retryCount + 1
          
          // If we haven't reached max retries, throw to allow caller to retry again
          if (newRetryCount < maxRetries) {
            throw error
          }

          // Max retries reached
          if (onMaxRetriesReached) {
            onMaxRetriesReached()
          }
          
          return {
            retryCount: newRetryCount,
            isRetrying: false,
            lastError: error instanceof Error ? error : new Error(String(error)),
          }
        })
        
        // If we reach here, max retries was reached
        throw error
      }
    },
    [maxRetries, retryDelay, backoffMultiplier, onMaxRetriesReached] // Removed state.retryCount
  )

  const reset = useCallback(() => {
    setState({
      retryCount: 0,
      isRetrying: false,
      lastError: null,
    })
  }, [])

  return {
    retry,
    reset,
    retryState: state,
    canRetry: state.retryCount < maxRetries,
    remainingRetries: maxRetries - state.retryCount,
  }
}

