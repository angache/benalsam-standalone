import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

const AppErrorFallback = ({ error, errorInfo, retryCount, onRetry, onReset }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Uygulama Hatası
        </h1>
        
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          Benalsam uygulamasında beklenmeyen bir hata oluştu. 
          Teknik ekibimiz bu durumdan haberdar edildi.
        </p>

        {retryCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800 text-center">
              Deneme sayısı: {retryCount}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tekrar Dene
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Ana Sayfaya Dön
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Sayfayı Yenile
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 p-4 bg-gray-100 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-3">
              Hata Detayları (Geliştirici Modu)
            </summary>
            <div className="space-y-2">
              <div>
                <strong className="text-xs text-gray-600">Hata:</strong>
                <pre className="text-xs text-gray-800 bg-white p-2 rounded border overflow-auto">
                  {error.toString()}
                </pre>
              </div>
              {errorInfo && (
                <div>
                  <strong className="text-xs text-gray-600">Component Stack:</strong>
                  <pre className="text-xs text-gray-800 bg-white p-2 rounded border overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

const AppErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary; 