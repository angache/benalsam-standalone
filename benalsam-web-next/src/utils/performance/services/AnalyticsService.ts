// ===========================
// ANALYTICS SERVICE
// ===========================

import { logger } from '@/utils/production-logger';
import { Metric, AnalyticsServiceConfig } from '../types';
import { ANALYTICS_SERVICE_CONFIG } from '../utils/config';

class AnalyticsService {
  private config: AnalyticsServiceConfig;
  private batchQueue: Metric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsServiceConfig = ANALYTICS_SERVICE_CONFIG) {
    this.config = config;
    this.initializeFlushInterval();
  }

  // Send individual metric to analytics
  send(metric: Metric): void {
    if (!this.isEnabled()) {
      return;
    }

    if (this.config.batchSize > 1) {
      this.addToBatch(metric);
    } else {
      this.sendImmediate(metric);
    }
  }

  // Send batch of metrics
  sendBatch(metrics: Metric[]): void {
    if (!this.isEnabled() || metrics.length === 0) {
      return;
    }

    logger.debug('[AnalyticsService] Sending batch of metrics', { count: metrics.length });

    switch (this.config.provider) {
      case 'google-analytics':
        this.sendToGoogleAnalytics(metrics);
        break;
      case 'sentry':
        this.sendToSentry(metrics);
        break;
      case 'custom':
        this.sendToCustomAnalytics(metrics);
        break;
      default:
        logger.warn('[AnalyticsService] Unknown analytics provider', { provider: this.config.provider });
    }
  }

  // Flush queued metrics
  flush(): void {
    if (this.batchQueue.length > 0) {
      this.sendBatch([...this.batchQueue]);
      this.batchQueue = [];
    }
  }

  // Check if analytics service is enabled
  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Get service configuration
  getConfig(): AnalyticsServiceConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(config: Partial<AnalyticsServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeFlushInterval();
    logger.debug('[AnalyticsService] Config updated', { config: this.config });
  }

  // Private methods
  private addToBatch(metric: Metric): void {
    this.batchQueue.push(metric);

    if (this.batchQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private sendImmediate(metric: Metric): void {
    this.sendBatch([metric]);
  }

  private sendToGoogleAnalytics(metrics: Metric[]): void {
    // Google Analytics 4 implementation
    interface WindowWithGtag extends Window {
      gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void
    }
    
    if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
      metrics.forEach(metric => {
        (window as WindowWithGtag).gtag!('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: metric.name,
          value: Math.round(metric.value),
          non_interaction: true,
        });
      });
      logger.debug('[AnalyticsService] Sent metrics to Google Analytics', { count: metrics.length });
    } else {
      logger.warn('[AnalyticsService] Google Analytics not available', { reason: 'gtag not found' });
    }
  }

  private sendToSentry(metrics: Metric[]): void {
    // Sentry implementation
    interface WindowWithSentry extends Window {
      Sentry?: {
        metrics: {
          increment: (name: string, options?: Record<string, unknown>) => void
        }
      }
    }
    
    if (typeof window !== 'undefined' && (window as WindowWithSentry).Sentry) {
      metrics.forEach(metric => {
        (window as WindowWithSentry).Sentry!.metrics.increment('web_vitals', {
          tags: {
            metric: metric.name,
            rating: metric.rating,
          },
          value: metric.value,
        });
      });
      logger.debug('[AnalyticsService] Sent metrics to Sentry', { count: metrics.length });
    } else {
      logger.warn('[AnalyticsService] Sentry not available', { reason: 'Sentry not found' });
    }
  }

  private sendToCustomAnalytics(metrics: Metric[]): void {
    // Custom analytics implementation
    if (this.config.customEndpoint) {
      fetch(this.config.customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      })
        .then(response => {
          if (response.ok) {
            logger.debug('[AnalyticsService] Sent metrics to custom analytics', { count: metrics.length });
          } else {
            logger.warn('[AnalyticsService] Failed to send metrics to custom analytics', { status: response.status });
          }
        })
        .catch(error => {
          logger.error('[AnalyticsService] Error sending metrics to custom analytics', { error });
        });
    } else {
      // Fallback to console logging
      logger.debug('[AnalyticsService] Analytics metrics', { metrics });
    }
  }

  private initializeFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    if (this.isEnabled() && this.config.flushInterval > 0) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  // Get service status
  getStatus(): {
    enabled: boolean;
    provider: string;
    batchSize: number;
    queueLength: number;
    flushInterval: number;
  } {
    return {
      enabled: this.isEnabled(),
      provider: this.config.provider,
      batchSize: this.config.batchSize,
      queueLength: this.batchQueue.length,
      flushInterval: this.config.flushInterval,
    };
  }

  // Clear batch queue
  clearQueue(): void {
    this.batchQueue = [];
  }

  // Get queue length
  getQueueLength(): number {
    return this.batchQueue.length;
  }

  // Test analytics connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Analytics service disabled' };
    }

    try {
      const testMetric: Metric = {
        name: 'TEST',
        value: 0,
        rating: 'good',
        delta: 0,
        id: 'test',
        navigationType: 'navigate',
      };

      this.send(testMetric);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage };
    }
  }

  // Validate metric before sending
  validateMetric(metric: Metric): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metric.name) {
      errors.push('Missing metric name');
    }

    if (typeof metric.value !== 'number' || metric.value < 0) {
      errors.push('Invalid metric value');
    }

    if (!['good', 'needs-improvement', 'poor'].includes(metric.rating)) {
      errors.push('Invalid metric rating');
    }

    if (typeof metric.delta !== 'number') {
      errors.push('Invalid metric delta');
    }

    if (!metric.id) {
      errors.push('Missing metric ID');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Cleanup resources
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.clearQueue();
  }
}

export default new AnalyticsService();
