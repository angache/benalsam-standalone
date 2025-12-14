/**
 * Intersection Observer Hook
 * 
 * Detects when an element enters the viewport
 * Useful for lazy loading components and triggering animations
 */

'use client'

import { useState, useEffect, useRef, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * Only trigger once when element enters viewport
   * @default false
   */
  triggerOnce?: boolean
  
  /**
   * Minimum threshold before triggering
   * @default 0.1
   */
  threshold?: number | number[]
  
  /**
   * Root margin for early triggering
   * @default '0px'
   */
  rootMargin?: string
}

interface UseIntersectionObserverReturn {
  /**
   * Ref to attach to the element you want to observe
   */
  ref: RefObject<HTMLElement>
  
  /**
   * Whether the element is currently intersecting
   */
  isIntersecting: boolean
  
  /**
   * Whether the element has ever intersected (useful for triggerOnce)
   */
  hasIntersected: boolean
  
  /**
   * Intersection ratio (0 to 1)
   */
  intersectionRatio: number
}

/**
 * Hook to observe when an element enters the viewport
 * 
 * @example
 * ```tsx
 * const { ref, hasIntersected } = useIntersectionObserver({ triggerOnce: true })
 * 
 * return (
 *   <div ref={ref}>
 *     {hasIntersected && <ExpensiveComponent />}
 *   </div>
 * )
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    triggerOnce = false,
    threshold = 0.1,
    rootMargin = '0px',
    ...observerOptions
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // If already intersected and triggerOnce, don't observe
    if (hasIntersected && triggerOnce) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting
        const ratio = entry.intersectionRatio

        setIsIntersecting(isCurrentlyIntersecting)
        setIntersectionRatio(ratio)

        if (isCurrentlyIntersecting && !hasIntersected) {
          setHasIntersected(true)
          
          // If triggerOnce, disconnect observer
          if (triggerOnce) {
            observer.disconnect()
          }
        }
      },
      {
        threshold,
        rootMargin,
        ...observerOptions,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasIntersected, observerOptions])

  return {
    ref,
    isIntersecting,
    hasIntersected,
    intersectionRatio,
  }
}

/**
 * Hook specifically for lazy loading components
 * Triggers once when element enters viewport
 * 
 * @example
 * ```tsx
 * const { ref, shouldLoad } = useLazyLoad({ rootMargin: '200px' })
 * 
 * return (
 *   <div ref={ref}>
 *     {shouldLoad && <ExpensiveComponent />}
 *   </div>
 * )
 * ```
 */
export function useLazyLoad(
  options: Omit<UseIntersectionObserverOptions, 'triggerOnce'> = {}
): {
  ref: RefObject<HTMLElement>
  shouldLoad: boolean
} {
  const { ref, hasIntersected } = useIntersectionObserver({
    ...options,
    triggerOnce: true,
  })

  return {
    ref,
    shouldLoad: hasIntersected,
  }
}

