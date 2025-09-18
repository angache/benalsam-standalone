import { Request, Response } from 'express';
import logger from '../config/logger';
import { redis } from '../config/redis';
import { supabase } from '../config/supabase';

interface ErrorContext {
  requestId?: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  stackTrace?: string;
  requestBody?: any;
  queryParams?: any;
  headers?: any;
  sessionId?: string;
  correlationId?: string;
}

interface ErrorMetrics {
  errorId: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  firstOccurrence: string;
  lastOccurrence: string;
  affectedEndpoints: string[];
  affectedUsers: string[];
  resolutionStatus: 'unresolved' | 'investigating' | 'resolved' | 'ignored';
  assignedTo?: string;
  notes?: string;
}

interface ErrorPattern {
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolve: boolean;
  notificationChannels: string[];
}

class EnhancedErrorTrackingService {
  private errorPatterns: ErrorPattern[] = [];
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private notificationChannels: string[] = ['log', 'redis', 'database'];

  constructor() {
    this.initializeErrorPatterns();
    this.loadErrorMetrics();
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      {
        pattern: 'ECONNREFUSED',
        description: 'Database connection refused',
        severity: 'critical',
        autoResolve: false,
        notificationChannels: ['log', 'redis', 'database']
      },
      {
        pattern: 'ENOTFOUND',
        description: 'DNS resolution failed',
        severity: 'high',
        autoResolve: false,
        notificationChannels: ['log', 'redis']
      },
      {
        pattern: 'ETIMEDOUT',
        description: 'Request timeout',
        severity: 'high',
        autoResolve: false,
        notificationChannels: ['log', 'redis']
      },
      {
        pattern: 'ValidationError',
        description: 'Input validation failed',
        severity: 'medium',
        autoResolve: true,
        notificationChannels: ['log']
      },
      {
        pattern: 'UnauthorizedError',
        description: 'Authentication failed',
        severity: 'medium',
        autoResolve: true,
        notificationChannels: ['log', 'redis']
      },
      {
        pattern: 'RateLimitError',
        description: 'Rate limit exceeded',
        severity: 'low',
        autoResolve: true,
        notificationChannels: ['log']
      },
      {
        pattern: 'PrismaClientKnownRequestError',
        description: 'Database query error',
        severity: 'high',
        autoResolve: false,
        notificationChannels: ['log', 'redis', 'database']
      },
      {
        pattern: 'JWT.*Error',
        description: 'JWT token error',
        severity: 'medium',
        autoResolve: true,
        notificationChannels: ['log', 'redis']
      }
    ];
  }

  async trackError(
    error: Error | string,
    context: ErrorContext = {},
    req?: Request,
    res?: Response
  ): Promise<string> {
    const errorId = this.generateErrorId();
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;
    
    // Enhance context with request data
    if (req) {
      context = {
        ...context,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestBody: this.sanitizeRequestBody(req.body),
        queryParams: req.query,
        headers: this.sanitizeHeaders(req.headers),
        sessionId: (req as any).sessionID,
        correlationId: req.get('X-Correlation-ID')
      };
    }

    // Classify error
    const classification = this.classifyError(errorMessage, context);
    
    // Create error record
    const errorRecord = {
      errorId,
      errorMessage,
      stackTrace,
      context,
      classification,
      timestamp: new Date().toISOString(),
      severity: classification.severity,
      pattern: classification.pattern
    };

    // Store error
    await this.storeError(errorRecord);
    
    // Update metrics
    await this.updateErrorMetrics(errorRecord);
    
    // Send notifications
    await this.sendNotifications(errorRecord);
    
    // Log error
    this.logError(errorRecord);

    return errorId;
  }

  private classifyError(errorMessage: string, context: ErrorContext): {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    pattern: string;
    description: string;
    autoResolve: boolean;
  } {
    // Find matching pattern
    const matchingPattern = this.errorPatterns.find(pattern => {
      const regex = new RegExp(pattern.pattern, 'i');
      return regex.test(errorMessage);
    });

    if (matchingPattern) {
      return {
        type: matchingPattern.pattern,
        severity: matchingPattern.severity,
        pattern: matchingPattern.pattern,
        description: matchingPattern.description,
        autoResolve: matchingPattern.autoResolve
      };
    }

    // Default classification based on context
    if (context.endpoint?.includes('/auth')) {
      return {
        type: 'AuthenticationError',
        severity: 'medium',
        pattern: 'AuthenticationError',
        description: 'Authentication related error',
        autoResolve: true
      };
    }

    if (context.endpoint?.includes('/api/')) {
      return {
        type: 'APIError',
        severity: 'high',
        pattern: 'APIError',
        description: 'API endpoint error',
        autoResolve: false
      };
    }

    return {
      type: 'UnknownError',
      severity: 'medium',
      pattern: 'UnknownError',
      description: 'Unclassified error',
      autoResolve: false
    };
  }

  private async storeError(errorRecord: any): Promise<void> {
    try {
      // Store in Redis for fast access
      const redisKey = `error:${errorRecord.errorId}`;
      await redis.setex(redisKey, 7 * 24 * 3600, JSON.stringify(errorRecord)); // 7 days

      // Store in database for persistence
      const { error } = await supabase
        .from('error_logs')
        .insert({
          error_id: errorRecord.errorId,
          error_message: errorRecord.errorMessage,
          stack_trace: errorRecord.stackTrace,
          context: errorRecord.context,
          classification: errorRecord.classification,
          severity: errorRecord.severity,
          pattern: errorRecord.pattern,
          created_at: errorRecord.timestamp
        });

      if (error) {
        logger.error('Failed to store error in database:', error);
      }
    } catch (error) {
      logger.error('Failed to store error:', error);
    }
  }

  private async updateErrorMetrics(errorRecord: any): Promise<void> {
    try {
      const pattern = errorRecord.classification.pattern;
      const existingMetrics = this.errorMetrics.get(pattern);

      if (existingMetrics) {
        existingMetrics.frequency += 1;
        existingMetrics.lastOccurrence = errorRecord.timestamp;
        
        // Update affected endpoints
        if (errorRecord.context.endpoint && !existingMetrics.affectedEndpoints.includes(errorRecord.context.endpoint)) {
          existingMetrics.affectedEndpoints.push(errorRecord.context.endpoint);
        }
        
        // Update affected users
        if (errorRecord.context.userId && !existingMetrics.affectedUsers.includes(errorRecord.context.userId)) {
          existingMetrics.affectedUsers.push(errorRecord.context.userId);
        }
      } else {
        this.errorMetrics.set(pattern, {
          errorId: errorRecord.errorId,
          errorType: pattern,
          severity: errorRecord.classification.severity,
          frequency: 1,
          firstOccurrence: errorRecord.timestamp,
          lastOccurrence: errorRecord.timestamp,
          affectedEndpoints: errorRecord.context.endpoint ? [errorRecord.context.endpoint] : [],
          affectedUsers: errorRecord.context.userId ? [errorRecord.context.userId] : [],
          resolutionStatus: 'unresolved'
        });
      }

      // Store metrics in Redis
      await redis.setex(`error:metrics:${pattern}`, 24 * 3600, JSON.stringify(this.errorMetrics.get(pattern)));
    } catch (error) {
      logger.error('Failed to update error metrics:', error);
    }
  }

  private async sendNotifications(errorRecord: any): Promise<void> {
    const pattern = this.errorPatterns.find(p => p.pattern === errorRecord.classification.pattern);
    if (!pattern) return;

    try {
      // Send to configured notification channels
      for (const channel of pattern.notificationChannels) {
        switch (channel) {
          case 'log':
            this.logErrorNotification(errorRecord);
            break;
          case 'redis':
            await this.sendRedisNotification(errorRecord);
            break;
          case 'database':
            await this.sendDatabaseNotification(errorRecord);
            break;
        }
      }
    } catch (error) {
      logger.error('Failed to send error notifications:', error);
    }
  }

  private logErrorNotification(errorRecord: any): void {
    const logLevel = this.getLogLevel(errorRecord.classification.severity);
    logger[logLevel]('Error notification', {
      errorId: errorRecord.errorId,
      errorMessage: errorRecord.errorMessage,
      severity: errorRecord.classification.severity,
      pattern: errorRecord.classification.pattern,
      endpoint: errorRecord.context.endpoint,
      method: errorRecord.context.method,
      userId: errorRecord.context.userId,
      ip: errorRecord.context.ip,
      timestamp: errorRecord.timestamp
    });
  }

  private async sendRedisNotification(errorRecord: any): Promise<void> {
    try {
      const notification = {
        type: 'error_alert',
        errorId: errorRecord.errorId,
        severity: errorRecord.classification.severity,
        pattern: errorRecord.classification.pattern,
        message: errorRecord.errorMessage,
        endpoint: errorRecord.context.endpoint,
        timestamp: errorRecord.timestamp
      };

      await redis.lpush('error:notifications', JSON.stringify(notification));
      await redis.ltrim('error:notifications', 0, 999); // Keep last 1000 notifications
    } catch (error) {
      logger.error('Failed to send Redis notification:', error);
    }
  }

  private async sendDatabaseNotification(errorRecord: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_notifications')
        .insert({
          error_id: errorRecord.errorId,
          severity: errorRecord.classification.severity,
          pattern: errorRecord.classification.pattern,
          message: errorRecord.errorMessage,
          endpoint: errorRecord.context.endpoint,
          created_at: errorRecord.timestamp
        });

      if (error) {
        logger.error('Failed to store error notification in database:', error);
      }
    } catch (error) {
      logger.error('Failed to send database notification:', error);
    }
  }

  private logError(errorRecord: any): void {
    const logLevel = this.getLogLevel(errorRecord.classification.severity);
    logger[logLevel]('Error tracked', {
      errorId: errorRecord.errorId,
      errorMessage: errorRecord.errorMessage,
      stackTrace: errorRecord.stackTrace,
      context: errorRecord.context,
      classification: errorRecord.classification,
      timestamp: errorRecord.timestamp
    });
  }

  private getLogLevel(severity: string): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'debug';
    }
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadErrorMetrics(): Promise<void> {
    try {
      const keys = await redis.keys('error:metrics:*');
      const metrics = await Promise.all(
        keys.map(async (key) => {
          const data = await redis.get(key);
          return data ? JSON.parse(data) : null;
        })
      );

      metrics.forEach(metric => {
        if (metric) {
          this.errorMetrics.set(metric.errorType, metric);
        }
      });
    } catch (error) {
      logger.error('Failed to load error metrics:', error);
    }
  }

  // Public methods
  async getErrorMetrics(): Promise<ErrorMetrics[]> {
    return Array.from(this.errorMetrics.values());
  }

  async getErrorById(errorId: string): Promise<any> {
    try {
      const data = await redis.get(`error:${errorId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get error by ID:', error);
      return null;
    }
  }

  async getRecentErrors(limit: number = 100): Promise<any[]> {
    try {
      const keys = await redis.keys('error:*');
      const errorKeys = keys.filter(key => key.startsWith('error:') && !key.includes('metrics') && !key.includes('notifications'));
      
      const errors = await Promise.all(
        errorKeys.slice(-limit).map(async (key) => {
          const data = await redis.get(key);
          return data ? JSON.parse(data) : null;
        })
      );

      return errors.filter(error => error !== null).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      logger.error('Failed to get recent errors:', error);
      return [];
    }
  }

  async getErrorNotifications(limit: number = 50): Promise<any[]> {
    try {
      const notifications = await redis.lrange('error:notifications', 0, limit - 1);
      return notifications.map(notification => JSON.parse(notification));
    } catch (error) {
      logger.error('Failed to get error notifications:', error);
      return [];
    }
  }

  async updateErrorResolutionStatus(pattern: string, status: 'unresolved' | 'investigating' | 'resolved' | 'ignored', assignedTo?: string, notes?: string): Promise<void> {
    try {
      const metrics = this.errorMetrics.get(pattern);
      if (metrics) {
        metrics.resolutionStatus = status;
        if (assignedTo) metrics.assignedTo = assignedTo;
        if (notes) metrics.notes = notes;

        await redis.setex(`error:metrics:${pattern}`, 24 * 3600, JSON.stringify(metrics));
        
        logger.info('Error resolution status updated', {
          pattern,
          status,
          assignedTo,
          notes
        });
      }
    } catch (error) {
      logger.error('Failed to update error resolution status:', error);
    }
  }

  getErrorPatterns(): ErrorPattern[] {
    return [...this.errorPatterns];
  }

  addErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.push(pattern);
    logger.info('New error pattern added', { pattern });
  }

  removeErrorPattern(pattern: string): void {
    this.errorPatterns = this.errorPatterns.filter(p => p.pattern !== pattern);
    logger.info('Error pattern removed', { pattern });
  }
}

// Create singleton instance
const enhancedErrorTrackingService = new EnhancedErrorTrackingService();

export default enhancedErrorTrackingService;
export { EnhancedErrorTrackingService, ErrorContext, ErrorMetrics, ErrorPattern };
