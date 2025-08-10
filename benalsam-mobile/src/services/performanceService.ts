import { Platform } from 'react-native';
import * as Device from 'expo-device';
import analyticsService from './analyticsService';

export interface PerformanceMetrics {
  bundleSize?: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  apiResponseTime?: {
    endpoint: string;
    duration: number;
    timestamp: string;
  };
  errorRate?: {
    type: string;
    count: number;
    timestamp: string;
  };
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    memory?: number;
  };
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private errorCounts: Map<string, number> = new Map();
  private apiTimings: Map<string, number[]> = new Map();

  private constructor() {
    this.initializeDeviceInfo();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private async initializeDeviceInfo() {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Device.modelName || 'Unknown',
      memory: Device.totalMemory ? Math.round(Device.totalMemory / (1024 * 1024 * 1024)) : undefined
    };

    console.log('📱 Device Info:', deviceInfo);
  }

  // Bundle size monitoring (estimated)
  public trackBundleSize(estimatedSize: number): void {
    const metric: PerformanceMetrics = {
      bundleSize: estimatedSize,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Device.modelName || 'Unknown'
      }
    };

    this.metrics.push(metric);
    console.log('📦 Bundle Size:', estimatedSize, 'KB');

    // Send to analytics
    analyticsService.trackEvent('PERFORMANCE', {
      metric_type: 'bundle_size',
      value: estimatedSize,
      unit: 'KB'
    });
  }

  // Memory usage tracking
  public trackMemoryUsage(used: number, total: number): void {
    const percentage = Math.round((used / total) * 100);
    const metric: PerformanceMetrics = {
      memoryUsage: {
        used,
        total,
        percentage
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Device.modelName || 'Unknown'
      }
    };

    this.metrics.push(metric);
    console.log('🧠 Memory Usage:', `${used}MB / ${total}MB (${percentage}%)`);

    // Alert if memory usage is high
    if (percentage > 80) {
      console.warn('⚠️ High memory usage detected:', percentage + '%');
    }

    // Send to analytics
    analyticsService.trackEvent('PERFORMANCE', {
      metric_type: 'memory_usage',
      used_mb: used,
      total_mb: total,
      percentage
    });
  }

  // API response time monitoring
  public trackApiResponseTime(endpoint: string, duration: number): void {
    const metric: PerformanceMetrics = {
      apiResponseTime: {
        endpoint,
        duration,
        timestamp: new Date().toISOString()
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Device.modelName || 'Unknown'
      }
    };

    this.metrics.push(metric);

    // Store timing for averaging
    if (!this.apiTimings.has(endpoint)) {
      this.apiTimings.set(endpoint, []);
    }
    this.apiTimings.get(endpoint)!.push(duration);

    // Calculate average response time
    const timings = this.apiTimings.get(endpoint)!;
    const average = timings.reduce((a, b) => a + b, 0) / timings.length;

    console.log(`🌐 API Response: ${endpoint} - ${duration}ms (avg: ${Math.round(average)}ms)`);

    // Alert if response time is slow
    if (duration > 5000) {
      console.warn('🐌 Slow API response detected:', endpoint, duration + 'ms');
    }

    // Send to analytics
    analyticsService.trackEvent('PERFORMANCE', {
      metric_type: 'api_response_time',
      endpoint,
      duration_ms: duration,
      average_ms: Math.round(average)
    });
  }

  // Error rate tracking
  public trackError(error: Error, context?: string): void {
    const errorType = error.name || 'Unknown';
    const errorKey = context ? `${context}:${errorType}` : errorType;

    // Increment error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    const metric: PerformanceMetrics = {
      errorRate: {
        type: errorType,
        count: currentCount + 1,
        timestamp: new Date().toISOString()
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Device.modelName || 'Unknown'
      }
    };

    this.metrics.push(metric);
    console.log('❌ Error tracked:', errorType, 'Count:', currentCount + 1);

    // Alert if error rate is high
    if (currentCount + 1 > 10) {
      console.error('🚨 High error rate detected:', errorKey, currentCount + 1);
    }

    // Send to analytics
    analyticsService.trackEvent('PERFORMANCE', {
      metric_type: 'error_rate',
      error_type: errorType,
      context: context || 'general',
      count: currentCount + 1,
      message: error.message
    });
  }

  // Get performance summary
  public getPerformanceSummary(): {
    totalMetrics: number;
    averageApiResponseTime: number;
    totalErrors: number;
    memoryUsage: number;
  } {
    const totalMetrics = this.metrics.length;
    
    // Calculate average API response time
    let totalApiTime = 0;
    let apiCallCount = 0;
    this.metrics.forEach(metric => {
      if (metric.apiResponseTime) {
        totalApiTime += metric.apiResponseTime.duration;
        apiCallCount++;
      }
    });
    const averageApiResponseTime = apiCallCount > 0 ? totalApiTime / apiCallCount : 0;

    // Calculate total errors
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);

    // Get latest memory usage
    const latestMemoryMetric = this.metrics
      .filter(m => m.memoryUsage)
      .pop();
    const memoryUsage = latestMemoryMetric?.memoryUsage?.percentage || 0;

    return {
      totalMetrics,
      averageApiResponseTime: Math.round(averageApiResponseTime),
      totalErrors,
      memoryUsage
    };
  }

  // Clear old metrics (keep last 100)
  public clearOldMetrics(): void {
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get all metrics
  public getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Reset metrics
  public resetMetrics(): void {
    this.metrics = [];
    this.errorCounts.clear();
    this.apiTimings.clear();
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService; 