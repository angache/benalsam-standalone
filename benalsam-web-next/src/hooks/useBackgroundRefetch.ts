/**
 * useBackgroundRefetch Hook
 * 
 * Manages background refetching of queries
 * Useful for keeping data fresh without blocking UI
 */

'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface UseBackgroundRefetchOptions {
  /**
   * Query keys to refetch in background
   */
  queryKeys: (string | string[])[]
  /**
   * Interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number
  /**
   * Only refetch when tab is visible
   * @default true
   */
  onlyWhenVisible?: boolean
  /**
   * Enable background refetch
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook to refetch queries in the background
 * 
 * @example
 * ```tsx
 * useBackgroundRefetch({
 *   queryKeys: [['homepage-data'], ['homepage-stats']],
 *   interval: 30000, // 30 seconds
 *   onlyWhenVisible: true,
 * })
 * ```
 */
export function useBackgroundRefetch(options: UseBackgroundRefetchOptions) {
  const {
    queryKeys,
    interval = 30000,
    onlyWhenVisible = true,
    enabled = true,
  } = options

  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    isVisibleRef.current = !document.hidden

    // Refetch function
    const refetch = () => {
      if (onlyWhenVisible && !isVisibleRef.current) {
        return
      }

      console.log('🔄 [BackgroundRefetch] Refetching queries:', queryKeys)
      
      queryKeys.forEach((queryKey) => {
        queryClient.refetchQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          type: 'active', // Only refetch active queries
        })
      })
    }

    // Set up interval
    intervalRef.current = setInterval(refetch, interval)

    // Initial refetch after mount
    const initialTimeout = setTimeout(refetch, interval)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearTimeout(initialTimeout)
    }
  }, [queryKeys, interval, onlyWhenVisible, enabled, queryClient])

  return {
    refetch: () => {
      queryKeys.forEach((queryKey) => {
        queryClient.refetchQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        })
      })
    },
  }
}

