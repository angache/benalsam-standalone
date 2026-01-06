/**
 * Global Error Handler
 * Centralized error handling for admin operations
 * 
 * @deprecated Use UnifiedErrorHandler from @/utils/errorHandler instead
 */

import { toast } from '@/components/ui/use-toast';
import { logger } from '@/utils/production-logger';
import { ApiError } from './apiClient';
import { errorHandler, ErrorContext } from '@/utils/errorHandler';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectOnAuthError?: boolean;
  logToConsole?: boolean;
}

/**
 * Global error handler for admin operations
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private options: ErrorHandlerOptions = {
    showToast: true,
    redirectOnAuthError: true,
    logToConsole: true,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Configure error handler options
   */
  configure(options: Partial<ErrorHandlerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Handle API errors
   * @deprecated Use errorHandler.handleApiError instead
   */
  handleApiError(error: ApiError | unknown, context?: string): void {
    // Direct implementation to avoid circular dependency
    const message = this.formatErrorMessage(error, context);
    
    if (this.options.showToast) {
      toast({
        title: "API Hatası",
        description: message,
        variant: "destructive",
      });
    }

    if (this.options.logToConsole) {
      logger.error('[ErrorHandler] API Error', { context, error });
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: ApiError): void {
    const message = error.message || 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
    
    if (this.options.showToast) {
      toast({
        title: "Oturum Hatası",
        description: message,
        variant: "destructive",
      });
    }

    if (this.options.redirectOnAuthError) {
      // Redirect to admin login after a short delay
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    }
  }

  /**
   * Handle permission errors
   */
  private handlePermissionError(error: ApiError): void {
    const message = error.message || 'Bu işlem için yetkiniz bulunmuyor.';
    
    if (this.options.showToast) {
      toast({
        title: "Yetki Hatası",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle not found errors
   */
  private handleNotFoundError(error: ApiError): void {
    const message = error.message || 'İstenen kaynak bulunamadı.';
    
    if (this.options.showToast) {
      toast({
        title: "Bulunamadı",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: ApiError): void {
    const message = error.message || 'Girilen bilgiler geçersiz. Lütfen kontrol edin.';
    
    if (this.options.showToast) {
      toast({
        title: "Doğrulama Hatası",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle rate limit errors
   */
  private handleRateLimitError(error: ApiError): void {
    const message = error.message || 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.';
    
    if (this.options.showToast) {
      toast({
        title: "Hız Sınırı",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle server errors
   */
  private handleServerError(error: ApiError): void {
    const message = error.message || 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
    
    if (this.options.showToast) {
      toast({
        title: "Sunucu Hatası",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: ApiError, message: string): void {
    if (this.options.showToast) {
      toast({
        title: "Hata",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Format error message
   */
  private formatErrorMessage(error: unknown, context?: string): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    return context 
      ? `${context} sırasında bir hata oluştu.`
      : 'Beklenmedik bir hata oluştu.';
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: unknown, context?: string): void {
    const message = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
    
    if (this.options.logToConsole) {
      logger.error('[ErrorHandler] Network Error', { context, error });
    }

    if (this.options.showToast) {
      toast({
        title: "Bağlantı Hatası",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle timeout errors
   */
  handleTimeoutError(context?: string): void {
    const message = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
    
    if (this.options.logToConsole) {
      logger.error('[ErrorHandler] Timeout Error', { context });
    }

    if (this.options.showToast) {
      toast({
        title: "Zaman Aşımı",
        description: message,
        variant: "destructive",
      });
    }
  }

  /**
   * Handle validation errors with field details
   */
  handleValidationErrors(errors: Record<string, string[]>): void {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    if (this.options.showToast) {
      toast({
        title: "Doğrulama Hataları",
        description: errorMessages,
        variant: "destructive",
      });
    }
  }

  /**
   * Show success message
   */
  showSuccess(message: string, title?: string): void {
    if (this.options.showToast) {
      toast({
        title: title || "Başarılı",
        description: message,
      });
    }
  }

  /**
   * Show info message
   */
  showInfo(message: string, title?: string): void {
    if (this.options.showToast) {
      toast({
        title: title || "Bilgi",
        description: message,
      });
    }
  }

  /**
   * Show warning message
   */
  showWarning(message: string, title?: string): void {
    if (this.options.showToast) {
      toast({
        title: title || "Uyarı",
        description: message,
        variant: "destructive",
      });
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance(); 