import React from 'react';
import { withErrorBoundary } from '../components/withErrorBoundary';
import { 
  SimpleErrorFallback, 
  NetworkErrorFallback,
  ServerErrorFallback,
  AuthErrorFallback 
} from '../components/ErrorFallbacks';

// React Native ErrorUtils type declaration
declare const ErrorUtils: {
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
};

// Error types for different scenarios
export enum ErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  AUTH = 'AUTH',
  GENERIC = 'GENERIC'
}

// Error boundary configurations for different screen types
export const ErrorBoundaryConfigs = {
  // For critical screens (authentication, main app flow)
  critical: {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      console.error('🚨 Critical Error:', error);
      console.error('📍 Error Details:', errorInfo);
      // In production: send to crash reporting service
      // Crashlytics.recordError(error);
    },
    enableLogging: true,
    fallback: <SimpleErrorFallback />,
  },

  // For network-dependent screens
  network: {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      console.error('🌐 Network Error:', error);
      // Check if it's a network error
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        console.log('📡 Detected network error, showing network fallback');
      }
    },
    enableLogging: true,
    fallback: <NetworkErrorFallback />,
  },

  // For authentication screens
  auth: {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      console.error('🔐 Auth Error:', error);
      // Handle auth-specific errors
      if (error.message.includes('auth') || error.message.includes('token')) {
        console.log('🚪 Detected auth error, might need to logout user');
      }
    },
    enableLogging: true,
    fallback: <AuthErrorFallback />,
  },

  // For data screens (listings, inventory, etc.)
  data: {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      console.error('📊 Data Error:', error);
      // Handle data loading errors
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('🔍 Data not found error');
      }
    },
    enableLogging: true,
    fallback: <SimpleErrorFallback />,
  },
};

// Helper function to wrap screens with appropriate error boundaries
export const withScreenErrorBoundary = (
  Component: React.ComponentType<any>, 
  configType: keyof typeof ErrorBoundaryConfigs = 'critical'
) => {
  return withErrorBoundary(Component, ErrorBoundaryConfigs[configType]);
};

// Specialized wrappers for common screen types
export const withCriticalErrorBoundary = (Component: React.ComponentType<any>) =>
  withScreenErrorBoundary(Component, 'critical');

export const withNetworkErrorBoundary = (Component: React.ComponentType<any>) =>
  withScreenErrorBoundary(Component, 'network');

export const withAuthErrorBoundary = (Component: React.ComponentType<any>) =>
  withScreenErrorBoundary(Component, 'auth');

export const withDataErrorBoundary = (Component: React.ComponentType<any>) =>
  withScreenErrorBoundary(Component, 'data');

// Error reporting helper
export class ErrorReporter {
  static reportError(error: Error, context?: string, additionalData?: any) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    // Log to console in development
    if (__DEV__) {
      console.group('🚨 Error Report');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Additional Data:', additionalData);
      console.groupEnd();
    }

    // In production, send to your error reporting service
    // Example integrations:
    // Sentry.captureException(error, { extra: errorReport });
    // Crashlytics.recordError(error);
    // Bugsnag.notify(error, (report) => { report.addMetadata('custom', errorReport); });
  }

  static reportNetworkError(url: string, error: Error, response?: any) {
    this.reportError(error, 'Network Request', {
      url,
      response: response ? {
        status: response.status,
        statusText: response.statusText,
      } : null,
    });
  }

  static reportAuthError(action: string, error: Error, userId?: string) {
    this.reportError(error, 'Authentication', {
      action,
      userId,
    });
  }

  static reportDataError(dataType: string, error: Error, queryParams?: any) {
    this.reportError(error, 'Data Operation', {
      dataType,
      queryParams,
    });
  }
}

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  console.log('🛡️ Setting up global error handlers for React Native...');

  // Handle global JavaScript errors (for React Native)
  if (typeof ErrorUtils !== 'undefined') {
    try {
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('🚨 Global JS Error:', error);
        ErrorReporter.reportError(error, 'Global JS Error', { isFatal });
        
        // Call the original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
      console.log('✅ Global error handler setup complete');
    } catch (setupError) {
      console.error('❌ Error setting up global error handler:', setupError);
    }
  } else {
    console.log('⚠️ ErrorUtils not available');
  }

  // React Native doesn't have window.addEventListener for unhandled promise rejections
  // But we can still setup promise rejection tracking for development
  if (__DEV__) {
    // Enable promise rejection tracking in development
    require('react-native').LogBox.ignoreAllLogs(false);
    console.log('✅ Development error tracking enabled');
  }
};

export default {
  ErrorBoundaryConfigs,
  withScreenErrorBoundary,
  withCriticalErrorBoundary,
  withNetworkErrorBoundary,
  withAuthErrorBoundary,
  withDataErrorBoundary,
  ErrorReporter,
  setupGlobalErrorHandlers,
}; 