// ===========================
// METRICS COLLECTOR UTILITY
// ===========================

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { MetricsCollectorConfig } from '../types';
import { METRICS_COLLECTOR_CONFIG } from './config';

class MetricsCollector {
  private config: MetricsCollectorConfig;
  private manualCLS: number = 0;
  private callbacks: Map<string, ((metric: Metric) => void)[]> = new Map();

  constructor(config: MetricsCollectorConfig = METRICS_COLLECTOR_CONFIG) {
    this.config = config;
  }

  // Core Web Vitals collection methods
  onLCP(callback: (metric: Metric) => void): void {
    if (!this.config.enableLCP) return;

    this.addCallback('LCP', callback);
    
    onLCP((metric) => {
      this.logMetric('LCP', metric);
      this.notifyCallbacks('LCP', metric);
    });
  }

  onFCP(callback: (metric: Metric) => void): void {
    if (!this.config.enableFCP) return;

    this.addCallback('FCP', callback);
    
    onFCP((metric) => {
      this.logMetric('FCP', metric);
      this.notifyCallbacks('FCP', metric);
    });
  }

  onCLS(callback: (metric: Metric) => void): void {
    if (!this.config.enableCLS) return;

    this.addCallback('CLS', callback);
    
    onCLS((metric) => {
      this.logMetric('CLS', metric);
      this.notifyCallbacks('CLS', metric);
    });
  }

  onTTFB(callback: (metric: Metric) => void): void {
    if (!this.config.enableTTFB) return;

    this.addCallback('TTFB', callback);
    
    onTTFB((metric) => {
      this.logMetric('TTFB', metric);
      this.notifyCallbacks('TTFB', metric);
    });
  }

  onINP(callback: (metric: Metric) => void): void {
    if (!this.config.enableINP) return;

    this.addCallback('INP', callback);
    
    onINP((metric) => {
      this.logMetric('INP', metric);
      this.notifyCallbacks('INP', metric);
    });
  }

  // Manual CLS management
  setManualCLS(value: number): void {
    this.manualCLS = value;
    (window as any).simulatedCLS = value;
    
    if (this.config.enableCLS) {
      console.log(`📊 Manual CLS set to: ${value}`);
    }
  }

  getManualCLS(): number {
    return this.manualCLS;
  }

  // Configuration management
  getConfig(): MetricsCollectorConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MetricsCollectorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📊 Metrics collector config updated:', this.config);
  }

  // Initialize all metrics collection
  initialize(): void {
    console.log('🚀 Initializing Core Web Vitals collection');
    
    // Initialize all enabled metrics
    if (this.config.enableLCP) {
      onLCP((metric) => {
        this.logMetric('LCP', metric);
        this.notifyCallbacks('LCP', metric);
      });
    }

    if (this.config.enableFCP) {
      onFCP((metric) => {
        this.logMetric('FCP', metric);
        this.notifyCallbacks('FCP', metric);
      });
    }

    if (this.config.enableCLS) {
      onCLS((metric) => {
        this.logMetric('CLS', metric);
        this.notifyCallbacks('CLS', metric);
      });
    }

    if (this.config.enableTTFB) {
      onTTFB((metric) => {
        this.logMetric('TTFB', metric);
        this.notifyCallbacks('TTFB', metric);
      });
    }

    if (this.config.enableINP) {
      onINP((metric) => {
        this.logMetric('INP', metric);
        this.notifyCallbacks('INP', metric);
      });
    }

    console.log('✅ Core Web Vitals collection initialized');
  }

  // Utility methods
  private addCallback(metricName: string, callback: (metric: Metric) => void): void {
    if (!this.callbacks.has(metricName)) {
      this.callbacks.set(metricName, []);
    }
    this.callbacks.get(metricName)!.push(callback);
  }

  private notifyCallbacks(metricName: string, metric: Metric): void {
    const callbacks = this.callbacks.get(metricName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(metric);
        } catch (error) {
          console.error(`❌ Error in ${metricName} callback:`, error);
        }
      });
    }
  }

  private logMetric(name: string, metric: Metric): void {
    const { value, rating } = metric;
    const emoji = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    
    console.log(`${emoji} ${name}: ${value}${name === 'CLS' ? '' : 'ms'} (${rating})`);
  }

  // Get all registered callbacks
  getCallbacks(): Map<string, ((metric: Metric) => void)[]> {
    return new Map(this.callbacks);
  }

  // Remove specific callback
  removeCallback(metricName: string, callback: (metric: Metric) => void): boolean {
    const callbacks = this.callbacks.get(metricName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  // Clear all callbacks
  clearCallbacks(): void {
    this.callbacks.clear();
  }

  // Get enabled metrics
  getEnabledMetrics(): string[] {
    const enabled: string[] = [];
    
    if (this.config.enableLCP) enabled.push('LCP');
    if (this.config.enableFCP) enabled.push('FCP');
    if (this.config.enableCLS) enabled.push('CLS');
    if (this.config.enableTTFB) enabled.push('TTFB');
    if (this.config.enableINP) enabled.push('INP');
    
    return enabled;
  }

  // Check if metric is enabled
  isMetricEnabled(metricName: string): boolean {
    const enabledMap = {
      LCP: this.config.enableLCP,
      FCP: this.config.enableFCP,
      CLS: this.config.enableCLS,
      TTFB: this.config.enableTTFB,
      INP: this.config.enableINP,
    };
    
    return enabledMap[metricName as keyof typeof enabledMap] || false;
  }

  // Get collection status
  getStatus(): {
    enabled: boolean;
    metrics: string[];
    callbacks: number;
    manualCLS: number;
  } {
    return {
      enabled: this.config.enableLCP || this.config.enableFCP || this.config.enableCLS || this.config.enableTTFB || this.config.enableINP,
      metrics: this.getEnabledMetrics(),
      callbacks: Array.from(this.callbacks.values()).reduce((total, callbacks) => total + callbacks.length, 0),
      manualCLS: this.manualCLS,
    };
  }
}

export default new MetricsCollector();
