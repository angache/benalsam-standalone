/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js when the server starts.
 * Use it to initialize monitoring, error tracking, and other instrumentation.
 * 
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (typeof window === 'undefined') {
    // Initialize Sentry on server-side
    const { initSentry } = await import('@/lib/sentry')
    initSentry()
  }
}

