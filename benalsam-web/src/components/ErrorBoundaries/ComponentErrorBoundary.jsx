import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

const ComponentErrorFallback = ({ error, errorInfo, retryCount, onRetry, onReset }) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Bileşen Hatası
          </h3>
          
          <p className="text-sm text-red-700 mb-3">
            Bu bileşen yüklenirken bir hata oluştu.
          </p>

          <div className="flex space-x-2">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              Tekrar Dene
            </button>
            
            <button
              onClick={onReset}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Sıfırla
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-red-600 font-medium">
                Hata Detayları
              </summary>
              <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

const ComponentErrorBoundary = ({ children, componentName = 'Bileşen' }) => {
  return (
    <ErrorBoundary 
      fallback={ComponentErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`Component Error in ${componentName}:`, error, errorInfo);
        // Burada bileşen seviyesi hata loglama yapılabilir
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ComponentErrorBoundary; 