// ===========================
// PERFORMANCE CONFIG UTILITY
// ===========================

import { PerformanceConfig, MetricsCollectorConfig, BackendServiceConfig, AnalyticsServiceConfig } from '../types';

// Main performance configuration
export const PERFORMANCE_CONFIG: PerformanceConfig = {
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

// Metrics collector configuration
export const METRICS_COLLECTOR_CONFIG: MetricsCollectorConfig = {
  enableLCP: true,
  enableFCP: true,
  enableCLS: true,
  enableTTFB: true,
  enableINP: true,
  autoSend: true,
  forceSendTimeout: 30000,
  minMetricsRequired: 3,
};

// Backend service configuration
export const BACKEND_SERVICE_CONFIG: BackendServiceConfig = {
  url: PERFORMANCE_CONFIG.BACKEND_URL,
  endpoint: PERFORMANCE_CONFIG.API_ENDPOINT,
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Analytics service configuration
export const ANALYTICS_SERVICE_CONFIG: AnalyticsServiceConfig = {
  enabled: false,
  provider: 'custom',
  batchSize: 10,
  flushInterval: 5000,
};

// Core Web Vitals thresholds for scoring
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
    poor: 4000,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
    poor: 3000,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
    poor: 0.25,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
    poor: 500,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
    poor: 1800,
  },
};

// Score weights for different metrics
export const SCORE_WEIGHTS = {
  LCP: 30, // Largest Contentful Paint - Most important
  FCP: 25, // First Contentful Paint
  CLS: 25, // Cumulative Layout Shift
  INP: 20, // Interaction to Next Paint
  TTFB: 15, // Time to First Byte
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  const isTest = import.meta.env.MODE === 'test';

  return {
    isDevelopment,
    isProduction,
    isTest,
    logToConsole: isDevelopment && !isTest,
    sendToBackend: isProduction,
    sendToAnalytics: isProduction,
    debugMode: isDevelopment,
  };
};

// Configuration validation
export const validateConfig = (config: PerformanceConfig): boolean => {
  const requiredFields = [
    'LCP_THRESHOLD',
    'INP_THRESHOLD',
    'CLS_THRESHOLD',
    'BACKEND_URL',
    'API_ENDPOINT',
    'METRICS_TIMEOUT',
    'FORCE_SEND_TIMEOUT',
  ];

  for (const field of requiredFields) {
    if (config[field as keyof PerformanceConfig] === undefined) {
      console.error(`❌ Missing required config field: ${field}`);
      return false;
    }
  }

  if (config.LCP_THRESHOLD <= 0 || config.INP_THRESHOLD <= 0 || config.CLS_THRESHOLD <= 0) {
    console.error('❌ Invalid threshold values in config');
    return false;
  }

  return true;
};

// Configuration update utility
export const updateConfig = (
  currentConfig: PerformanceConfig,
  updates: Partial<PerformanceConfig>
): PerformanceConfig => {
  const newConfig = { ...currentConfig, ...updates };
  
  if (!validateConfig(newConfig)) {
    console.warn('⚠️ Invalid config updates, using current config');
    return currentConfig;
  }
  
  return newConfig;
};

// Get configuration for specific environment
export const getConfigForEnvironment = (): PerformanceConfig => {
  const env = getEnvironmentConfig();
  
  return updateConfig(PERFORMANCE_CONFIG, {
    LOG_TO_CONSOLE: env.logToConsole,
    SEND_TO_BACKEND: env.sendToBackend,
    SEND_TO_ANALYTICS: env.sendToAnalytics,
  });
};

// Export default configurations
export default {
  PERFORMANCE_CONFIG,
  METRICS_COLLECTOR_CONFIG,
  BACKEND_SERVICE_CONFIG,
  ANALYTICS_SERVICE_CONFIG,
  CORE_WEB_VITALS_THRESHOLDS,
  SCORE_WEIGHTS,
  getEnvironmentConfig,
  validateConfig,
  updateConfig,
  getConfigForEnvironment,
};
