import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Performance metrics interface
interface PerformanceMetrics {
  LCP: number | null;
  INP: number | null;
  CLS: number | null;
  FCP: number | null;
  TTFB: number | null;
}

// Global metrics storage
let metrics: PerformanceMetrics = {
  LCP: null,
  INP: null,
  CLS: null,
  FCP: null,
  TTFB: null,
};

// Performance tracking configuration
const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds
  LCP_THRESHOLD: 2500, // 2.5 seconds
  INP_THRESHOLD: 200,  // 200 milliseconds
  CLS_THRESHOLD: 0.1,  // 0.1
  
  // Logging configuration
  LOG_TO_CONSOLE: import.meta.env.DEV,
  SEND_TO_ANALYTICS: true,
};

// Send metrics to analytics (placeholder for future implementation)
const sendToAnalytics = (metric: Metric) => {
  if (!PERFORMANCE_CONFIG.SEND_TO_ANALYTICS) return;
  
  // TODO: Implement analytics integration
  // Example: Google Analytics, Sentry, custom backend
  console.log('📊 Performance Metric:', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
};

// Log performance metrics
const logPerformanceMetric = (metric: Metric) => {
  const { name, value, rating } = metric;
  
  if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
    const emoji = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(`${emoji} ${name}: ${value}ms (${rating})`);
  }
  
  // Store metric
  metrics[name as keyof PerformanceMetrics] = value;
  
  // Send to analytics
  sendToAnalytics(metric);
};

// Initialize Core Web Vitals tracking
export const initPerformanceTracking = () => {
  try {
    // Largest Contentful Paint (LCP)
    onLCP((metric) => {
      console.log('📊 LCP Metric:', metric);
      logPerformanceMetric(metric);
    }, { reportAllChanges: true });
    
    // Interaction to Next Paint (INP)
    onINP((metric) => {
      console.log('📊 INP Metric:', metric);
      logPerformanceMetric(metric);
    }, { reportAllChanges: true });
    
    // Cumulative Layout Shift (CLS)
    onCLS((metric) => {
      console.log('📊 CLS Metric:', metric);
      logPerformanceMetric(metric);
    }, { reportAllChanges: true });
    
    // First Contentful Paint (FCP)
    onFCP((metric) => {
      console.log('📊 FCP Metric:', metric);
      logPerformanceMetric(metric);
    }, { reportAllChanges: true });
    
    // Time to First Byte (TTFB)
    onTTFB((metric) => {
      console.log('📊 TTFB Metric:', metric);
      logPerformanceMetric(metric);
    }, { reportAllChanges: true });
    
    console.log('🚀 Core Web Vitals tracking initialized with reportAllChanges');
  } catch (error) {
    console.error('❌ Failed to initialize performance tracking:', error);
  }
};

// Get current performance metrics
export const getPerformanceMetrics = (): PerformanceMetrics => {
  return { ...metrics };
};

// Check if performance is good
export const isPerformanceGood = (): boolean => {
  const { LCP, INP, CLS } = metrics;
  
  return (
    (LCP === null || LCP <= PERFORMANCE_CONFIG.LCP_THRESHOLD) &&
    (INP === null || INP <= PERFORMANCE_CONFIG.INP_THRESHOLD) &&
    (CLS === null || CLS <= PERFORMANCE_CONFIG.CLS_THRESHOLD)
  );
};

// Get performance score (0-100)
export const getPerformanceScore = (): number => {
  const { LCP, INP, CLS } = metrics;
  let score = 100;
  
  // LCP scoring (0-25 points)
  if (LCP !== null) {
    if (LCP <= 2500) score -= 0;
    else if (LCP <= 4000) score -= 10;
    else score -= 25;
  }
  
  // INP scoring (0-25 points)
  if (INP !== null) {
    if (INP <= 200) score -= 0;
    else if (INP <= 500) score -= 10;
    else score -= 25;
  }
  
  // CLS scoring (0-25 points)
  if (CLS !== null) {
    if (CLS <= 0.1) score -= 0;
    else if (CLS <= 0.25) score -= 10;
    else score -= 25;
  }
  
  return Math.max(0, score);
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  return {
    metrics: getPerformanceMetrics(),
    isGood: isPerformanceGood(),
    score: getPerformanceScore(),
  };
};

// Export types
export type { PerformanceMetrics };
