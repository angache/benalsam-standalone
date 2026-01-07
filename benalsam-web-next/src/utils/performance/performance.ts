// ===========================
// MAIN PERFORMANCE UTILITY
// ===========================

import { Metric } from 'web-vitals';
import { logger } from '@/utils/production-logger';
import { PerformanceMetrics, PerformanceTrackingOptions } from './types';
import metricsService from './services/MetricsService';
import metricsCollector from './utils/metricsCollector';
import scoreCalculator from './utils/scoreCalculator';
import backendService from './services/BackendService';
import analyticsService from './services/AnalyticsService';

/**
 * Initializes Core Web Vitals tracking for the application.
 * Sets up listeners for LCP, FCP, CLS, TTFB, and INP metrics.
 * 
 * @throws {Error} If initialization fails (logged but not thrown)
 * 
 * @example
 * ```typescript
 * // Initialize on app startup
 * initPerformanceTracking()
 * ```
 */
export const initPerformanceTracking = () => {
  try {
    logger.debug('[Performance] Initializing Core Web Vitals tracking');

    // Initialize metrics collector
    metricsCollector.initialize();

    // Set up Core Web Vitals collection
    metricsCollector.onLCP((metric) => {
      logger.debug('[Performance] LCP Metric', { metric });
      metricsService.collectMetric(metric);
    });

    metricsCollector.onFCP((metric) => {
      logger.debug('[Performance] FCP Metric', { metric });
      metricsService.collectMetric(metric);
    });

    metricsCollector.onCLS((metric) => {
      logger.debug('[Performance] CLS Metric', { metric });
      metricsService.collectMetric(metric);
    });

    metricsCollector.onTTFB((metric) => {
      logger.debug('[Performance] TTFB Metric', { metric });
      metricsService.collectMetric(metric);
    });

    metricsCollector.onINP((metric) => {
      logger.debug('[Performance] INP Metric', { metric });
      metricsService.collectMetric(metric);
    });

    logger.debug('[Performance] Core Web Vitals tracking initialized');

  } catch (error) {
    logger.error('[Performance] Failed to initialize performance tracking', { error });
  }
};

/**
 * React hook for performance monitoring in components.
 * Provides real-time performance metrics and insights.
 * 
 * @returns Performance monitoring hook instance
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { metrics, score } = usePerformanceMonitoring()
 *   return <div>Performance: {score}</div>
 * }
 * ```
 */
export const usePerformanceMonitoring = () => {
  const { usePerformanceMonitoring: useHook } = require('./hooks/usePerformanceMonitoring');
  return useHook();
};

/**
 * Manually tracks performance metrics for a specific route.
 * Combines collected metrics with custom metrics and sends to backend.
 * 
 * @param route - The route path to track (e.g., '/ilan/123')
 * @param customMetrics - Optional custom metrics to override collected ones
 * @returns Object containing current metrics and calculated score
 * 
 * @example
 * ```typescript
 * const { metrics, score } = trackPerformance('/ilan/123', { LCP: 1500 })
 * ```
 */
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

/**
 * Gets the current performance tracking state.
 * 
 * @returns Current state object with all collected metrics
 * 
 * @example
 * ```typescript
 * const state = getPerformanceState()
 * console.log(state.metrics.LCP)
 * ```
 */
export const getPerformanceState = () => {
  return metricsService.getState();
};

/**
 * Gets performance insights and optimization suggestions.
 * Analyzes collected metrics and provides actionable recommendations.
 * 
 * @returns Object containing insights and suggestions
 * 
 * @example
 * ```typescript
 * const { insights, suggestions } = getPerformanceInsights()
 * suggestions.forEach(suggestion => console.log(suggestion))
 * ```
 */
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

/**
 * Forces immediate sending of performance data to backend.
 * Useful for testing or when you need to send data before page unload.
 * 
 * @param route - Optional route path (defaults to current window location)
 * 
 * @example
 * ```typescript
 * // Send current page metrics
 * forceSendPerformanceData()
 * 
 * // Send for specific route
 * forceSendPerformanceData('/ilan/123')
 * ```
 */
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
interface PerformanceConfig {
  enableLCP?: boolean
  enableFCP?: boolean
  enableCLS?: boolean
  enableTTFB?: boolean
  enableINP?: boolean
  [key: string]: unknown
}

export const updatePerformanceConfig = (config: PerformanceConfig) => {
  // Update metrics collector config
  metricsCollector.updateConfig(config.metricsCollector);
  
  // Update backend service config
  backendService.updateConfig(config.backend);
  
  // Update analytics service config
  analyticsService.updateConfig(config.analytics);
  
  logger.debug('[Performance] Configuration updated');
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
  logger.debug('[Performance] Tracking cleaned up');
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
