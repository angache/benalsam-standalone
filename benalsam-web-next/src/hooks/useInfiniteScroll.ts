/**
 * useInfiniteScroll Hook
 * 
 * Handles infinite scroll logic with prefetching
 */

'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

interface UseInfiniteScrollParams {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  /**
   * Total number of items currently loaded
   */
  itemCount: number
  /**
   * Number of items before the end to start prefetching
   * @default 4
   */
  prefetchThreshold?: number
  /**
   * Root margin for prefetch observer
   * @default '400px'
   */
  prefetchRootMargin?: string
}

/**
 * Hook to handle infinite scroll with prefetching
 * 
 * @example
 * ```tsx
 * const { ref, inView } = useInfiniteScroll({
 *   hasNextPage,
 *   isFetchingNextPage,
 *   fetchNextPage,
 *   itemCount: allListings.length,
 * })
 * ```
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  itemCount,
  prefetchThreshold = 4,
  prefetchRootMargin = '400px',
}: UseInfiniteScrollParams) {
  const { ref, inView } = useInView()

  // Fetch next page when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage])

  // Prefetch next page when user is close to bottom
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const prefetchTriggerIndex = Math.max(0, itemCount - prefetchThreshold)
    const triggerElement = document.querySelector(`[data-listing-index="${prefetchTriggerIndex}"]`)
    
    if (!triggerElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            console.log('🔮 [useInfiniteScroll] Prefetching next page...')
            fetchNextPage()
          }
        })
      },
      { rootMargin: prefetchRootMargin }
    )

    observer.observe(triggerElement)
    return () => observer.disconnect()
  }, [itemCount, hasNextPage, isFetchingNextPage, fetchNextPage, prefetchThreshold, prefetchRootMargin])

  return { ref, inView }
}

