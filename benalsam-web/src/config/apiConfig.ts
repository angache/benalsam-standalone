/**
 * Environment Detection for Client-Side
 * Determines if we're in development with proxy or production
 */

export const isDevelopmentWithProxy = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // In development with Vite, we use proxy to forward API calls
  // The API calls should go to /api which Vite proxies to the actual backend
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.startsWith('192.168.') ||
                     window.location.hostname.startsWith('10.');
  
  // Check if we're in development mode (should use proxy)
  const isDevMode = import.meta.env.DEV;
  
  return isLocalhost && isDevMode;
};

export const getApiClientBaseUrl = (): string => {
  if (isDevelopmentWithProxy()) {
    // In development, use the proxy path that Vite will forward
    return '/api';
  } else {
    // In production or when not using proxy, use the actual API URL
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (envBaseUrl) {
      return envBaseUrl.endsWith('/api/v1') ? envBaseUrl : envBaseUrl + '/api/v1';
    }
    // Fallback
    return 'http://209.227.228.96:3002/api/v1';
  }
};

export default {
  isDevelopmentWithProxy,
  getApiClientBaseUrl
};