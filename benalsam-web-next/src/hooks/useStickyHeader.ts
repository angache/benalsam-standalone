/**
 * useStickyHeader Hook
 * 
 * Manages sticky header behavior with scroll effects
 */

'use client'

import { useState, useEffect } from 'react'

interface UseStickyHeaderOptions {
  /**
   * Scroll threshold to trigger shadow
   * @default 10
   */
  threshold?: number
}

/**
 * Hook to manage sticky header with scroll effects
 * 
 * @example
 * ```tsx
 * const { isScrolled, scrollY } = useStickyHeader()
 * 
 * <header className={cn(
 *   "sticky top-0 z-50",
 *   isScrolled && "shadow-md"
 * )}>
 * ```
 */
export function useStickyHeader(options: UseStickyHeaderOptions = {}) {
  const { threshold = 10 } = options
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsScrolled(currentScrollY > threshold)
    }

    // Initial check
    handleScroll()

    // Throttle scroll events for better performance
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return {
    isScrolled,
    scrollY,
  }
}

