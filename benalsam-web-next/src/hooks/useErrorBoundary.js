import { useCallback } from 'react';
import { logger } from '@/utils/production-logger';

/**
 * Error boundary'leri kolayca kullanmak için custom hook
 */
export const useErrorBoundary = () => {
  const handleError = useCallback((error, errorInfo, context = '') => {
    logger.error(`[useErrorBoundary] Error in ${context}`, { error, errorInfo });
    
    // Hata loglama servisi buraya eklenebilir
    // logErrorToService(error, errorInfo, context);
    
    // Kullanıcıya bildirim gösterilebilir
    // showNotification('error', 'Bir hata oluştu');
  }, []);

  const createErrorBoundary = useCallback((fallback, onError) => {
    return {
      fallback,
      onError: onError || handleError
    };
  }, [handleError]);

  return {
    handleError,
    createErrorBoundary
  };
};

/**
 * Async fonksiyonlar için error handling hook'u
 */
export const useAsyncError = () => {
  const handleAsyncError = useCallback(async (asyncFn, context = '') => {
    try {
      return await asyncFn();
    } catch (error) {
      logger.error(`[useAsyncError] Async error in ${context}`, { error });
      
      // Hata loglama servisi buraya eklenebilir
      // logAsyncErrorToService(error, context);
      
      throw error; // Hatayı yeniden fırlat
    }
  }, []);

  return { handleAsyncError };
};

/**
 * Event handler'lar için error handling hook'u
 */
export const useEventHandlerError = () => {
  const handleEventError = useCallback((eventHandler, context = '') => {
    return (...args) => {
      try {
        return eventHandler(...args);
      } catch (error) {
        logger.error(`[useEventHandlerError] Event handler error in ${context}`, { error });
        
        // Hata loglama servisi buraya eklenebilir
        // logEventErrorToService(error, context);
        
        // Kullanıcıya bildirim gösterilebilir
        // showNotification('error', 'İşlem sırasında bir hata oluştu');
      }
    };
  }, []);

  return { handleEventError };
}; 