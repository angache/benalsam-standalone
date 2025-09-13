import logger from '../config/logger';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add random jitter to prevent thundering herd
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

export interface RetryableError extends Error {
  retryable: boolean;
  retryAfter?: number; // milliseconds
}

class RetryService {
  private static instance: RetryService;
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true
  };

  private constructor() {}

  public static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  /**
   * Execute function with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: { traceId?: string; operation?: string }
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        logger.info('🔄 Retry attempt', {
          ...context,
          attempt: attempt + 1,
          maxRetries: finalConfig.maxRetries
        });

        const result = await operation();
        
        logger.info('✅ Retry successful', {
          ...context,
          attempt: attempt + 1,
          totalAttempts: attempt + 1,
          totalDelay,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalDelay
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          logger.error('❌ Non-retryable error', {
            ...context,
            error: lastError.message,
            attempt: attempt + 1
          });
          
          return {
            success: false,
            error: lastError,
            attempts: attempt + 1,
            totalDelay
          };
        }

        // Check if we've reached max retries
        if (attempt >= finalConfig.maxRetries) {
          logger.error('❌ Max retries exceeded', {
            ...context,
            error: lastError.message,
            attempts: attempt + 1,
            totalDelay
          });
          
          return {
            success: false,
            error: lastError,
            attempts: attempt + 1,
            totalDelay
          };
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, finalConfig);
        totalDelay += delay;

        logger.warn('⚠️ Retry attempt failed, waiting before retry', {
          ...context,
          error: lastError.message,
          attempt: attempt + 1,
          nextDelay: delay,
          totalDelay
        });

        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxRetries + 1,
      totalDelay
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Check if error explicitly says it's not retryable
    if ('retryable' in error && !(error as RetryableError).retryable) {
      return false;
    }

    // Network errors are usually retryable
    if (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNRESET')) {
      return true;
    }

    // Elasticsearch errors
    if (error.message.includes('NoLivingConnectionsError') ||
        error.message.includes('ConnectionError') ||
        error.message.includes('RequestTimeoutError')) {
      return true;
    }

    // RabbitMQ errors
    if (error.message.includes('Connection closed') ||
        error.message.includes('Channel closed') ||
        error.message.includes('Connection timeout')) {
      return true;
    }

    // Database errors
    if (error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')) {
      return true;
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable error
   */
  public createRetryableError(message: string, retryAfter?: number): RetryableError {
    const error = new Error(message) as RetryableError;
    error.retryable = true;
    if (retryAfter) {
      error.retryAfter = retryAfter;
    }
    return error;
  }

  /**
   * Create a non-retryable error
   */
  public createNonRetryableError(message: string): RetryableError {
    const error = new Error(message) as RetryableError;
    error.retryable = false;
    return error;
  }

  /**
   * Get retry statistics
   */
  public getRetryStats(): {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageAttempts: number;
  } {
    // This would be implemented with actual statistics tracking
    // For now, return placeholder data
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0
    };
  }
}

export const retryService = RetryService.getInstance();
export default retryService;
