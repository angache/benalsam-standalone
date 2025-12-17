// Unified Error Handling System
import { toast } from '@/components/ui/use-toast';
import { 
  ValidationError, 
  UploadError, 
  ServiceError, 
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  QuotaExceededError,
  ErrorCode,
  ErrorSeverity
} from '@/types/errors';

// Error context for better debugging
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

// Error handling result
export interface ErrorHandlingResult {
  handled: boolean;
  userMessage: string;
  shouldRetry: boolean;
  retryAfter?: number;
  logLevel: 'error' | 'warn' | 'info';
}

// Global error handler class
export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;
  private errorHistory: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private maxHistorySize = 100;

  private constructor() {}

  public static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  /**
   * Main error handling method
   */
  public handleError(
    error: unknown, 
    context: ErrorContext = {},
    options: {
      showToast?: boolean;
      logToConsole?: boolean;
      reportToService?: boolean;
    } = {}
  ): ErrorHandlingResult {
    const {
      showToast = true,
      logToConsole = true,
      reportToService = true
    } = options;

    // Add timestamp if not provided
    if (!context.timestamp) {
      context.timestamp = new Date();
    }

    // Store error in history
    this.addToHistory(error, context);

    // Determine error type and create appropriate error instance
    const typedError = this.categorizeError(error);
    
    // Get user-friendly message
    const userMessage = this.getUserFriendlyMessage(typedError);
    
    // Determine if should retry
    const shouldRetry = this.shouldRetry(typedError);
    const retryAfter = this.getRetryAfter(typedError);

    // Log error
    if (logToConsole) {
      this.logError(typedError, context);
    }

    // Report to service
    if (reportToService) {
      this.reportToService(typedError, context);
    }

    // Show toast notification
    if (showToast) {
      this.showToast(typedError, userMessage);
    }

    return {
      handled: true,
      userMessage,
      shouldRetry,
      retryAfter,
      logLevel: this.getLogLevel(typedError)
    };
  }

  /**
   * Categorize unknown error into typed error
   */
  private categorizeError(error: unknown): Error {
    if (error instanceof ValidationError || 
        error instanceof UploadError || 
        error instanceof ServiceError ||
        error instanceof NetworkError ||
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError ||
        error instanceof RateLimitError ||
        error instanceof QuotaExceededError) {
      return error;
    }

    if (error instanceof Error) {
      // Try to categorize based on error message or properties
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new ValidationError(error.message, { originalError: error });
      }
      
      if (error.message.includes('upload') || error.message.includes('file')) {
        return new UploadError(error.message, { originalError: error });
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return new NetworkError(error.message, { originalError: error });
      }
      
      if (error.message.includes('auth') || error.message.includes('token')) {
        return new AuthenticationError(error.message, { originalError: error });
      }
      
      if (error.message.includes('permission') || error.message.includes('forbidden')) {
        return new AuthorizationError(error.message, { originalError: error });
      }
      
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        return new RateLimitError(error.message, { originalError: error });
      }
      
      if (error.message.includes('quota') || error.message.includes('limit exceeded')) {
        return new QuotaExceededError(error.message, { originalError: error });
      }
      
      // Default to ServiceError
      return new ServiceError(error.message, { originalError: error });
    }

    // Unknown error type
    return new ServiceError('Bilinmeyen bir hata oluştu', { originalError: error });
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: Error): string {
    if (error instanceof ValidationError) {
      return error.message || 'Girdiğiniz bilgiler geçersiz. Lütfen kontrol edin.';
    }
    
    if (error instanceof UploadError) {
      return error.message || 'Dosya yükleme sırasında bir hata oluştu.';
    }
    
    if (error instanceof NetworkError) {
      return 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.';
    }
    
    if (error instanceof AuthenticationError) {
      return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
    }
    
    if (error instanceof AuthorizationError) {
      return 'Bu işlem için yetkiniz bulunmuyor.';
    }
    
    if (error instanceof RateLimitError) {
      return 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.';
    }
    
    if (error instanceof QuotaExceededError) {
      return 'Günlük limitinizi aştınız. Yarın tekrar deneyin.';
    }
    
    if (error instanceof ServiceError) {
      return error.message || 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    }
    
    return 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: Error): boolean {
    if (error instanceof ValidationError || 
        error instanceof AuthorizationError) {
      return false; // These should not be retried
    }
    
    if (error instanceof NetworkError || 
        error instanceof RateLimitError ||
        error instanceof ServiceError) {
      return true; // These can be retried
    }
    
    return false;
  }

  /**
   * Get retry delay in milliseconds
   */
  private getRetryAfter(error: Error): number | undefined {
    if (error instanceof RateLimitError) {
      return 60000; // 1 minute
    }
    
    if (error instanceof NetworkError) {
      return 5000; // 5 seconds
    }
    
    if (error instanceof ServiceError) {
      return 10000; // 10 seconds
    }
    
    return undefined;
  }

  /**
   * Get appropriate log level
   */
  private getLogLevel(error: Error): 'error' | 'warn' | 'info' {
    if (error instanceof ValidationError) {
      return 'warn';
    }
    
    if (error instanceof UploadError || 
        error instanceof NetworkError ||
        error instanceof RateLimitError) {
      return 'warn';
    }
    
    return 'error';
  }

  /**
   * Log error with context
   */
  private logError(error: Error, context: ErrorContext): void {
    // Safely extract error properties
    const errorName = error?.name || 'UnknownError';
    const errorMessage = error?.message || String(error) || 'Unknown error occurred';
    const errorStack = error?.stack || 'No stack trace available';
    
    // If error has additional properties (like Supabase errors), include them
    const errorDetails: Record<string, unknown> = {
      name: errorName,
      message: errorMessage,
      stack: errorStack
    };
    
    // Add any additional error properties
    if (error && typeof error === 'object') {
      Object.keys(error).forEach(key => {
        if (!['name', 'message', 'stack'].includes(key)) {
          try {
            errorDetails[key] = (error as Record<string, unknown>)[key];
          } catch {
            // Skip if can't serialize
          }
        }
      });
    }
    
    const logData = {
      error: errorDetails,
      context,
      timestamp: new Date().toISOString()
    };

    if (this.getLogLevel(error) === 'error') {
      console.error('🚨 Error:', logData);
    } else {
      console.warn('⚠️ Warning:', logData);
    }
  }

  /**
   * Report error to external service
   */
  private reportToService(error: Error, context: ErrorContext): void {
    // TODO: Implement Sentry or other error reporting service
    // For now, just log to console
    console.log('📊 Error reported to service:', {
      error: error.name,
      message: error.message,
      context: context.component,
      severity: this.getLogLevel(error)
    });
  }

  /**
   * Show toast notification
   */
  private showToast(error: Error, message: string): void {
    const isError = this.getLogLevel(error) === 'error';
    
    toast({
      title: isError ? 'Hata' : 'Uyarı',
      description: message,
      variant: isError ? 'destructive' : 'default'
    });
  }

  /**
   * Add error to history
   */
  private addToHistory(error: Error, context: ErrorContext): void {
    this.errorHistory.push({
      error,
      context,
      timestamp: new Date()
    });

    // Keep only recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get error history for debugging
   */
  public getErrorHistory(): Array<{ error: Error; context: ErrorContext; timestamp: Date }> {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }
}

// Export singleton instance
export const errorHandler = UnifiedErrorHandler.getInstance();

// Convenience functions for common use cases
export const handleError = (
  error: unknown, 
  context: ErrorContext = {},
  options?: Parameters<UnifiedErrorHandler['handleError']>[2]
) => errorHandler.handleError(error, context, options);

export const handleApiError = (
  error: unknown, 
  context: ErrorContext = {}
) => errorHandler.handleError(error, { ...context, action: 'api_call' });

export const handleValidationError = (
  error: unknown, 
  context: ErrorContext = {}
) => errorHandler.handleError(error, { ...context, action: 'validation' });

export const handleUploadError = (
  error: unknown, 
  context: ErrorContext = {}
) => errorHandler.handleError(error, { ...context, action: 'upload' });

// Legacy compatibility
export const handleListingServiceError = (error: unknown) => {
  return errorHandler.handleError(error, { component: 'listing-service' });
};

export const getUserFriendlyMessage = (error: unknown): string => {
  const result = errorHandler.handleError(error, {}, { showToast: false, logToConsole: false });
  return result.userMessage;
};