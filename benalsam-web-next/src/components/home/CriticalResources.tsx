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
      'https://res.cloudinary.com', // Cloudinary for images
      'https://images.unsplash.com', // Unsplash for images
    ]

    dnsPrefetchDomains.forEach((domain) => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

    // Preload LCP image (if known)
    // This should be the first large image that appears on the page
    // Typically the hero image or first listing image
    // Note: Update this with actual LCP image URL when known
    const lcpImageUrl = '/images/hero-placeholder.jpg' // Replace with actual LCP image
    if (lcpImageUrl) {
      const preloadLink = document.createElement('link')
      preloadLink.rel = 'preload'
      preloadLink.as = 'image'
      preloadLink.href = lcpImageUrl
      preloadLink.fetchPriority = 'high'
      document.head.appendChild(preloadLink)
    }

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

