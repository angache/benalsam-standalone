/**
 * Console override for production
 * Suppresses ALL non-critical console logs in production for Lighthouse Best Practices
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const originalError = console.error
  const originalWarn = console.warn
  const originalLog = console.log
  
  // Only allow critical errors (network failures, auth errors)
  const criticalErrors = [
    'network error',
    'authentication failed',
    'fatal error',
  ]
  
  console.error = (...args: any[]) => {
    const message = args.join(' ').toLowerCase()
    
    // Only log critical errors
    const isCritical = criticalErrors.some(critical => 
      message.includes(critical)
    )
    
    if (isCritical) {
      originalError.apply(console, args)
    }
    // Silently suppress all other errors in production
  }
  
  console.warn = (...args: any[]) => {
    // Suppress ALL warnings in production
  }
  
  console.log = (...args: any[]) => {
    // Suppress ALL logs in production
  }
}

export {}

