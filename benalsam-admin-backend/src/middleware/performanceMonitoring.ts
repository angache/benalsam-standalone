import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitoringService } from '../services/performanceMonitoringService';
import logger from '../config/logger';

const performanceService = new PerformanceMonitoringService();

export const performanceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(data: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Track API metrics
    const apiMetrics = {
      endpoint: req.path,
      method: req.method,
      response_time: responseTime,
      status_code: res.statusCode,
      request_size: req.headers['content-length'] ? parseInt(req.headers['content-length'] as string) : 0,
      response_size: typeof data === 'string' ? data.length : JSON.stringify(data).length,
      timestamp: new Date().toISOString()
    };

    // Track metrics asynchronously (don't block response)
    performanceService.trackAPIMetrics(apiMetrics).catch(error => {
      logger.error('Failed to track API metrics:', error);
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

export const performanceMonitoringErrorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  const endTime = Date.now();
  const responseTime = endTime - (req as any).startTime || endTime;
  
  // Track error metrics
  const errorMetrics = {
    endpoint: req.path,
    method: req.method,
    response_time: responseTime,
    status_code: res.statusCode || 500,
    request_size: req.headers['content-length'] ? parseInt(req.headers['content-length'] as string) : 0,
    response_size: 0,
    timestamp: new Date().toISOString(),
    error: error.message || 'Unknown error'
  };

  // Track error metrics asynchronously
  performanceService.trackAPIMetrics(errorMetrics).catch(trackError => {
    logger.error('Failed to track error metrics:', trackError);
  });

  next(error);
}; 