/**
 * Lazy Section Component
 * 
 * Wraps sections with Intersection Observer for lazy loading
 * Only renders children when section enters viewport
 */

'use client'

import { Suspense, ReactNode } from 'react'
import { useLazyLoad } from '@/hooks/useIntersectionObserver'

interface LazySectionProps {
  /**
   * Content to render when section is visible
   */
  children: ReactNode
  
  /**
   * Fallback to show while loading
   */
  fallback?: ReactNode
  
  /**
   * Root margin for early triggering (e.g., '200px' to load 200px before visible)
   * @default '100px'
   */
  rootMargin?: string
  
  /**
   * Threshold for intersection (0 to 1)
   * @default 0.1
   */
  threshold?: number
  
  /**
   * Minimum height to reserve space before loading
   * Prevents layout shift
   */
  minHeight?: string
  
  /**
   * Additional className for the wrapper
   */
  className?: string
}

/**
 * LazySection - Lazy loads content when it enters viewport
 * 
 * @example
 * ```tsx
 * <LazySection fallback={<Skeleton />} rootMargin="200px">
 *   <ExpensiveComponent />
 * </LazySection>
 * ```
 */
export function LazySection({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  minHeight,
  className = '',
}: LazySectionProps) {
  const { ref, shouldLoad } = useLazyLoad({
    rootMargin,
    threshold,
  })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{ minHeight: shouldLoad ? undefined : minHeight }}
    >
      {shouldLoad ? (
        <Suspense fallback={fallback}>{children}</Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

