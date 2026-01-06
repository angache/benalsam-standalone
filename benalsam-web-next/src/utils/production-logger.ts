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
    console.error(`❌ [ERROR] ${message}`, context || '')
  }

  /**
   * Performance tracking - start
   */
  startTimer(label: string): void {
    if (!isLoggingEnabled) return
    console.time(`⏱️  ${label}`)
  }

  /**
   * Performance tracking - end
   */
  endTimer(label: string): void {
    if (!isLoggingEnabled) return
    console.timeEnd(`⏱️  ${label}`)
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

