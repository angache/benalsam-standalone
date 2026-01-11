/**
 * Sentry Error Tracking Integration
 * 
 * This module provides error tracking and monitoring capabilities using Sentry.
 * It should be initialized early in the application lifecycle.
 * 
 * Installation:
 * npm install @sentry/nextjs
 * 
 * This wrapper works with or without Sentry SDK installed (graceful degradation).
 */

// Conditional Sentry import - only load if SDK is installed
let Sentry: typeof import('@sentry/nextjs') | null = null
let sentryLoaded = false

// Lazy load Sentry SDK
const loadSentry = async (): Promise<typeof import('@sentry/nextjs') | null> => {
  if (Sentry) return Sentry
  if (sentryLoaded) return null // Already tried and failed
  
  try {
    // Try to load Sentry SDK
    Sentry = await import('@sentry/nextjs')
    return Sentry
  } catch (error) {
    // SDK not installed - this is OK, we'll just log to console
    sentryLoaded = true
    return null
  }
}

// Initialize Sentry only in production or when explicitly enabled
export const initSentry = async () => {
  // Only initialize if DSN is provided and not in development (unless explicitly enabled)
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const environment = process.env.NODE_ENV || 'development'
  const enableInDev = process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === 'true'

  if (!dsn) {
    if (environment === 'production') {
      console.warn('[Sentry] DSN not provided, error tracking disabled')
    }
    return
  }

  if (environment === 'development' && !enableInDev) {
    console.info('[Sentry] Disabled in development mode. Set NEXT_PUBLIC_SENTRY_ENABLE_DEV=true to enable.')
    return
  }

  // Load Sentry SDK
  const SentrySDK = await loadSentry()
  if (!SentrySDK) {
    console.warn('[Sentry] SDK not installed. Error tracking will use console logging only.')
    console.warn('[Sentry] To enable full error tracking, install: npm install @sentry/nextjs')
    return
  }

  try {
    SentrySDK.init({
      dsn,
      environment,
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Session replay (optional, can be expensive)
      replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
      
      // Filter out known non-critical errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        'conduitPage',
        // Network errors that are expected
        'NetworkError',
        'Network request failed',
        // ResizeObserver errors (common, non-critical)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],
      
      // Filter out known non-critical URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        // Facebook plugins
        /connect\.facebook\.net/i,
        // Other third-party scripts
        /doubleclick\.net/i,
      ],
      
      // Before sending event
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (environment === 'development' && !enableInDev) {
          return null
        }
        
        // Filter out non-critical errors
        const error = hint.originalException
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message)
          
          // Ignore known non-critical errors
          if (
            message.includes('ResizeObserver') ||
            message.includes('Non-Error promise rejection') ||
            message.includes('ChunkLoadError') // Common in development
          ) {
            return null
          }
        }
        
        return event
      },
      
      // Integrations
      integrations: [
        SentrySDK.replayIntegration({
          maskAllText: true, // Privacy: mask all text
          blockAllMedia: true, // Privacy: block all media
        }),
      ],
    })

    console.info('[Sentry] Error tracking initialized', { environment, dsn: dsn.substring(0, 20) + '...' })
  } catch (error) {
    console.error('[Sentry] Failed to initialize', error)
  }
}

/**
 * Capture an exception manually
 */
export const captureException = async (error: Error, context?: Record<string, any>) => {
  const SentrySDK = await loadSentry()
  if (!SentrySDK) {
    // Fallback to console logging if Sentry not available
    console.error('[Error]', error, context)
    return
  }

  if (context) {
    SentrySDK.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
      SentrySDK.captureException(error)
    })
  } else {
    SentrySDK.captureException(error)
  }
}

/**
 * Capture a message manually
 */
export const captureMessage = async (message: string, level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info', context?: Record<string, any>) => {
  const SentrySDK = await loadSentry()
  if (!SentrySDK) {
    // Fallback to console logging if Sentry not available
    const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info
    logMethod('[Message]', message, context)
    return
  }

  if (context) {
    SentrySDK.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
      SentrySDK.captureMessage(message, level)
    })
  } else {
    SentrySDK.captureMessage(message, level)
  }
}

/**
 * Set user context for error tracking
 */
export const setUser = async (user: { id: string; email?: string; username?: string; [key: string]: any }) => {
  const SentrySDK = await loadSentry()
  if (!SentrySDK) return
  SentrySDK.setUser(user)
}

/**
 * Clear user context
 */
export const clearUser = async () => {
  const SentrySDK = await loadSentry()
  if (!SentrySDK) return
  SentrySDK.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = async (breadcrumb: { message?: string; category?: string; level?: 'info' | 'warning' | 'error' | 'debug'; [key: string]: any }) => {
  const SentrySDK = await loadSentry()
  if (!SentrySDK) return
  SentrySDK.addBreadcrumb(breadcrumb)
}

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = async (name: string, op: string) => {
  const SentrySDK = await loadSentry()
  if (!SentrySDK) return null
  return SentrySDK.startTransaction({ name, op })
}
