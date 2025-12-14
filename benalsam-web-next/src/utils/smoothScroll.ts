/**
 * Smooth Scroll Utilities
 * 
 * Functions for smooth scrolling behavior
 */

/**
 * Smooth scroll to an element
 * 
 * @param element - Element to scroll to (selector string or HTMLElement)
 * @param options - Scroll options
 */
export function smoothScrollTo(
  element: string | HTMLElement,
  options: {
    offset?: number
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  } = {}
) {
  const {
    offset = 0,
    behavior = 'smooth',
    block = 'start',
  } = options

  const targetElement = typeof element === 'string'
    ? document.querySelector(element)
    : element

  if (!targetElement) {
    console.warn(`Element not found: ${element}`)
    return
  }

  const elementPosition = targetElement.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - offset

  window.scrollTo({
    top: offsetPosition,
    behavior,
  })
}

/**
 * Smooth scroll to top
 */
export function scrollToTop(options: { behavior?: ScrollBehavior } = {}) {
  window.scrollTo({
    top: 0,
    behavior: options.behavior || 'smooth',
  })
}

/**
 * Smooth scroll to bottom
 */
export function scrollToBottom(options: { behavior?: ScrollBehavior } = {}) {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: options.behavior || 'smooth',
  })
}

/**
 * Check if smooth scroll is supported
 */
export function isSmoothScrollSupported(): boolean {
  return 'scrollBehavior' in document.documentElement.style
}

/**
 * Enable smooth scroll for the entire page
 */
export function enableSmoothScroll() {
  if (typeof document !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'smooth'
  }
}

/**
 * Disable smooth scroll for the entire page
 */
export function disableSmoothScroll() {
  if (typeof document !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'auto'
  }
}

