import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import logger from '../config/logger';
import { redis } from '../config/redis';

interface APMMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
  requestSize?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  error?: string;
  queryCount?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

interface APMConfig {
  enableDetailedMetrics: boolean;
  enableMemoryTracking: boolean;
  enableCpuTracking: boolean;
  enableQueryTracking: boolean;
  enableCacheTracking: boolean;
  slowRequestThreshold: number; // ms
  errorThreshold: number; // ms
  maxMetricsHistory: number;
}

class APMMiddleware {
  private config: APMConfig;
  private metricsHistory: APMMetrics[] = [];
  private requestCounters: Map<string, number> = new Map();
  private errorCounters: Map<string, number> = new Map();
  private slowRequestCounters: Map<string, number> = new Map();

  constructor(config: Partial<APMConfig> = {}) {
    this.config = {
      enableDetailedMetrics: true,
      enableMemoryTracking: true,
      enableCpuTracking: true,
      enableQueryTracking: true,
      enableCacheTracking: true,
      slowRequestThreshold: 1000, // 1 second
      errorThreshold: 5000, // 5 seconds
      maxMetricsHistory: 1000,
      ...config
    };
  }

  // Main APM middleware
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    const startCpuUsage = this.config.enableCpuTracking ? process.cpuUsage() : undefined;
    const startMemoryUsage = this.config.enableMemoryTracking ? process.memoryUsage() : undefined;

    // Attach APM data to request
    (req as any).apm = {
      requestId,
      startTime,
      startCpuUsage,
      startMemoryUsage,
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // Track request start
    this.trackRequestStart(req, requestId);

    // Override res.json to capture response metrics
    const originalJson = res.json;
    res.json = (data: any) => {
      this.captureResponseMetrics(req, res, data, startTime, startCpuUsage, startMemoryUsage);
      return originalJson.call(res, data);
    };

    // Override res.end to capture response metrics for non-JSON responses
    const originalEnd = res.end;
    res.end = (chunk?: any, encoding?: any) => {
      this.captureResponseMetrics(req, res, chunk, startTime, startCpuUsage, startMemoryUsage);
      return originalEnd.call(res, chunk, encoding);
    };

    next();
  };

  // Error tracking middleware
  errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction): void => {
    const apmData = (req as any).apm;
    if (apmData) {
      const endTime = performance.now();
      const duration = endTime - apmData.startTime;

      const metrics: APMMetrics = {
        requestId: apmData.requestId,
        endpoint: req.path,
        method: req.method,
        startTime: apmData.startTime,
        endTime,
        duration,
        statusCode: res.statusCode || 500,
        responseSize: 0,
        requestSize: this.getRequestSize(req),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id,
        error: error.message || 'Unknown error',
        queryCount: apmData.queryCount || 0,
        cacheHits: apmData.cacheHits || 0,
        cacheMisses: apmData.cacheMisses || 0
      };

      if (this.config.enableMemoryTracking && apmData.startMemoryUsage) {
        metrics.memoryUsage = process.memoryUsage();
      }

      if (this.config.enableCpuTracking && apmData.startCpuUsage) {
        metrics.cpuUsage = process.cpuUsage(apmData.startCpuUsage);
      }

      // Track error metrics
      this.trackErrorMetrics(metrics);
      this.storeMetrics(metrics);
    }

    next(error);
  };

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackRequestStart(req: Request, requestId: string): void {
    const endpoint = `${req.method} ${req.path}`;
    const count = this.requestCounters.get(endpoint) || 0;
    this.requestCounters.set(endpoint, count + 1);

    logger.debug('APM: Request started', {
      requestId,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  private captureResponseMetrics(
    req: Request,
    res: Response,
    data: any,
    startTime: number,
    startCpuUsage?: NodeJS.CpuUsage,
    startMemoryUsage?: NodeJS.MemoryUsage
  ): void {
    const apmData = (req as any).apm;
    if (!apmData) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: APMMetrics = {
      requestId: apmData.requestId,
      endpoint: req.path,
      method: req.method,
      startTime,
      endTime,
      duration,
      statusCode: res.statusCode,
      responseSize: this.getResponseSize(data),
      requestSize: this.getRequestSize(req),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
      queryCount: apmData.queryCount || 0,
      cacheHits: apmData.cacheHits || 0,
      cacheMisses: apmData.cacheMisses || 0
    };

    if (this.config.enableMemoryTracking && startMemoryUsage) {
      metrics.memoryUsage = process.memoryUsage();
    }

    if (this.config.enableCpuTracking && startCpuUsage) {
      metrics.cpuUsage = process.cpuUsage(startCpuUsage);
    }

    // Check for slow requests
    if (duration > this.config.slowRequestThreshold) {
      this.trackSlowRequest(metrics);
    }

    // Store metrics
    this.storeMetrics(metrics);

    // Log performance metrics
    this.logPerformanceMetrics(metrics);
  }

  private trackErrorMetrics(metrics: APMMetrics): void {
    const endpoint = `${metrics.method} ${metrics.endpoint}`;
    const count = this.errorCounters.get(endpoint) || 0;
    this.errorCounters.set(endpoint, count + 1);

    logger.warn('APM: Error tracked', {
      requestId: metrics.requestId,
      endpoint: metrics.endpoint,
      method: metrics.method,
      statusCode: metrics.statusCode,
      duration: metrics.duration,
      error: metrics.error,
      timestamp: new Date().toISOString()
    });
  }

  private trackSlowRequest(metrics: APMMetrics): void {
    const endpoint = `${metrics.method} ${metrics.endpoint}`;
    const count = this.slowRequestCounters.get(endpoint) || 0;
    this.slowRequestCounters.set(endpoint, count + 1);

    logger.warn('APM: Slow request detected', {
      requestId: metrics.requestId,
      endpoint: metrics.endpoint,
      method: metrics.method,
      duration: metrics.duration,
      threshold: this.config.slowRequestThreshold,
      queryCount: metrics.queryCount,
      timestamp: new Date().toISOString()
    });
  }

  private storeMetrics(metrics: APMMetrics): void {
    // Store in memory (circular buffer)
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.config.maxMetricsHistory) {
      this.metricsHistory.shift();
    }

    // Store in Redis for persistence (async, non-blocking)
    this.storeMetricsInRedis(metrics).catch(error => {
      logger.error('Failed to store APM metrics in Redis:', error);
    });
  }

  private async storeMetricsInRedis(metrics: APMMetrics): Promise<void> {
    try {
      const key = `apm:metrics:${metrics.requestId}`;
      const ttl = 3600; // 1 hour

      await redis.setex(key, ttl, JSON.stringify(metrics));

      // Update aggregated metrics
      await this.updateAggregatedMetrics(metrics);
    } catch (error) {
      logger.error('Redis APM storage error:', error);
    }
  }

  private async updateAggregatedMetrics(metrics: APMMetrics): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = new Date().getHours();
      const endpoint = `${metrics.method} ${metrics.endpoint}`;

      // Daily aggregated metrics
      const dailyKey = `apm:daily:${date}:${endpoint}`;
      await redis.hincrby(dailyKey, 'count', 1);
      await redis.hincrby(dailyKey, 'totalDuration', Math.round(metrics.duration || 0));
      await redis.hincrby(dailyKey, 'totalQueries', metrics.queryCount || 0);
      await redis.hincrby(dailyKey, 'cacheHits', metrics.cacheHits || 0);
      await redis.hincrby(dailyKey, 'cacheMisses', metrics.cacheMisses || 0);
      await redis.expire(dailyKey, 7 * 24 * 3600); // 7 days

      // Hourly aggregated metrics
      const hourlyKey = `apm:hourly:${date}:${hour}:${endpoint}`;
      await redis.hincrby(hourlyKey, 'count', 1);
      await redis.hincrby(hourlyKey, 'totalDuration', Math.round(metrics.duration || 0));
      await redis.expire(hourlyKey, 24 * 3600); // 24 hours

      // Error tracking
      if (metrics.statusCode && metrics.statusCode >= 400) {
        const errorKey = `apm:errors:${date}:${endpoint}`;
        await redis.hincrby(errorKey, metrics.statusCode.toString(), 1);
        await redis.expire(errorKey, 7 * 24 * 3600); // 7 days
      }
    } catch (error) {
      logger.error('Aggregated metrics update error:', error);
    }
  }

  private logPerformanceMetrics(metrics: APMMetrics): void {
    if (this.config.enableDetailedMetrics) {
      // Prometheus endpoint'lerini log'dan hariç tut
      const isPrometheusEndpoint = metrics.endpoint.includes('/prometheus') || 
                                   metrics.endpoint.includes('/metrics') ||
                                   metrics.endpoint.includes('/monitoring/prometheus');
      
      if (!isPrometheusEndpoint) {
        logger.info('APM: Request completed', {
          requestId: metrics.requestId,
          endpoint: metrics.endpoint,
          method: metrics.method,
          statusCode: metrics.statusCode,
          duration: metrics.duration,
          responseSize: metrics.responseSize,
          queryCount: metrics.queryCount,
          cacheHits: metrics.cacheHits,
          cacheMisses: metrics.cacheMisses,
          memoryUsage: metrics.memoryUsage,
          cpuUsage: metrics.cpuUsage,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  private getRequestSize(req: Request): number {
    const contentLength = req.get('Content-Length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    return 0;
  }

  private getResponseSize(data: any): number {
    if (data === null || data === undefined) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  // Public methods for metrics retrieval
  async getMetricsSummary(): Promise<any> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();

      // Get daily metrics
      const dailyKeys = await redis.keys(`apm:daily:${today}:*`);
      const dailyMetrics = await Promise.all(
        dailyKeys.map(async (key) => {
          const endpoint = key.split(':').slice(3).join(':');
          const metrics = await redis.hgetall(key);
          return {
            endpoint,
            count: parseInt(metrics.count || '0'),
            totalDuration: parseInt(metrics.totalDuration || '0'),
            totalQueries: parseInt(metrics.totalQueries || '0'),
            cacheHits: parseInt(metrics.cacheHits || '0'),
            cacheMisses: parseInt(metrics.cacheMisses || '0'),
            avgDuration: parseInt(metrics.totalDuration || '0') / Math.max(parseInt(metrics.count || '1'), 1)
          };
        })
      );

      // Get hourly metrics
      const hourlyKeys = await redis.keys(`apm:hourly:${today}:${currentHour}:*`);
      const hourlyMetrics = await Promise.all(
        hourlyKeys.map(async (key) => {
          const endpoint = key.split(':').slice(4).join(':');
          const metrics = await redis.hgetall(key);
          return {
            endpoint,
            count: parseInt(metrics.count || '0'),
            totalDuration: parseInt(metrics.totalDuration || '0'),
            avgDuration: parseInt(metrics.totalDuration || '0') / Math.max(parseInt(metrics.count || '1'), 1)
          };
        })
      );

      // Get error metrics
      const errorKeys = await redis.keys(`apm:errors:${today}:*`);
      const errorMetrics = await Promise.all(
        errorKeys.map(async (key) => {
          const endpoint = key.split(':').slice(3).join(':');
          const errors = await redis.hgetall(key);
          return {
            endpoint,
            errors: Object.entries(errors).map(([statusCode, count]) => ({
              statusCode: parseInt(statusCode),
              count: parseInt(count as string)
            }))
          };
        })
      );

      return {
        timestamp: now.toISOString(),
        daily: dailyMetrics,
        hourly: hourlyMetrics,
        errors: errorMetrics,
        memory: {
          requestCounters: Object.fromEntries(this.requestCounters),
          errorCounters: Object.fromEntries(this.errorCounters),
          slowRequestCounters: Object.fromEntries(this.slowRequestCounters)
        }
      };
    } catch (error) {
      logger.error('Failed to get APM metrics summary:', error);
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to retrieve metrics'
      };
    }
  }

  getRecentMetrics(limit: number = 100): APMMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  getConfig(): APMConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<APMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('APM configuration updated', { config: this.config });
  }
}

// Create singleton instance
const apmMiddleware = new APMMiddleware();

export default apmMiddleware;
export { APMMiddleware, APMMetrics, APMConfig };
