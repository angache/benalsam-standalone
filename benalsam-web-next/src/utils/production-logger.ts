/**
 * Production-Safe Logger Utility
 * 
 * Features:
 * - Environment-aware (only logs in development)
 * - Type-safe with TypeScript
 * - Context support for debugging
 * - Performance tracking
 * - Zero overhead in production (tree-shakeable)
 * - Works in both client and server environments
 * 
 * Usage:
 * import { logger } from '@/utils/production-logger'
 * 
 * logger.debug('User logged in', { userId: '123' })
 * logger.info('API call successful')
 * logger.warn('Rate limit approaching')
 * logger.error('Failed to fetch data', { error })
 */

// Check environment - works in both client and server
const getIsDevelopment = (): boolean => {
  if (typeof window !== 'undefined') {
    // Client-side: check NEXT_PUBLIC_APP_ENV or NODE_ENV
    return (
      process.env.NEXT_PUBLIC_APP_ENV === 'development' ||
      process.env.NODE_ENV === 'development'
    )
  }
  // Server-side: check NODE_ENV
  return process.env.NODE_ENV === 'development'
}

const getIsTest = (): boolean => {
  if (typeof window !== 'undefined') {
    return process.env.NODE_ENV === 'test'
  }
  return process.env.NODE_ENV === 'test'
}

const isDevelopment = getIsDevelopment()
const isTest = getIsTest()

// Disable all logging in production and test environments
const isLoggingEnabled = isDevelopment && !isTest

interface LogContext {
  [key: string]: unknown
}

class ProductionLogger {
  /**
   * Debug-level logging (verbose, for development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!isLoggingEnabled) return
    console.log(`🐛 [DEBUG] ${message}`, context || '')
  }

  /**
   * Info-level logging (general information)
   */
  info(message: string, context?: LogContext): void {
    if (!isLoggingEnabled) return
    console.log(`ℹ️  [INFO] ${message}`, context || '')
  }

  /**
   * Warning-level logging (potential issues)
   */
  warn(message: string, context?: LogContext): void {
    if (!isLoggingEnabled) return
    console.warn(`⚠️  [WARN] ${message}`, context || '')
  }

  /**
   * Error-level logging (errors that need attention)
   * Note: Errors are logged even in production for monitoring
   */
  error(message: string, context?: LogContext): void {
    // Always log errors, even in production
    if (context && Object.keys(context).length > 0) {
      // Serialize error objects properly
      const serializedContext = this.serializeContext(context)
      
      // Check if serialized context is empty or invalid
      if (serializedContext && typeof serializedContext === 'object' && Object.keys(serializedContext).length > 0) {
        console.error(`❌ [ERROR] ${message}`, serializedContext)
      } else {
        // Fallback: log original context directly
        console.error(`❌ [ERROR] ${message}`, context)
      }
    } else {
      console.error(`❌ [ERROR] ${message}`)
    }
  }

  /**
   * Serialize context object for logging
   * Handles Error objects, circular references, etc.
   */
  private serializeContext(context: LogContext): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(context)) {
      try {
        if (value instanceof Error) {
          result[key] = {
            name: value.name,
            message: value.message,
            stack: value.stack,
          }
        } else if (value === null) {
          result[key] = null
        } else if (value === undefined) {
          result[key] = '[undefined]'
        } else if (typeof value === 'function') {
          result[key] = '[Function]'
        } else if (typeof value === 'object') {
          // Try to serialize object, but catch circular references
          try {
            JSON.stringify(value)
            result[key] = value
          } catch {
            result[key] = '[Circular or non-serializable object]'
          }
        } else {
          result[key] = value
        }
      } catch (err) {
        result[key] = `[Serialization error: ${err instanceof Error ? err.message : String(err)}]`
      }
    }
    
    return result
  }

  /**
   * Performance tracking - start
   */
  startTimer(label: string): void {
    if (!isLoggingEnabled) return
    // Only use console.time in development to reduce TBT
    if (process.env.NODE_ENV === 'development') {
    console.time(`⏱️  ${label}`)
    }
  }

  /**
   * Performance tracking - end
   */
  endTimer(label: string): void {
    if (!isLoggingEnabled) return
    // Only use console.timeEnd in development to reduce TBT
    if (process.env.NODE_ENV === 'development') {
    console.timeEnd(`⏱️  ${label}`)
    }
  }

  /**
   * Log a value for inspection
   */
  inspect(label: string, value: unknown): void {
    if (!isLoggingEnabled) return
    console.log(`🔍 [${label}]`, value)
  }

  /**
   * Group related logs
   */
  group(label: string): void {
    if (!isLoggingEnabled) return
    console.group(`📁 ${label}`)
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (!isLoggingEnabled) return
    console.groupEnd()
  }

  /**
   * Log a table (useful for arrays of objects)
   */
  table(data: unknown): void {
    if (!isLoggingEnabled) return
    console.table(data)
  }
}

// Export singleton instance
export const logger = new ProductionLogger()

// Re-export for convenience
export default logger

