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
  SEND_TO_BACKEND: true,
  
  // Backend API configuration
  BACKEND_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  API_ENDPOINT: '/trends/performance-data',
};

// Calculate performance score
const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  let score = 100;
  
  // LCP scoring (0-2500ms = good, 2500-4000ms = needs-improvement, >4000ms = poor)
  if (metrics.LCP) {
    if (metrics.LCP > 4000) score -= 30;
    else if (metrics.LCP > 2500) score -= 15;
    else if (metrics.LCP > 2000) score -= 5;
  }
  
  // FCP scoring (0-1800ms = good, 1800-3000ms = needs-improvement, >3000ms = poor)
  if (metrics.FCP) {
    if (metrics.FCP > 3000) score -= 25;
    else if (metrics.FCP > 1800) score -= 12;
    else if (metrics.FCP > 1000) score -= 5;
  }
  
  // CLS scoring (0-0.1 = good, 0.1-0.25 = needs-improvement, >0.25 = poor)
  if (metrics.CLS) {
    if (metrics.CLS > 0.25) score -= 25;
    else if (metrics.CLS > 0.1) score -= 12;
    else if (metrics.CLS > 0.05) score -= 5;
  }
  
  // INP scoring (0-200ms = good, 200-500ms = needs-improvement, >500ms = poor)
  if (metrics.INP) {
    if (metrics.INP > 500) score -= 20;
    else if (metrics.INP > 200) score -= 10;
    else if (metrics.INP > 100) score -= 3;
  }
  
  // TTFB scoring (0-800ms = good, 800-1800ms = needs-improvement, >1800ms = poor)
  if (metrics.TTFB) {
    if (metrics.TTFB > 1800) score -= 15;
    else if (metrics.TTFB > 800) score -= 8;
    else if (metrics.TTFB > 400) score -= 3;
  }
  
  return Math.max(0, Math.round(score));
};

// Send performance data to backend
const sendToBackend = async (route: string, metrics: PerformanceMetrics, score: number) => {
  if (!PERFORMANCE_CONFIG.SEND_TO_BACKEND) return;
  
  try {
    const performanceData = {
      route,
      timestamp: new Date().toISOString(),
      metrics: {
        lcp: metrics.LCP || 0,
        fid: metrics.INP || 0, // Using INP as FID
        cls: metrics.CLS || 0,
        ttfb: metrics.TTFB || 0,
        fcp: metrics.FCP || 0
      },
      score,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    const response = await fetch(`${PERFORMANCE_CONFIG.BACKEND_URL}${PERFORMANCE_CONFIG.API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(performanceData)
    });

    if (response.ok) {
      console.log('✅ Performance data sent to backend successfully');
    } else {
      console.warn('⚠️ Failed to send performance data to backend:', response.status);
    }
  } catch (error) {
    console.error('❌ Error sending performance data to backend:', error);
  }
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
  
  // Check if all metrics are collected
  const allMetricsCollected = Object.values(metrics).every(value => value !== null);
  if (allMetricsCollected) {
    const route = window.location.pathname;
    const score = calculatePerformanceScore(metrics);
    
    // Send to backend
    sendToBackend(route, metrics, score);
    
    // Reset metrics for next page
    metrics = {
      LCP: null,
      INP: null,
      CLS: null,
      FCP: null,
      TTFB: null,
    };
  }
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
    
    console.log('🚀 Core Web Vitals tracking initialized with backend integration');
  } catch (error) {
    console.error('❌ Failed to initialize performance tracking:', error);
  }
};

// Hook for React components
export const usePerformanceMonitoring = () => {
  const getCurrentMetrics = () => {
    const score = calculatePerformanceScore(metrics);
    const isGood = score >= 90;
    
    return {
      metrics: {
        LCP: metrics.LCP || 0,
        INP: metrics.INP || 0,
        CLS: metrics.CLS || 0,
        FCP: metrics.FCP || 0,
        TTFB: metrics.TTFB || 0,
      },
      score,
      isGood,
      isComplete: Object.values(metrics).every(value => value !== null)
    };
  };

  return getCurrentMetrics();
};

// Export for manual tracking
export const trackPerformance = (route: string, customMetrics?: Partial<PerformanceMetrics>) => {
  const currentMetrics = { ...metrics, ...customMetrics };
  const score = calculatePerformanceScore(currentMetrics);
  
  sendToBackend(route, currentMetrics, score);
  
  return { metrics: currentMetrics, score };
};

// Export types
export type { PerformanceMetrics };
