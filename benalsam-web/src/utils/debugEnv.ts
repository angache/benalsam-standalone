/**
 * Debug Environment Detection
 * Helper function to debug environment configuration
 */

export const debugEnvironment = () => {
  if (typeof window === 'undefined') return;
  
  console.group('🔍 Environment Debug Info');
  
  console.log('Location hostname:', window.location.hostname);
  console.log('Location origin:', window.location.origin);
  console.log('Is DEV mode:', import.meta.env.DEV);
  console.log('Is PROD mode:', import.meta.env.PROD);
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('Full VITE env:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_API_STAGING_URL: import.meta.env.VITE_API_STAGING_URL,
    VITE_API_PROD_URL: import.meta.env.VITE_API_PROD_URL,
    VITE_LISTING_SERVICE_URL: import.meta.env.VITE_LISTING_SERVICE_URL,
    VITE_UPLOAD_SERVICE_URL: import.meta.env.VITE_UPLOAD_SERVICE_URL,
  });
  
  console.groupEnd();
};

// Auto-run in development
if (import.meta.env.DEV) {
  setTimeout(debugEnvironment, 1000);
}