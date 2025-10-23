/**
 * Production-safe logger
 * Suppresses console logs in production unless critical
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  
  // Critical errors that should always be logged
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args)
  }
}

// Export as default for easier importing
export default logger

