import React from 'react';
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
  
  // Logging configuration - Reduced verbosity
  LOG_TO_CONSOLE: false, // Disable console logging by default
  SEND_TO_ANALYTICS: false, // Disable analytics to reduce noise
  SEND_TO_BACKEND: import.meta.env.DEV ? false : true, // Only in production
  
  // Backend API configuration
  BACKEND_URL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  API_ENDPOINT: '/trends/performance-data',
  
  // Timeout configuration for metrics collection
  METRICS_TIMEOUT: 10000, // 10 seconds
  FORCE_SEND_TIMEOUT: 30000, // Increased to 30 seconds
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

    if (response.ok && PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
      console.log('✅ Performance data sent to backend successfully');
    } else if (!response.ok && PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
      console.warn('⚠️ Failed to send performance data to backend:', response.status);
    }
  } catch (error) {
    if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
      console.error('❌ Error sending performance data to backend:', error);
    }
  }
};

// Send metrics to analytics (placeholder for future implementation)
const sendToAnalytics = (metric: Metric) => {
  if (!PERFORMANCE_CONFIG.SEND_TO_ANALYTICS) return;
  
  // TODO: Implement analytics integration
  // Example: Google Analytics, Sentry, custom backend
  if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
    console.log('📊 Performance Metric:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }
};

// Check if we have enough metrics to send
const hasEnoughMetrics = (): boolean => {
  const collectedMetrics = Object.values(metrics).filter(value => value !== null);
  return collectedMetrics.length >= 3; // At least 3 metrics collected
};

// Force send metrics after timeout (even if incomplete)
let forceSendTimeout: NodeJS.Timeout | null = null;

const scheduleForceSend = (route: string) => {
  if (forceSendTimeout) {
    clearTimeout(forceSendTimeout);
  }
  
  forceSendTimeout = setTimeout(() => {
    const score = calculatePerformanceScore(metrics);
    if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
      console.log('⏰ Force sending performance data after timeout');
    }
    sendToBackend(route, metrics, score);
    
    // Reset metrics
    metrics = {
      LCP: null,
      INP: null,
      CLS: null,
      FCP: null,
      TTFB: null,
    };
  }, PERFORMANCE_CONFIG.FORCE_SEND_TIMEOUT);
};

// Log performance metrics
const logPerformanceMetric = (metric: Metric) => {
  const { name, value, rating } = metric;
  
  if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
    const emoji = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(`${emoji} ${name}: ${value}${name === 'CLS' ? '' : 'ms'} (${rating})`);
  }
  
  // Store metric
  metrics[name as keyof PerformanceMetrics] = value;
  
  // Only log if explicitly enabled
  if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
    console.log('📊 Performance Metric:', metric);
    console.log('📊 Current metrics state:', metrics);
  }
  
  // Send to analytics
  sendToAnalytics(metric);
  
  // Check if we have enough metrics or all metrics are collected
  const allMetricsCollected = Object.values(metrics).every(value => value !== null);
  const enoughMetrics = hasEnoughMetrics();
  
  if (allMetricsCollected || enoughMetrics) {
    const route = window.location.pathname;
    const score = calculatePerformanceScore(metrics);
    
    // Send to backend
    sendToBackend(route, metrics, score);
    
    // Clear force send timeout
    if (forceSendTimeout) {
      clearTimeout(forceSendTimeout);
      forceSendTimeout = null;
    }
    
    // DON'T reset metrics immediately - keep them for UI display
    // Only reset when navigating to a new page
  }
};

// Initialize Core Web Vitals tracking
export const initPerformanceTracking = () => {
  try {
    const route = window.location.pathname;
    
    // Schedule force send for this page
    scheduleForceSend(route);
    
    // Largest Contentful Paint (LCP) - Most important metric
    onLCP((metric) => {
      if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
        console.log('📊 LCP Metric:', metric);
      }
      logPerformanceMetric(metric);
    });
    
    // First Contentful Paint (FCP) - Early loading metric
    onFCP((metric) => {
      if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
        console.log('📊 FCP Metric:', metric);
      }
      logPerformanceMetric(metric);
    });
    
    // Cumulative Layout Shift (CLS) - Visual stability
    onCLS((metric) => {
      if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
        console.log('📊 CLS Metric:', metric);
      }
      logPerformanceMetric(metric);
    });
    
    // Time to First Byte (TTFB) - Server response time
    onTTFB((metric) => {
      if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
        console.log('📊 TTFB Metric:', metric);
      }
      logPerformanceMetric(metric);
    });
    
    // Interaction to Next Paint (INP) - User interaction responsiveness
    onINP((metric) => {
      if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
        console.log('📊 INP Metric:', metric);
      }
      logPerformanceMetric(metric);
    });
    
    if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
      console.log('🚀 Core Web Vitals tracking initialized with improved metrics collection');
      console.log('📊 Tracking metrics for route:', route);
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize performance tracking:', error);
  }
};

// Hook for React components
export const usePerformanceMonitoring = () => {
  const [currentMetrics, setCurrentMetrics] = React.useState({
    LCP: metrics.LCP || 0,
    INP: metrics.INP || 0,
    CLS: metrics.CLS || 0,
    FCP: metrics.FCP || 0,
    TTFB: metrics.TTFB || 0,
  });

  const [score, setScore] = React.useState(calculatePerformanceScore(metrics));
  const [isComplete, setIsComplete] = React.useState(Object.values(metrics).every(value => value !== null));
  const [hasEnoughData, setHasEnoughData] = React.useState(hasEnoughMetrics());

  // Update metrics when they change
  React.useEffect(() => {
    const updateMetrics = () => {
      // Manuel CLS değerini kontrol et
      const manualCLS = (window as any).simulatedCLS || 0;
      const effectiveCLS = metrics.CLS || manualCLS;
      
      const newMetrics = {
        LCP: metrics.LCP || 0,
        INP: metrics.INP || 0,
        CLS: effectiveCLS,
        FCP: metrics.FCP || 0,
        TTFB: metrics.TTFB || 0,
      };
      
      setCurrentMetrics(newMetrics);
      
      // Manuel CLS ile score hesapla
      const metricsWithManualCLS = { ...metrics, CLS: effectiveCLS };
      const newScore = calculatePerformanceScore(metricsWithManualCLS);
      setScore(newScore);
      
      // Completion durumunu kontrol et
      const hasAllMetrics = Object.values(metrics).some(value => value !== null);
      setIsComplete(hasAllMetrics);
      setHasEnoughData(hasEnoughMetrics());
      
      // Only log significant score changes (more than 5 points)
      if (Math.abs(newScore - score) > 5 && PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
        console.log('🔄 Metrics updated:', newMetrics, 'Score:', newScore);
      }
    };

    // Update immediately
    updateMetrics();

    // Set up interval to check for updates (reduced frequency)
    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds instead of 1

    return () => clearInterval(interval);
  }, []);

  return {
    metrics: currentMetrics,
    score,
    isGood: score >= 90,
    isComplete,
    hasEnoughData
  };
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
