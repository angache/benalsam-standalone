/**
 * Production-safe logger
 * Suppresses console logs in production unless critical
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  
  // Critical errors that should always be logged
  critical: (...args: unknown[]) => {
    console.error('[CRITICAL]', ...args)
  }
}

// Export as default for easier importing
export default logger

