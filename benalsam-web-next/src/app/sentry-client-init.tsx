/**
 * Client-side Sentry initialization
 * 
 * This component initializes Sentry on the client-side.
 * It should be imported and used in the root layout or a client component.
 */

'use client'

import { useEffect } from 'react'
import { initSentry } from '@/lib/sentry'

export function SentryClientInit() {
  useEffect(() => {
    // Initialize Sentry on client-side
    initSentry()
  }, [])

  return null // This component doesn't render anything
}

