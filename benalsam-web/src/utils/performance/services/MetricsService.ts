// ===========================
// METRICS SERVICE
// ===========================

import { Metric, PerformanceMetrics, MetricsState, PerformanceScore } from '../types';
import { PERFORMANCE_CONFIG } from '../utils/config';
import scoreCalculator from '../utils/scoreCalculator';
import backendService from './BackendService';
import analyticsService from './AnalyticsService';

class MetricsService {
  private metrics: PerformanceMetrics = {
    LCP: null,
    INP: null,
    CLS: null,
    FCP: null,
    TTFB: null,
  };

  private subscribers: ((state: MetricsState) => void)[] = [];
  private forceSendTimeout: NodeJS.Timeout | null = null;

  // Metrics collection
  collectMetric(metric: Metric): void {
    const { name, value } = metric;
    
    // Store metric
    this.metrics[name as keyof PerformanceMetrics] = value;
    
    // Send to analytics
    analyticsService.send(metric);
    
    // Check if we should send to backend
    this.checkAndSend();
    
    // Notify subscribers
    this.notifySubscribers();
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  hasEnoughMetrics(): boolean {
    const collectedMetrics = Object.values(this.metrics).filter(value => value !== null);
    return collectedMetrics.length >= 3; // At least 3 metrics collected
  }

  isComplete(): boolean {
    return Object.values(this.metrics).every(value => value !== null);
  }

  reset(): void {
    this.metrics = {
      LCP: null,
      INP: null,
      CLS: null,
      FCP: null,
      TTFB: null,
    };
    
    if (this.forceSendTimeout) {
      clearTimeout(this.forceSendTimeout);
      this.forceSendTimeout = null;
    }
    
    this.notifySubscribers();
  }

  // Score calculation
  calculateScore(): number {
    return scoreCalculator.calculateScore(this.metrics);
  }

  getScoreBreakdown(): PerformanceScore {
    return scoreCalculator.getScoreBreakdown(this.metrics);
  }

  // Data sending
  async sendToBackend(route: string): Promise<void> {
    const score = this.calculateScore();
    const performanceData = {
      route,
      timestamp: new Date().toISOString(),
      metrics: {
        lcp: this.metrics.LCP || 0,
        fid: this.metrics.INP || 0, // Using INP as FID
        cls: this.metrics.CLS || 0,
        ttfb: this.metrics.TTFB || 0,
        fcp: this.metrics.FCP || 0
      },
      score,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    await backendService.send(performanceData);
  }

  sendToAnalytics(metric: Metric): void {
    analyticsService.send(metric);
  }

  forceSend(route: string): void {
    const score = this.calculateScore();
    console.log('⏰ Force sending performance data after timeout');
    this.sendToBackend(route);
    
    // Reset metrics after force send
    this.reset();
  }

  // State management
  getState(): MetricsState {
    return {
      metrics: this.getMetrics(),
      score: this.calculateScore(),
      isComplete: this.isComplete(),
      hasEnoughData: this.hasEnoughMetrics(),
      isGood: this.calculateScore() >= 90,
    };
  }

  subscribe(callback: (state: MetricsState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Private methods
  private checkAndSend(): void {
    const allMetricsCollected = this.isComplete();
    const enoughMetrics = this.hasEnoughMetrics();
    
    if (allMetricsCollected || enoughMetrics) {
      const route = window.location.pathname;
      
      // Send to backend
      this.sendToBackend(route);
      
      // Clear force send timeout
      if (this.forceSendTimeout) {
        clearTimeout(this.forceSendTimeout);
        this.forceSendTimeout = null;
      }
    } else {
      // Schedule force send if not already scheduled
      if (!this.forceSendTimeout) {
        this.scheduleForceSend();
      }
    }
  }

  private scheduleForceSend(): void {
    if (this.forceSendTimeout) {
      clearTimeout(this.forceSendTimeout);
    }
    
    this.forceSendTimeout = setTimeout(() => {
      const route = window.location.pathname;
      this.forceSend(route);
    }, PERFORMANCE_CONFIG.FORCE_SEND_TIMEOUT);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('❌ Error in metrics subscriber callback:', error);
      }
    });
  }

  // Utility methods
  getPerformanceInsights(): string[] {
    return scoreCalculator.getPerformanceInsights(this.metrics);
  }

  getOptimizationSuggestions(): string[] {
    return scoreCalculator.getOptimizationSuggestions(this.metrics);
  }

  // Manual CLS handling
  setManualCLS(value: number): void {
    this.metrics.CLS = value;
    (window as any).simulatedCLS = value;
    this.notifySubscribers();
  }

  getManualCLS(): number {
    return (window as any).simulatedCLS || 0;
  }

  // Service status
  getServiceStatus(): {
    backend: ReturnType<typeof backendService.getStatus>;
    analytics: ReturnType<typeof analyticsService.getStatus>;
    metrics: {
      collected: number;
      total: number;
      complete: boolean;
      score: number;
    };
  } {
    return {
      backend: backendService.getStatus(),
      analytics: analyticsService.getStatus(),
      metrics: {
        collected: Object.values(this.metrics).filter(v => v !== null).length,
        total: Object.keys(this.metrics).length,
        complete: this.isComplete(),
        score: this.calculateScore(),
      },
    };
  }

  // Cleanup
  destroy(): void {
    if (this.forceSendTimeout) {
      clearTimeout(this.forceSendTimeout);
      this.forceSendTimeout = null;
    }
    
    this.subscribers = [];
    analyticsService.destroy();
  }
}

export default new MetricsService();
