/**
 * useScrollSpy Hook
 * 
 * Tracks which section is currently in view
 * Useful for navigation highlighting
 */

'use client'

import { useState, useEffect } from 'react'

interface UseScrollSpyOptions {
  /**
   * Section selectors to track
   */
  sectionSelectors: string[]
  /**
   * Root margin for intersection observer
   * @default '0px 0px -80% 0px'
   */
  rootMargin?: string
  /**
   * Threshold for intersection
   * @default 0.1
   */
  threshold?: number
}

/**
 * Hook to track which section is currently in view
 * 
 * @example
 * ```tsx
 * const activeSection = useScrollSpy({
 *   sectionSelectors: ['#hero', '#listings', '#categories'],
 * })
 * 
 * <nav>
 *   <a href="#hero" className={activeSection === '#hero' ? 'active' : ''}>
 *     Hero
 *   </a>
 * </nav>
 * ```
 */
export function useScrollSpy(options: UseScrollSpyOptions) {
  const {
    sectionSelectors,
    rootMargin = '0px 0px -80% 0px',
    threshold = 0.1,
  } = options

  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const sections = sectionSelectors
      .map(selector => document.querySelector(selector))
      .filter(Boolean) as Element[]

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio (highest first)
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          
          const topEntry = visibleEntries[0]
          const id = topEntry.target.id
          
          if (id) {
            setActiveSection(`#${id}`)
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    sections.forEach(section => observer.observe(section))

    return () => {
      sections.forEach(section => observer.unobserve(section))
    }
  }, [sectionSelectors, rootMargin, threshold])

  return activeSection
}

