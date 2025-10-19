import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

const PageErrorFallback = ({ error, errorInfo, retryCount, onRetry, onReset }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Sayfa Yüklenemedi
        </h2>
        
        <p className="text-gray-600 text-center mb-4 text-sm">
          Bu sayfayı yüklerken bir hata oluştu. Lütfen tekrar deneyin.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Tekrar Dene
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            Geri Dön
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 bg-gray-100 rounded-md">
            <summary className="cursor-pointer text-xs font-medium text-gray-700 mb-2">
              Hata Detayları
            </summary>
            <pre className="text-xs text-gray-600 overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

const PageErrorBoundary = ({ children, pageName = 'Sayfa' }) => {
  return (
    <ErrorBoundary 
      fallback={PageErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`Page Error in ${pageName}:`, error, errorInfo);
        // Burada sayfa seviyesi hata loglama yapılabilir
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default PageErrorBoundary; 