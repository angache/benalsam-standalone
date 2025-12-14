/**
 * Critical Resources Component
 * 
 * Preloads and prefetches critical resources for homepage
 * Improves First Contentful Paint and Time to Interactive
 */

'use client'

import { useEffect } from 'react'

/**
 * CriticalResources - Preloads critical resources
 * 
 * This component should be placed early in the page to ensure
 * resources are preloaded as soon as possible
 */
export function CriticalResources() {
  useEffect(() => {
    // Preload critical API endpoints
    const criticalEndpoints = [
      '/api/listings?page=1&limit=8', // Today's listings
      '/api/categories/popular?limit=12', // Popular categories
    ]

    // Prefetch critical endpoints
    criticalEndpoints.forEach((endpoint) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = endpoint
      link.as = 'fetch'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

    // Preconnect to external domains
    const externalDomains = [
      'https://api.benalsam.com',
      'https://cdn.benalsam.com',
    ]

    externalDomains.forEach((domain) => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      document.head.appendChild(link)
    })

    // DNS prefetch for third-party services
    const dnsPrefetchDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ]

    dnsPrefetchDomains.forEach((domain) => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

    // Cleanup function
    return () => {
      // Remove prefetch links on unmount
      document.head
        .querySelectorAll('link[rel="prefetch"]')
        .forEach((link) => link.remove())
    }
  }, [])

  return null // This component doesn't render anything
}

