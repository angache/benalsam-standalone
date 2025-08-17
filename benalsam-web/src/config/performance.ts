// Performance Tracking Configuration
export const PERFORMANCE_CONFIG = {
  // Enable performance tracking in development
  ENABLE_IN_DEV: true,
  
  // Enable for admin users in production
  ENABLE_FOR_ADMIN: true,
  
  // Sampling rate for normal users (0.01 = 1%)
  SAMPLING_RATE: 0.01,
  
  // Critical pages that should always be tracked
  CRITICAL_PAGES: [
    '/checkout',
    '/payment',
    '/login',
    '/register',
    '/ilan/create'
  ],
  
  // Performance thresholds
  THRESHOLDS: {
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    TTFB: { good: 800, poor: 1800 }
  }
};

// Check if performance tracking should be enabled
export const shouldEnablePerformanceTracking = (user?: any): boolean => {
  const isDevelopment = import.meta.env.DEV;
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const isProduction = import.meta.env.PROD;
  
  // Always enable in development
  if (isDevelopment && PERFORMANCE_CONFIG.ENABLE_IN_DEV) {
    return true;
  }
  
  // Enable for admin users in production
  if (isProduction && isAdmin && PERFORMANCE_CONFIG.ENABLE_FOR_ADMIN) {
    return true;
  }
  
  // Sampling for normal users (future use)
  if (isProduction && !isAdmin) {
    return Math.random() < PERFORMANCE_CONFIG.SAMPLING_RATE;
  }
  
  return false;
};

// Check if current page is critical
export const isCriticalPage = (pathname: string): boolean => {
  return PERFORMANCE_CONFIG.CRITICAL_PAGES.some(page => 
    pathname.startsWith(page)
  );
};
