import { Request, Response, NextFunction } from 'express';
import performanceMonitoringService from '../services/performanceMonitoringService';
import logger from '../config/logger';

const performanceService = performanceMonitoringService;

export const performanceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  (req as any).startTime = Date.now();
  
  // N+1 Query Detection
  const originalJson = res.json;
  let queryCount = 0;
  
  res.json = function(data) {
    const responseTime = Date.now() - (req as any).startTime;
    
    // Detect potential N+1 queries
    if (queryCount > 10 && responseTime > 1000) {
      logger.warn('Potential N+1 query detected', {
        endpoint: req.path,
        method: req.method,
        responseTime,
        queryCount,
        userAgent: req.headers['user-agent']
      });
    }
    
    // Track performance metrics
    performanceService.trackAPIMetrics({
      endpoint: req.path,
      method: req.method,
      response_time: responseTime,
      status_code: res.statusCode,
      request_size: req.headers['content-length'] ? parseInt(req.headers['content-length'] as string) : 0,
      response_size: JSON.stringify(data).length,
      timestamp: new Date().toISOString(),
      query_count: queryCount
    }).catch((error: any) => {
      logger.error('Failed to track performance metrics:', error);
    });

    return originalJson.call(this, data);
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
  performanceService.trackAPIMetrics(errorMetrics).catch((trackError: any) => {
    logger.error('Failed to track error metrics:', trackError);
  });

  next(error);
}; 