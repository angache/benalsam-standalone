import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Son 1000 metrik tut

  // Response time tracking
  trackResponseTime(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;
    const self = this; // Store reference to 'this'

    // Response interceptor
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      const metric: PerformanceMetrics = {
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      // Add to metrics
      self.addMetric(metric);

      // Log slow responses
      if (responseTime > 1000) {
        logger.warn('🐌 Slow API response detected', {
          endpoint: req.path,
          method: req.method,
          responseTime: `${responseTime}ms`,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }

      // Call original send
      return originalSend.call(this, body);
    };

    next();
  }

  // Add metric to collection
  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestEndpoint: null,
        fastestEndpoint: null,
        errorRate: 0,
        recentMetrics: []
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    
    // Slowest endpoint
    const slowestEndpoint = this.metrics.reduce((slowest, current) => 
      current.responseTime > slowest.responseTime ? current : slowest
    );

    // Fastest endpoint
    const fastestEndpoint = this.metrics.reduce((fastest, current) => 
      current.responseTime < fastest.responseTime ? current : fastest
    );

    // Error rate (4xx, 5xx)
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Recent metrics (last 10)
    const recentMetrics = this.metrics.slice(-10);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowestEndpoint: {
        endpoint: slowestEndpoint.endpoint,
        method: slowestEndpoint.method,
        responseTime: slowestEndpoint.responseTime,
        timestamp: slowestEndpoint.timestamp
      },
      fastestEndpoint: {
        endpoint: fastestEndpoint.endpoint,
        method: fastestEndpoint.method,
        responseTime: fastestEndpoint.responseTime,
        timestamp: fastestEndpoint.timestamp
      },
      errorRate: Math.round(errorRate * 100) / 100,
      recentMetrics
    };
  }

  // Get endpoint-specific stats
  getEndpointStats(endpoint: string) {
    const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) {
      return null;
    }

    const totalRequests = endpointMetrics.length;
    const averageResponseTime = endpointMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = endpointMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    return {
      endpoint,
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      minResponseTime: Math.min(...endpointMetrics.map(m => m.responseTime)),
      maxResponseTime: Math.max(...endpointMetrics.map(m => m.responseTime))
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
    logger.info('🧹 Performance metrics cleared');
  }

  // Get all metrics (for export)
  getAllMetrics() {
    return this.metrics;
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Middleware function
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  performanceMonitor.trackResponseTime(req, res, next);
};

// Export functions
export const getPerformanceStats = () => performanceMonitor.getPerformanceStats();
export const getEndpointStats = (endpoint: string) => performanceMonitor.getEndpointStats(endpoint);
export const clearPerformanceMetrics = () => performanceMonitor.clearMetrics();
export const getAllPerformanceMetrics = () => performanceMonitor.getAllMetrics();

export default performanceMonitor;
