// ===========================
// MAIN PERFORMANCE UTILITY
// ===========================

import { Metric } from 'web-vitals';
import { PerformanceMetrics, PerformanceTrackingOptions } from './types';
import metricsService from './services/MetricsService';
import metricsCollector from './utils/metricsCollector';
import scoreCalculator from './utils/scoreCalculator';
import backendService from './services/BackendService';
import analyticsService from './services/AnalyticsService';

// Initialize Core Web Vitals tracking
export const initPerformanceTracking = () => {
  try {
    console.log('🚀 Initializing Core Web Vitals tracking');

    // Initialize metrics collector
    metricsCollector.initialize();

    // Set up Core Web Vitals collection
    metricsCollector.onLCP((metric) => {
      console.log('📊 LCP Metric:', metric);
      metricsService.collectMetric(metric);
    });

    metricsCollector.onFCP((metric) => {
      console.log('📊 FCP Metric:', metric);
      metricsService.collectMetric(metric);
    });

    metricsCollector.onCLS((metric) => {
      console.log('📊 CLS Metric:', metric);
      metricsService.collectMetric(metric);
    });

    metricsCollector.onTTFB((metric) => {
      console.log('📊 TTFB Metric:', metric);
      metricsService.collectMetric(metric);
    });

    metricsCollector.onINP((metric) => {
      console.log('📊 INP Metric:', metric);
      metricsService.collectMetric(metric);
    });

    console.log('✅ Core Web Vitals tracking initialized');

  } catch (error) {
    console.error('❌ Failed to initialize performance tracking:', error);
  }
};

// Hook for React components
export const usePerformanceMonitoring = () => {
  const { usePerformanceMonitoring: useHook } = require('./hooks/usePerformanceMonitoring');
  return useHook();
};

// Manual performance tracking
export const trackPerformance = (
  route: string, 
  customMetrics?: Partial<PerformanceMetrics>
): { metrics: PerformanceMetrics; score: number } => {
  const currentMetrics = { ...metricsService.getMetrics(), ...customMetrics };
  const score = scoreCalculator.calculateScore(currentMetrics);
  
  // Send to backend
  backendService.send({
    route,
    timestamp: new Date().toISOString(),
    metrics: {
      lcp: currentMetrics.LCP || 0,
      fid: currentMetrics.INP || 0,
      cls: currentMetrics.CLS || 0,
      ttfb: currentMetrics.TTFB || 0,
      fcp: currentMetrics.FCP || 0
    },
    score,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
  
  return { metrics: currentMetrics, score };
};

// Manual CLS setting
export const setManualCLS = (value: number): void => {
  metricsService.setManualCLS(value);
};

// Get current performance state
export const getPerformanceState = () => {
  return metricsService.getState();
};

// Get performance insights
export const getPerformanceInsights = () => {
  return {
    insights: metricsService.getPerformanceInsights(),
    suggestions: metricsService.getOptimizationSuggestions(),
  };
};

// Get service status
export const getServiceStatus = () => {
  return metricsService.getServiceStatus();
};

// Reset performance metrics
export const resetPerformanceMetrics = () => {
  metricsService.reset();
};

// Force send performance data
export const forceSendPerformanceData = (route?: string) => {
  const targetRoute = route || window.location.pathname;
  metricsService.forceSend(targetRoute);
};

// Test backend connection
export const testBackendConnection = () => {
  return backendService.testConnection();
};

// Test analytics connection
export const testAnalyticsConnection = () => {
  return analyticsService.testConnection();
};

// Update configuration
export const updatePerformanceConfig = (config: any) => {
  // Update metrics collector config
  metricsCollector.updateConfig(config.metricsCollector);
  
  // Update backend service config
  backendService.updateConfig(config.backend);
  
  // Update analytics service config
  analyticsService.updateConfig(config.analytics);
  
  console.log('📊 Performance configuration updated');
};

// Get performance trends
export const getPerformanceTrends = (scores: number[]) => {
  return scoreCalculator.calculateTrend(scores);
};

// Compare performance scores
export const comparePerformanceScores = (score1: number, score2: number) => {
  return scoreCalculator.compareScores(score1, score2);
};

// Calculate weighted performance score
export const calculateWeightedScore = (metrics: PerformanceMetrics) => {
  return scoreCalculator.calculateWeightedScore(metrics);
};

// Get detailed score breakdown
export const getScoreBreakdown = (metrics: PerformanceMetrics) => {
  return scoreCalculator.getScoreBreakdown(metrics);
};

// Cleanup performance tracking
export const cleanupPerformanceTracking = () => {
  metricsService.destroy();
  console.log('🧹 Performance tracking cleaned up');
};

// Export types
export type { PerformanceMetrics, PerformanceTrackingOptions };

// Export services for advanced usage
export { metricsService, backendService, analyticsService, scoreCalculator, metricsCollector };

// Export hooks
export { 
  usePerformanceMonitoring,
  useManualPerformanceTracking,
  usePerformanceInsights,
  useServiceStatus,
  usePerformanceTrends,
} from './hooks/usePerformanceMonitoring';
