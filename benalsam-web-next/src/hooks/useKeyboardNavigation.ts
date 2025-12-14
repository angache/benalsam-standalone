/**
 * useKeyboardNavigation Hook
 * 
 * Provides keyboard navigation utilities for accessible components
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  /**
   * Container element ref
   */
  containerRef: React.RefObject<HTMLElement>
  /**
   * Selector for focusable elements
   * @default 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
   */
  selector?: string
  /**
   * Enable arrow key navigation
   * @default true
   */
  arrowKeys?: boolean
  /**
   * Enable home/end key navigation
   * @default true
   */
  homeEnd?: boolean
  /**
   * Enable escape key handler
   * @default false
   */
  escape?: boolean
  /**
   * Callback when escape is pressed
   */
  onEscape?: () => void
}

/**
 * Hook to handle keyboard navigation in a container
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null)
 * useKeyboardNavigation({
 *   containerRef,
 *   arrowKeys: true,
 *   onEscape: () => setIsOpen(false),
 * })
 * ```
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    containerRef,
    selector = 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    arrowKeys = true,
    homeEnd = true,
    escape = false,
    onEscape,
  } = options

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!containerRef.current) return

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(selector)
      ).filter((el) => {
        // Filter out disabled and hidden elements
        return !el.hasAttribute('disabled') && 
               !el.hasAttribute('aria-hidden') &&
               el.offsetParent !== null
      })

      if (focusableElements.length === 0) return

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      )

      let nextIndex = currentIndex

      // Arrow key navigation
      if (arrowKeys) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault()
          nextIndex = currentIndex < focusableElements.length - 1 
            ? currentIndex + 1 
            : 0
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault()
          nextIndex = currentIndex > 0 
            ? currentIndex - 1 
            : focusableElements.length - 1
        }
      }

      // Home/End navigation
      if (homeEnd) {
        if (e.key === 'Home') {
          e.preventDefault()
          nextIndex = 0
        } else if (e.key === 'End') {
          e.preventDefault()
          nextIndex = focusableElements.length - 1
        }
      }

      // Escape handler
      if (escape && e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      // Focus the next element
      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus()
      }
    },
    [containerRef, selector, arrowKeys, homeEnd, escape, onEscape]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, handleKeyDown])
}

/**
 * Hook to trap focus within a container (for modals, dropdowns, etc.)
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector = 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter((el) => {
      return !el.hasAttribute('disabled') && 
             !el.hasAttribute('aria-hidden') &&
             el.offsetParent !== null
    })

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    // Focus first element when trap is enabled
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [containerRef, enabled])
}

