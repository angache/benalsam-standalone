// ===========================
// PERFORMANCE UTILS TYPES
// ===========================

import { Metric } from 'web-vitals';

export interface PerformanceMetrics {
  LCP: number | null;
  INP: number | null;
  CLS: number | null;
  FCP: number | null;
  TTFB: number | null;
}

export interface PerformanceConfig {
  // Core Web Vitals thresholds
  LCP_THRESHOLD: number;
  INP_THRESHOLD: number;
  CLS_THRESHOLD: number;
  
  // Logging configuration
  LOG_TO_CONSOLE: boolean;
  SEND_TO_ANALYTICS: boolean;
  SEND_TO_BACKEND: boolean;
  
  // Backend API configuration
  BACKEND_URL: string;
  API_ENDPOINT: string;
  
  // Timeout configuration
  METRICS_TIMEOUT: number;
  FORCE_SEND_TIMEOUT: number;
}

export interface PerformanceData {
  route: string;
  timestamp: string;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    fcp: number;
  };
  score: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

export interface PerformanceScore {
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  breakdown: {
    lcp: { score: number; rating: string };
    fcp: { score: number; rating: string };
    cls: { score: number; rating: string };
    inp: { score: number; rating: string };
    ttfb: { score: number; rating: string };
  };
}

export interface MetricsState {
  metrics: PerformanceMetrics;
  score: number;
  isComplete: boolean;
  hasEnoughData: boolean;
  isGood: boolean;
}

export interface MetricsCollectorConfig {
  enableLCP: boolean;
  enableFCP: boolean;
  enableCLS: boolean;
  enableTTFB: boolean;
  enableINP: boolean;
  autoSend: boolean;
  forceSendTimeout: number;
  minMetricsRequired: number;
}

export interface BackendServiceConfig {
  url: string;
  endpoint: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface AnalyticsServiceConfig {
  enabled: boolean;
  provider: 'google-analytics' | 'sentry' | 'custom';
  customEndpoint?: string;
  batchSize: number;
  flushInterval: number;
}

export interface MetricsServiceInterface {
  // Metrics collection
  collectMetric(metric: Metric): void;
  getMetrics(): PerformanceMetrics;
  hasEnoughMetrics(): boolean;
  isComplete(): boolean;
  reset(): void;
  
  // Score calculation
  calculateScore(): number;
  getScoreBreakdown(): PerformanceScore;
  
  // Data sending
  sendToBackend(route: string): Promise<void>;
  sendToAnalytics(metric: Metric): void;
  forceSend(route: string): void;
  
  // State management
  getState(): MetricsState;
  subscribe(callback: (state: MetricsState) => void): () => void;
}

export interface BackendServiceInterface {
  send(data: PerformanceData): Promise<boolean>;
  isEnabled(): boolean;
  getConfig(): BackendServiceConfig;
}

export interface AnalyticsServiceInterface {
  send(metric: Metric): void;
  sendBatch(metrics: Metric[]): void;
  flush(): void;
  isEnabled(): boolean;
  getConfig(): AnalyticsServiceConfig;
}

export interface ScoreCalculatorInterface {
  calculateScore(metrics: PerformanceMetrics): number;
  getScoreBreakdown(metrics: PerformanceMetrics): PerformanceScore;
  getRating(score: number): 'good' | 'needs-improvement' | 'poor';
  getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor';
}

export interface MetricsCollectorInterface {
  // Core Web Vitals collection
  onLCP(callback: (metric: Metric) => void): void;
  onFCP(callback: (metric: Metric) => void): void;
  onCLS(callback: (metric: Metric) => void): void;
  onTTFB(callback: (metric: Metric) => void): void;
  onINP(callback: (metric: Metric) => void): void;
  
  // Manual metrics
  setManualCLS(value: number): void;
  getManualCLS(): number;
  
  // Configuration
  getConfig(): MetricsCollectorConfig;
  updateConfig(config: Partial<MetricsCollectorConfig>): void;
}

export interface PerformanceHookResult {
  metrics: PerformanceMetrics;
  score: number;
  isGood: boolean;
  isComplete: boolean;
  hasEnoughData: boolean;
  reset: () => void;
  forceSend: (route?: string) => void;
}

export interface PerformanceTrackingOptions {
  route?: string;
  customMetrics?: Partial<PerformanceMetrics>;
  autoSend?: boolean;
  forceSend?: boolean;
}

export interface PerformanceReport {
  timestamp: string;
  route: string;
  metrics: PerformanceMetrics;
  score: PerformanceScore;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  environment: {
    url: string;
    referrer: string;
    userAgent: string;
  };
}
