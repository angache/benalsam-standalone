import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bir Hata Oluştu</h1>
                <p className="text-sm text-gray-600">Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.</p>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-800">
                {this.state.error?.message || 'Bilinmeyen hata'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Ana Sayfa
              </button>
            </div>

            {/* Error Details Toggle */}
            <button
              onClick={this.toggleDetails}
              className="text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              {this.state.showDetails ? 'Detayları Gizle' : 'Hata Detaylarını Göster'}
            </button>

            {/* Collapsible Error Details */}
            {this.state.showDetails && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2">🔍 Teknik Detaylar</h3>
                
                {this.state.error && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Hata Mesajı:</p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                {this.state.error?.stack && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Stack Trace:</p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}

                {this.state.errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Component Stack:</p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Helpful Information */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                💡 <strong>Yardım:</strong> Bu hata devam ederse, lütfen teknik destek ile iletişime geçin. 
                Hata detayları otomatik olarak kaydedildi.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 