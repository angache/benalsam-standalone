/**
 * Error Management Service
 * Hata yönetimi ve recovery stratejileri
 */

import { 
  ErrorType, 
  ErrorSeverity, 
  ErrorAction, 
  CustomError, 
  ErrorMetrics, 
  ErrorRecoveryResult 
} from '../types/errors';
import { getErrorConfig, shouldAlert } from '../config/errorConfig';
import logger from '../config/logger';
import { dlqService } from './dlqService';
import { retryService } from './retryService';

export class ErrorService {
  private errorCounts: Map<ErrorType, number> = new Map();
  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {} as Record<ErrorType, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    retryableErrors: 0,
    nonRetryableErrors: 0,
    dlqMessages: 0,
    alertCount: 0
  };

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Initialize error counts map
    Object.values(ErrorType).forEach(type => {
      this.errorCounts.set(type, 0);
    });

    // Initialize errorsByType object
    this.errorMetrics.errorsByType = {} as Record<ErrorType, number>;
    Object.values(ErrorType).forEach(type => {
      this.errorMetrics.errorsByType[type] = 0;
    });

    // Initialize severity counts
    this.errorMetrics.errorsBySeverity = {} as Record<ErrorSeverity, number>;
    Object.values(ErrorSeverity).forEach(severity => {
      this.errorMetrics.errorsBySeverity[severity] = 0;
    });
  }

  /**
   * Create a custom error with proper typing and context
   */
  createError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, any>,
    traceId?: string
  ): CustomError {
    const config = getErrorConfig(type);
    
    const customError = new Error(message) as CustomError;
    customError.type = type;
    customError.severity = config.severity;
    customError.action = config.action;
    customError.retryable = config.retryable;
    customError.traceId = traceId;
    customError.context = context;
    customError.timestamp = new Date();
    customError.retryCount = 0;

    // Preserve original error stack
    if (originalError) {
      customError.stack = originalError.stack;
    }

    return customError;
  }

  /**
   * Handle error with appropriate action
   */
  async handleError(
    error: CustomError,
    message?: any,
    retryCount: number = 0
  ): Promise<ErrorRecoveryResult> {
    const config = getErrorConfig(error.type);
    
    // Update metrics
    this.updateErrorMetrics(error.type, error.severity);
    
    // Log error
    this.logError(error, retryCount);
    
    // Check if alert should be sent
    const shouldSendAlert = shouldAlert(error.type, this.errorCounts.get(error.type) || 0);
    if (shouldSendAlert) {
      await this.sendAlert(error);
    }

    // Execute appropriate action
    switch (config.action) {
      case ErrorAction.RETRY:
        return await this.handleRetry(error, message, retryCount);
      
      case ErrorAction.SKIP:
        return await this.handleSkip(error);
      
      case ErrorAction.DLQ:
        return await this.handleDLQ(error, message);
      
      case ErrorAction.ALERT:
        return await this.handleAlert(error);
      
      case ErrorAction.FAIL:
        return await this.handleFail(error);
      
      case ErrorAction.IGNORE:
        return await this.handleIgnore(error);
      
      default:
        return await this.handleFail(error);
    }
  }

  /**
   * Handle retry action
   */
  private async handleRetry(
    error: CustomError,
    message?: any,
    retryCount: number = 0
  ): Promise<ErrorRecoveryResult> {
    const config = getErrorConfig(error.type);
    const maxRetries = config.maxRetries || 3;
    
    if (retryCount >= maxRetries) {
      logger.error('❌ Max retries exceeded, sending to DLQ', {
        errorType: error.type,
        retryCount,
        maxRetries,
        traceId: error.traceId
      });
      
      return await this.handleDLQ(error, message);
    }

    const retryDelay = config.retryDelay || 1000;
    const nextRetryAt = new Date(Date.now() + retryDelay);
    
    logger.warn('🔄 Scheduling retry', {
      errorType: error.type,
      retryCount: retryCount + 1,
      maxRetries,
      nextRetryAt,
      traceId: error.traceId
    });

    return {
      success: false,
      action: ErrorAction.RETRY,
      retryCount: retryCount + 1,
      nextRetryAt
    };
  }

  /**
   * Handle skip action
   */
  private async handleSkip(error: CustomError): Promise<ErrorRecoveryResult> {
    logger.warn('⏭️ Skipping message due to error', {
      errorType: error.type,
      message: error.message,
      traceId: error.traceId
    });

    return {
      success: true,
      action: ErrorAction.SKIP,
      retryCount: 0
    };
  }

  /**
   * Handle DLQ action
   */
  private async handleDLQ(error: CustomError, message?: any): Promise<ErrorRecoveryResult> {
    try {
      const dlqMessageId = await dlqService.sendToDLQ(
        message,
        'elasticsearch.sync',
        error,
        error.retryCount || 0,
        error.traceId
      );

      this.errorMetrics.dlqMessages++;
      
      logger.error('📮 Message sent to DLQ', {
        errorType: error.type,
        dlqMessageId,
        traceId: error.traceId
      });

      return {
        success: true,
        action: ErrorAction.DLQ,
        retryCount: error.retryCount || 0,
        dlqMessageId: undefined // DLQ service doesn't return message ID
      };
    } catch (dlqError) {
      logger.error('❌ Failed to send message to DLQ', {
        errorType: error.type,
        dlqError: dlqError instanceof Error ? dlqError.message : 'Unknown error',
        traceId: error.traceId
      });

      return {
        success: false,
        action: ErrorAction.FAIL,
        retryCount: error.retryCount || 0
      };
    }
  }

  /**
   * Handle alert action
   */
  private async handleAlert(error: CustomError): Promise<ErrorRecoveryResult> {
    await this.sendAlert(error);
    
    return {
      success: true,
      action: ErrorAction.ALERT,
      retryCount: 0,
      alertSent: true
    };
  }

  /**
   * Handle fail action
   */
  private async handleFail(error: CustomError): Promise<ErrorRecoveryResult> {
    logger.error('💥 Failing message due to error', {
      errorType: error.type,
      message: error.message,
      traceId: error.traceId
    });

    return {
      success: false,
      action: ErrorAction.FAIL,
      retryCount: error.retryCount || 0
    };
  }

  /**
   * Handle ignore action
   */
  private async handleIgnore(error: CustomError): Promise<ErrorRecoveryResult> {
    logger.debug('👁️ Ignoring error', {
      errorType: error.type,
      message: error.message,
      traceId: error.traceId
    });

    return {
      success: true,
      action: ErrorAction.IGNORE,
      retryCount: 0
    };
  }

  /**
   * Send alert for critical errors
   */
  private async sendAlert(error: CustomError): Promise<void> {
    try {
      // TODO: Implement actual alerting (email, Slack, etc.)
      logger.error('🚨 ALERT: Critical error detected', {
        errorType: error.type,
        severity: error.severity,
        message: error.message,
        context: error.context,
        traceId: error.traceId,
        timestamp: error.timestamp
      });

      this.errorMetrics.alertCount++;
    } catch (alertError) {
      logger.error('❌ Failed to send alert', {
        errorType: error.type,
        alertError: alertError instanceof Error ? alertError.message : 'Unknown error',
        traceId: error.traceId
      });
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: CustomError, retryCount: number): void {
    const logData = {
      errorType: error.type,
      severity: error.severity,
      action: error.action,
      retryable: error.retryable,
      retryCount,
      message: error.message,
      context: error.context,
      traceId: error.traceId,
      timestamp: error.timestamp
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('💥 CRITICAL ERROR', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('🔴 HIGH SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('🟡 MEDIUM SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('🔵 LOW SEVERITY ERROR', logData);
        break;
    }
  }

  /**
   * Update error metrics
   */
  private updateErrorMetrics(type: ErrorType, severity: ErrorSeverity): void {
    const currentCount = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, currentCount + 1);
    
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsByType[type] = (this.errorMetrics.errorsByType[type] || 0) + 1;
    this.errorMetrics.errorsBySeverity[severity] = (this.errorMetrics.errorsBySeverity[severity] || 0) + 1;
    
    const config = getErrorConfig(type);
    if (config.retryable) {
      this.errorMetrics.retryableErrors++;
    } else {
      this.errorMetrics.nonRetryableErrors++;
    }
  }

  /**
   * Get current error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Get error count for specific type
   */
  getErrorCount(type: ErrorType): number {
    return this.errorCounts.get(type) || 0;
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.errorCounts.clear();
    this.initializeMetrics();
    this.errorMetrics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      retryableErrors: 0,
      nonRetryableErrors: 0,
      dlqMessages: 0,
      alertCount: 0
    };
  }

  /**
   * Classify error type from original error
   */
  classifyError(originalError: Error): ErrorType {
    const message = originalError.message.toLowerCase();
    const stack = originalError.stack?.toLowerCase() || '';

    // Network errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.CONNECTION_TIMEOUT;
    }
    
    if (message.includes('connection refused') || message.includes('econnrefused')) {
      return ErrorType.CONNECTION_REFUSED;
    }
    
    if (message.includes('network') || message.includes('enotfound')) {
      return ErrorType.NETWORK_ERROR;
    }

    // Elasticsearch errors
    if (message.includes('elasticsearch') || message.includes('es_')) {
      if (message.includes('index_not_found')) {
        return ErrorType.ELASTICSEARCH_INDEX_NOT_FOUND;
      }
      if (message.includes('mapping')) {
        return ErrorType.ELASTICSEARCH_MAPPING_ERROR;
      }
      if (message.includes('query')) {
        return ErrorType.ELASTICSEARCH_QUERY_ERROR;
      }
      if (message.includes('cluster')) {
        return ErrorType.ELASTICSEARCH_CLUSTER_ERROR;
      }
      return ErrorType.ELASTICSEARCH_UNAVAILABLE;
    }

    // RabbitMQ errors
    if (message.includes('rabbitmq') || message.includes('amqp')) {
      if (message.includes('connection')) {
        return ErrorType.RABBITMQ_CONNECTION_LOST;
      }
      if (message.includes('queue')) {
        return ErrorType.RABBITMQ_QUEUE_NOT_FOUND;
      }
      if (message.includes('exchange')) {
        return ErrorType.RABBITMQ_EXCHANGE_NOT_FOUND;
      }
      return ErrorType.RABBITMQ_UNAVAILABLE;
    }

    // Database errors
    if (message.includes('database') || message.includes('postgres') || message.includes('supabase')) {
      if (message.includes('connection')) {
        return ErrorType.DATABASE_CONNECTION_ERROR;
      }
      if (message.includes('query')) {
        return ErrorType.DATABASE_QUERY_ERROR;
      }
      if (message.includes('constraint')) {
        return ErrorType.DATABASE_CONSTRAINT_ERROR;
      }
      return ErrorType.DATABASE_UNAVAILABLE;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      if (message.includes('format')) {
        return ErrorType.INVALID_MESSAGE_FORMAT;
      }
      if (message.includes('missing')) {
        return ErrorType.MISSING_REQUIRED_FIELD;
      }
      if (message.includes('type')) {
        return ErrorType.INVALID_DATA_TYPE;
      }
      return ErrorType.VALIDATION_ERROR;
    }

    // System errors
    if (message.includes('out of memory')) {
      return ErrorType.OUT_OF_MEMORY;
    }
    
    if (message.includes('rate limit')) {
      return ErrorType.RATE_LIMIT_EXCEEDED;
    }

    // Default to internal error
    return ErrorType.INTERNAL_ERROR;
  }
}

// Export singleton instance
export const errorService = new ErrorService();
