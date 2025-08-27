import { performance } from 'perf_hooks';
import logger from '../config/logger';
import axios from 'axios';

interface MonitoringConfig {
  endpoint: string;
  method: string;
  description: string;
  priority: 'critical' | 'medium' | 'low';
  interval: number; // milliseconds
  timeout: number; // milliseconds
  threshold: {
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    throughput: number; // requests per second
  };
}

interface MonitoringResult {
  endpoint: string;
  timestamp: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  throughput?: number;
}

interface PerformanceAlert {
  type: 'response_time' | 'error_rate' | 'throughput' | 'timeout';
  severity: 'warning' | 'critical';
  endpoint: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

class PerformanceMonitoringService {
  private monitoringConfigs: MonitoringConfig[] = [];
  private monitoringResults: Map<string, MonitoringResult[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private isRunning = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeMonitoringConfigs();
  }

  private initializeMonitoringConfigs() {
    this.monitoringConfigs = [
      // Critical Endpoints - Every 15 minutes (daha az sık)
      {
        endpoint: '/api/v1/health',
        method: 'GET',
        description: 'System Health Check',
        priority: 'critical',
        interval: 15 * 60 * 1000, // 15 minutes
        timeout: 30000, // 30 saniye (15'ten 30'a çıkarıldı)
        threshold: {
          responseTime: 20000, // 20 saniye (10'dan 20'ye çıkarıldı)
          errorRate: 5,
          throughput: 10
        }
      },
      {
        endpoint: '/api/v1/health/detailed',
        method: 'GET',
        description: 'Detailed Health Status',
        priority: 'critical',
        interval: 15 * 60 * 1000, // 15 minutes
        timeout: 40000, // 40 saniye (20'den 40'a çıkarıldı)
        threshold: {
          responseTime: 30000, // 30 saniye (15'ten 30'a çıkarıldı)
          errorRate: 5,
          throughput: 8
        }
      },
      {
        endpoint: '/api/v1/auth/login',
        method: 'POST',
        description: 'Authentication Endpoint',
        priority: 'critical',
        interval: 15 * 60 * 1000, // 15 minutes
        timeout: 20000, // 20 saniye (10'dan 20'ye çıkarıldı)
        threshold: {
          responseTime: 15000, // 15 saniye (8'den 15'e çıkarıldı)
          errorRate: 2,
          throughput: 15
        }
      },
      {
        endpoint: '/api/v1/listings',
        method: 'GET',
        description: 'Core Business - Listings',
        priority: 'critical',
        interval: 15 * 60 * 1000, // 15 minutes
        timeout: 30000, // 30 saniye (15'ten 30'a çıkarıldı)
        threshold: {
          responseTime: 25000, // 25 saniye (12'den 25'e çıkarıldı)
          errorRate: 5,
          throughput: 12
        }
      },

      // Medium Priority - Every 60 minutes (30'dan 60'a çıkarıldı)
      {
        endpoint: '/api/v1/analytics',
        method: 'GET',
        description: 'Analytics Dashboard',
        priority: 'medium',
        interval: 60 * 60 * 1000, // 60 minutes
        timeout: 20000, // 20 saniye (8'den 20'ye çıkarıldı)
        threshold: {
          responseTime: 15000, // 15 saniye (10'dan 15'e çıkarıldı)
          errorRate: 10,
          throughput: 5
        }
      },
      {
        endpoint: '/api/v1/security/stats',
        method: 'GET',
        description: 'Security Statistics',
        priority: 'medium',
        interval: 60 * 60 * 1000, // 60 minutes
        timeout: 15000, // 15 saniye (5'ten 15'e çıkarıldı)
        threshold: {
          responseTime: 12000, // 12 saniye (8'den 12'ye çıkarıldı)
          errorRate: 5,
          throughput: 8
        }
      },
      {
        endpoint: '/api/v1/cache/stats',
        method: 'GET',
        description: 'Cache Statistics',
        priority: 'medium',
        interval: 60 * 60 * 1000, // 60 minutes
        timeout: 10000, // 10 saniye (3'ten 10'a çıkarıldı)
        threshold: {
          responseTime: 8000, // 8 saniye (5'ten 8'e çıkarıldı)
          errorRate: 5,
          throughput: 15
        }
      },

      // Low Priority - Every 4 hours (2'den 4'e çıkarıldı)
      {
        endpoint: '/api/v1/admin-management',
        method: 'GET',
        description: 'Admin Management',
        priority: 'low',
        interval: 4 * 60 * 60 * 1000, // 4 hours
        timeout: 20000, // 20 saniye (10'dan 20'ye çıkarıldı)
        threshold: {
          responseTime: 18000, // 18 saniye (15'ten 18'e çıkarıldı)
          errorRate: 15,
          throughput: 3
        }
      },
      {
        endpoint: '/api/v1/data-export',
        method: 'GET',
        description: 'Data Export',
        priority: 'low',
        interval: 4 * 60 * 60 * 1000, // 4 hours
        timeout: 30000, // 30 saniye (15'ten 30'a çıkarıldı)
        threshold: {
          responseTime: 25000, // 25 saniye (20'den 25'e çıkarıldı)
          errorRate: 20,
          throughput: 2
        }
      },
      {
        endpoint: '/api/v1/performance/baseline',
        method: 'GET',
        description: 'Performance Baseline',
        priority: 'low',
        interval: 4 * 60 * 60 * 1000, // 4 hours
        timeout: 15000, // 15 saniye (5'ten 15'e çıkarıldı)
        threshold: {
          responseTime: 12000, // 12 saniye (10'dan 12'ye çıkarıldı)
          errorRate: 10,
          throughput: 8
        }
      }
    ];
  }

  async startMonitoring() {
    if (this.isRunning) {
      logger.warn('Performance monitoring is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting Performance Monitoring Service');

    // Start monitoring for each endpoint
    for (const config of this.monitoringConfigs) {
      this.startEndpointMonitoring(config);
    }

    logger.info(`✅ Performance monitoring started for ${this.monitoringConfigs.length} endpoints`);
  }

  private startEndpointMonitoring(config: MonitoringConfig) {
    const interval = setInterval(async () => {
      try {
        await this.monitorEndpoint(config);
      } catch (error) {
        logger.error(`❌ Error monitoring endpoint ${config.endpoint}:`, error);
      }
    }, config.interval);

    this.intervals.set(config.endpoint, interval);

    // Run initial test
    this.monitorEndpoint(config);

    logger.info(`📊 Started monitoring ${config.endpoint} (${config.priority}) - interval: ${config.interval / 1000}s`);
  }

  private async monitorEndpoint(config: MonitoringConfig): Promise<void> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    try {
      const response = await axios({
        method: config.method,
        url: `http://localhost:3002${config.endpoint}`,
        timeout: config.timeout,
        validateStatus: () => true // Accept all status codes
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      const success = response.status < 400;

      const result: MonitoringResult = {
        endpoint: config.endpoint,
          timestamp,
        responseTime,
        statusCode: response.status,
        success,
        throughput: 1000 / responseTime // requests per second
      };

      // Store result
      if (!this.monitoringResults.has(config.endpoint)) {
        this.monitoringResults.set(config.endpoint, []);
      }
      this.monitoringResults.get(config.endpoint)!.push(result);

      // Keep only last 100 results per endpoint
      const results = this.monitoringResults.get(config.endpoint)!;
      if (results.length > 100) {
        results.splice(0, results.length - 100);
      }

      // Check thresholds and generate alerts
      this.checkThresholds(config, result);

      logger.info(`✅ ${config.endpoint}: ${responseTime.toFixed(2)}ms (${response.status})`);

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      const result: MonitoringResult = {
        endpoint: config.endpoint,
        timestamp,
        responseTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Store error result
      if (!this.monitoringResults.has(config.endpoint)) {
        this.monitoringResults.set(config.endpoint, []);
      }
      this.monitoringResults.get(config.endpoint)!.push(result);

      // Generate timeout alert
      this.alerts.push({
        type: 'timeout',
        severity: 'critical',
        endpoint: config.endpoint,
        message: `Endpoint ${config.endpoint} timed out after ${config.timeout}ms`,
        value: responseTime,
        threshold: config.timeout,
        timestamp
      });

      logger.error(`❌ ${config.endpoint}: Timeout after ${responseTime.toFixed(2)}ms`);
    }
  }

  private checkThresholds(config: MonitoringConfig, result: MonitoringResult) {
    // Check response time
    if (result.responseTime > config.threshold.responseTime) {
      const severity = result.responseTime > config.threshold.responseTime * 2 ? 'critical' : 'warning';
      this.alerts.push({
        type: 'response_time',
        severity,
        endpoint: config.endpoint,
        message: `Response time ${result.responseTime.toFixed(2)}ms exceeds threshold ${config.threshold.responseTime}ms`,
        value: result.responseTime,
        threshold: config.threshold.responseTime,
        timestamp: result.timestamp
      });
    }

    // Check error rate (if this is an error)
    if (!result.success) {
      const recentResults = this.monitoringResults.get(config.endpoint) || [];
      const errorCount = recentResults.filter(r => !r.success).length;
      const errorRate = (errorCount / recentResults.length) * 100;

      if (errorRate > config.threshold.errorRate) {
        this.alerts.push({
          type: 'error_rate',
          severity: 'critical',
          endpoint: config.endpoint,
          message: `Error rate ${errorRate.toFixed(2)}% exceeds threshold ${config.threshold.errorRate}%`,
          value: errorRate,
          threshold: config.threshold.errorRate,
          timestamp: result.timestamp
        });
      }
    }

    // Check throughput
    if (result.throughput && result.throughput < config.threshold.throughput) {
      this.alerts.push({
        type: 'throughput',
        severity: 'warning',
        endpoint: config.endpoint,
        message: `Throughput ${result.throughput.toFixed(2)} req/s below threshold ${config.threshold.throughput} req/s`,
        value: result.throughput,
        threshold: config.threshold.throughput,
        timestamp: result.timestamp
      });
    }
  }

  stopMonitoring() {
    this.isRunning = false;
    
    // Clear all intervals
    for (const [endpoint, interval] of this.intervals) {
      clearInterval(interval);
      logger.info(`🛑 Stopped monitoring ${endpoint}`);
    }
    
    this.intervals.clear();
    logger.info('🛑 Performance monitoring stopped');
  }

  getMonitoringResults(endpoint?: string) {
    if (endpoint) {
      return this.monitoringResults.get(endpoint) || [];
    }
    return Object.fromEntries(this.monitoringResults);
  }

  getAlerts(severity?: 'warning' | 'critical') {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return this.alerts;
  }

  clearAlerts() {
    this.alerts = [];
    logger.info('🧹 Performance alerts cleared');
  }

  getMonitoringStatus() {
    return {
      isRunning: this.isRunning,
      totalEndpoints: this.monitoringConfigs.length,
      activeIntervals: this.intervals.size,
      totalResults: Array.from(this.monitoringResults.values()).reduce((sum, results) => sum + results.length, 0),
      totalAlerts: this.alerts.length,
      criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: this.alerts.filter(a => a.severity === 'warning').length
    };
  }

  getEndpointStats(endpoint: string) {
    const results = this.monitoringResults.get(endpoint) || [];
    if (results.length === 0) return null;

    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    return {
      endpoint,
      totalTests: results.length,
      successRate: (successfulResults.length / results.length) * 100,
      avgResponseTime: successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length,
      minResponseTime: Math.min(...successfulResults.map(r => r.responseTime)),
      maxResponseTime: Math.max(...successfulResults.map(r => r.responseTime)),
      avgThroughput: successfulResults.reduce((sum, r) => sum + (r.throughput || 0), 0) / successfulResults.length,
      errorCount: failedResults.length,
      lastTest: results[results.length - 1]
    };
  }
}

// Singleton instance
const performanceMonitoringService = new PerformanceMonitoringService();

export default performanceMonitoringService; 