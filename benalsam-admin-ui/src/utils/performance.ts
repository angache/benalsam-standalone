import React from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Enhanced Performance metrics interface
interface PerformanceMetrics {
  LCP: number | null;
  INP: number | null;
  CLS: number | null;
  FCP: number | null;
  TTFB: number | null;
}

// Performance history for trend analysis
interface PerformanceHistory {
  timestamp: string;
  metrics: PerformanceMetrics;
  score: number;
  route: string;
}

// Global metrics storage with history
let metrics: PerformanceMetrics = {
  LCP: null,
  INP: null,
  CLS: null,
  FCP: null,
  TTFB: null,
};

// Performance history storage
let performanceHistory: PerformanceHistory[] = [];

// Enhanced Performance tracking configuration
const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds (Admin UI optimized)
  LCP_THRESHOLD: 2000, // 2.0 seconds (stricter for admin)
  INP_THRESHOLD: 150,  // 150 milliseconds (stricter for admin)
  CLS_THRESHOLD: 0.05, // 0.05 (stricter for admin)
  FCP_THRESHOLD: 1500, // 1.5 seconds
  TTFB_THRESHOLD: 500, // 500 milliseconds
  
  // Logging configuration
  LOG_TO_CONSOLE: import.meta.env.DEV,
  SEND_TO_ANALYTICS: true,
  
  // History configuration
  MAX_HISTORY_SIZE: 50, // Keep last 50 measurements
  
  // Auto-save configuration
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
};

// Enhanced analytics with local storage
const saveToLocalStorage = (data: PerformanceHistory) => {
  try {
    const key = `admin-performance-${new Date().toISOString().split('T')[0]}`;
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    
    history.push(data);
    
    // Keep only recent data
    if (history.length > PERFORMANCE_CONFIG.MAX_HISTORY_SIZE) {
      history.splice(0, history.length - PERFORMANCE_CONFIG.MAX_HISTORY_SIZE);
    }
    
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
  }
};

// Send metrics to analytics (enhanced)
const sendToAnalytics = (metric: Metric) => {
  if (!PERFORMANCE_CONFIG.SEND_TO_ANALYTICS) return;
  
  // Enhanced analytics with more context
  console.log('📊 Admin Performance Metric:', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    timestamp: new Date().toISOString(),
    route: window.location.pathname,
    userAgent: navigator.userAgent,
  });
};

// Enhanced performance metrics logging
const logPerformanceMetric = (metric: Metric) => {
  const { name, value, rating } = metric;
  
  if (PERFORMANCE_CONFIG.LOG_TO_CONSOLE) {
    const emoji = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(`${emoji} Admin ${name}: ${value}${name === 'CLS' ? '' : 'ms'} (${rating})`);
  }
  
  // Store metric
  metrics[name as keyof PerformanceMetrics] = value;
  
  // Send to analytics
  sendToAnalytics(metric);
  
  // Check if all metrics are collected and save to history
  const allMetricsCollected = Object.values(metrics).every(value => value !== null);
  if (allMetricsCollected) {
    const score = getPerformanceScore();
    const historyEntry: PerformanceHistory = {
      timestamp: new Date().toISOString(),
      metrics: { ...metrics },
      score,
      route: window.location.pathname,
    };
    
    performanceHistory.push(historyEntry);
    saveToLocalStorage(historyEntry);
    
    console.log('📊 Admin Performance Complete:', {
      score,
      route: window.location.pathname,
      timestamp: historyEntry.timestamp,
    });
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

// Enhanced performance score calculation (Admin UI optimized)
export const getPerformanceScore = (): number => {
  const { LCP, INP, CLS, FCP, TTFB } = metrics;
  let score = 100;
  
  // LCP scoring (0-20 points) - Most important for admin
  if (LCP !== null) {
    if (LCP <= PERFORMANCE_CONFIG.LCP_THRESHOLD) score -= 0;
    else if (LCP <= 3000) score -= 5;
    else if (LCP <= 4000) score -= 10;
    else score -= 20;
  }
  
  // INP scoring (0-20 points) - Important for admin interactions
  if (INP !== null) {
    if (INP <= PERFORMANCE_CONFIG.INP_THRESHOLD) score -= 0;
    else if (INP <= 300) score -= 5;
    else if (INP <= 500) score -= 10;
    else score -= 20;
  }
  
  // CLS scoring (0-20 points) - Important for admin layout
  if (CLS !== null) {
    if (CLS <= PERFORMANCE_CONFIG.CLS_THRESHOLD) score -= 0;
    else if (CLS <= 0.1) score -= 5;
    else if (CLS <= 0.25) score -= 10;
    else score -= 20;
  }
  
  // FCP scoring (0-20 points) - Important for admin loading
  if (FCP !== null) {
    if (FCP <= PERFORMANCE_CONFIG.FCP_THRESHOLD) score -= 0;
    else if (FCP <= 2000) score -= 5;
    else if (FCP <= 3000) score -= 10;
    else score -= 20;
  }
  
  // TTFB scoring (0-20 points) - Important for admin API calls
  if (TTFB !== null) {
    if (TTFB <= PERFORMANCE_CONFIG.TTFB_THRESHOLD) score -= 0;
    else if (TTFB <= 800) score -= 5;
    else if (TTFB <= 1200) score -= 10;
    else score -= 20;
  }
  
  return Math.max(0, Math.round(score));
};

// Enhanced performance monitoring hook with React state
export const usePerformanceMonitoring = () => {
  const [currentMetrics, setCurrentMetrics] = React.useState(getPerformanceMetrics());
  const [currentScore, setCurrentScore] = React.useState(getPerformanceScore());
  const [isGood, setIsGood] = React.useState(isPerformanceGood());

  React.useEffect(() => {
    const updateMetrics = () => {
      setCurrentMetrics(getPerformanceMetrics());
      setCurrentScore(getPerformanceScore());
      setIsGood(isPerformanceGood());
    };

    // Update immediately
    updateMetrics();

    // Set up interval to check for updates
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics: currentMetrics,
    score: currentScore,
    isGood,
    history: performanceHistory,
    getTrend: () => getPerformanceTrend(),
    getRecommendations: () => getPerformanceRecommendations(),
  };
};

// Get performance trend analysis
export const getPerformanceTrend = () => {
  if (performanceHistory.length < 2) return 'insufficient_data';
  
  const recent = performanceHistory.slice(-5);
  const scores = recent.map(h => h.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  if (avgScore >= 90) return 'excellent';
  if (avgScore >= 80) return 'good';
  if (avgScore >= 70) return 'needs_improvement';
  return 'poor';
};

// Get performance recommendations
export const getPerformanceRecommendations = () => {
  const recommendations = [];
  const { LCP, INP, CLS, FCP, TTFB } = metrics;

  if (LCP && LCP > PERFORMANCE_CONFIG.LCP_THRESHOLD) {
    recommendations.push('LCP yüksek - Admin dashboard optimizasyonu gerekli');
  }
  
  if (INP && INP > PERFORMANCE_CONFIG.INP_THRESHOLD) {
    recommendations.push('INP yüksek - Admin etkileşimleri optimize edilmeli');
  }
  
  if (CLS && CLS > PERFORMANCE_CONFIG.CLS_THRESHOLD) {
    recommendations.push('CLS yüksek - Admin layout stabilizasyonu gerekli');
  }
  
  if (FCP && FCP > PERFORMANCE_CONFIG.FCP_THRESHOLD) {
    recommendations.push('FCP yüksek - Admin sayfa yükleme hızlandırılmalı');
  }
  
  if (TTFB && TTFB > PERFORMANCE_CONFIG.TTFB_THRESHOLD) {
    recommendations.push('TTFB yüksek - Admin API yanıt süreleri optimize edilmeli');
  }

  return recommendations;
};

// Get performance history
export const getPerformanceHistory = () => {
  return performanceHistory;
};

// Clear performance history
export const clearPerformanceHistory = () => {
  performanceHistory = [];
  localStorage.removeItem(`admin-performance-${new Date().toISOString().split('T')[0]}`);
};

// Export types
export type { PerformanceMetrics, PerformanceHistory };
