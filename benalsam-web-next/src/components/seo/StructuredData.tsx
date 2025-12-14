/**
 * Structured Data Component
 * 
 * Renders JSON-LD structured data for SEO
 */

'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  data: object | object[]
  id?: string
}

/**
 * Component to inject JSON-LD structured data into the page
 * 
 * @example
 * ```tsx
 * <StructuredData data={generateHomepageStructuredData(stats)} />
 * ```
 */
export function StructuredData({ data, id = 'structured-data' }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing script if present
    const existingScript = document.getElementById(id)
    if (existingScript) {
      existingScript.remove()
    }

    // Create new script element
    const script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    script.text = JSON.stringify(Array.isArray(data) ? data : [data])
    
    // Append to head
    document.head.appendChild(script)

    // Cleanup
    return () => {
      const scriptToRemove = document.getElementById(id)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [data, id])

  return null
}

