import React from 'react';
import ComponentErrorBoundary from './ComponentErrorBoundary';

/**
 * Bileşenleri error boundary ile saran Higher Order Component
 * @param {React.Component} Component - Sarmalanacak bileşen
 * @param {string} componentName - Bileşen adı (opsiyonel)
 * @param {React.Component} fallback - Özel fallback bileşeni (opsiyonel)
 * @returns {React.Component} Error boundary ile sarılmış bileşen
 */
export const withErrorBoundary = (Component, componentName = 'Bileşen', fallback = null) => {
  const WrappedComponent = (props) => {
    return (
      <ComponentErrorBoundary 
        componentName={componentName}
        fallback={fallback}
      >
        <Component {...props} />
      </ComponentErrorBoundary>
    );
  };

  // Display name'i ayarla
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

/**
 * Sayfa bileşenlerini error boundary ile saran HOC
 * @param {React.Component} PageComponent - Sarmalanacak sayfa bileşeni
 * @param {string} pageName - Sayfa adı
 * @returns {React.Component} Error boundary ile sarılmış sayfa bileşeni
 */
export const withPageErrorBoundary = (PageComponent, pageName = 'Sayfa') => {
  const WrappedPage = (props) => {
    return (
      <div className="min-h-[400px]">
        <ComponentErrorBoundary componentName={pageName}>
          <PageComponent {...props} />
        </ComponentErrorBoundary>
      </div>
    );
  };

  WrappedPage.displayName = `withPageErrorBoundary(${PageComponent.displayName || PageComponent.name || 'Page'})`;

  return WrappedPage;
};

/**
 * Form bileşenlerini error boundary ile saran HOC
 * @param {React.Component} FormComponent - Sarmalanacak form bileşeni
 * @param {string} formName - Form adı
 * @returns {React.Component} Error boundary ile sarılmış form bileşeni
 */
export const withFormErrorBoundary = (FormComponent, formName = 'Form') => {
  const WrappedForm = (props) => {
    return (
      <ComponentErrorBoundary 
        componentName={formName}
        fallback={({ error, onRetry }) => (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Form Hatası
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Form yüklenirken bir hata oluştu.
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      >
        <FormComponent {...props} />
      </ComponentErrorBoundary>
    );
  };

  WrappedForm.displayName = `withFormErrorBoundary(${FormComponent.displayName || FormComponent.name || 'Form'})`;

  return WrappedForm;
};

/**
 * Liste bileşenlerini error boundary ile saran HOC
 * @param {React.Component} ListComponent - Sarmalanacak liste bileşeni
 * @param {string} listName - Liste adı
 * @returns {React.Component} Error boundary ile sarılmış liste bileşeni
 */
export const withListErrorBoundary = (ListComponent, listName = 'Liste') => {
  const WrappedList = (props) => {
    return (
      <ComponentErrorBoundary 
        componentName={listName}
        fallback={({ error, onRetry }) => (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-sm font-medium text-orange-800 mb-2">
              Liste Hatası
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              Liste yüklenirken bir hata oluştu.
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      >
        <ListComponent {...props} />
      </ComponentErrorBoundary>
    );
  };

  WrappedList.displayName = `withListErrorBoundary(${ListComponent.displayName || ListComponent.name || 'List'})`;

  return WrappedList;
}; 