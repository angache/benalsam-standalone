/**
 * XSS Sanitization Utility
 * 
 * Protects against Cross-Site Scripting (XSS) attacks by sanitizing user input
 * before rendering it in the DOM.
 * 
 * Usage:
 * import { sanitizeText, sanitizeHTML, sanitizeUrl } from '@/utils/sanitize'
 * 
 * const safeName = sanitizeText(userInput)
 * const safeHTML = sanitizeHTML(richTextContent)
 * const safeUrl = sanitizeUrl(userProvidedLink)
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize plain text - removes ALL HTML tags
 * Use for: user names, titles, descriptions, messages
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return ''
  
  // Strip all HTML tags
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize HTML with safe tags only
 * Use for: rich text content, formatted messages
 * 
 * Allowed tags: p, br, strong, em, u, a, ul, ol, li
 */
export const sanitizeHTML = (html: string | null | undefined): string => {
  if (!html) return ''
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'b', 'i'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    // Auto-add rel="noopener noreferrer" to links
    HOOKS: {
      afterSanitizeAttributes: (node) => {
        if (node.tagName === 'A') {
          node.setAttribute('rel', 'noopener noreferrer')
          node.setAttribute('target', '_blank')
        }
      }
    }
  })
}

/**
 * Sanitize URLs - only allows http, https, and mailto protocols
 * Use for: user-provided links, profile URLs, listing links
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  
  // Remove any HTML
  const cleaned = DOMPurify.sanitize(url, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  })
  
  // Check if URL is safe
  try {
    const parsed = new URL(cleaned)
    const allowedProtocols = ['http:', 'https:', 'mailto:']
    
    if (allowedProtocols.includes(parsed.protocol)) {
      return cleaned
    }
  } catch {
    // Invalid URL, return empty
    return ''
  }
  
  return ''
}

/**
 * Sanitize object - recursively sanitizes all string values
 * Use for: API responses, user-provided objects
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value) as any
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value) as any
    }
  }
  
  return sanitized
}

/**
 * Sanitize message content
 * Special handling for messages - allows line breaks, strips everything else
 */
export const sanitizeMessage = (content: string | null | undefined): string => {
  if (!content) return ''
  
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize listing title
 * Strict - no HTML allowed, but preserves special characters
 */
export const sanitizeListingTitle = (title: string | null | undefined): string => {
  if (!title) return ''
  
  // Remove HTML but keep special chars like &, <, >
  const sanitized = DOMPurify.sanitize(title, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
  
  // Trim and limit length
  return sanitized.trim().slice(0, 200)
}

/**
 * Sanitize search query
 * Extra strict - removes HTML and potentially dangerous characters
 */
export const sanitizeSearchQuery = (query: string | null | undefined): string => {
  if (!query) return ''
  
  const sanitized = DOMPurify.sanitize(query, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
  
  // Remove special SQL/injection characters
  return sanitized
    .replace(/[;'"\\]/g, '')
    .trim()
    .slice(0, 100)
}

// Type-safe sanitizers for common use cases
export const sanitizers = {
  text: sanitizeText,
  html: sanitizeHTML,
  url: sanitizeUrl,
  object: sanitizeObject,
  message: sanitizeMessage,
  listingTitle: sanitizeListingTitle,
  searchQuery: sanitizeSearchQuery,
} as const

export default sanitizers

