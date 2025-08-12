import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { captureException } from '../config/sentry';

interface SecurityEvent {
  type: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'validation_failed';
  ip: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  details: any;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;
  private failedLoginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  // Track failed login attempts
  trackFailedLogin(ip: string, userAgent?: string) {
    const now = new Date();
    const existing = this.failedLoginAttempts.get(ip);
    
    if (existing) {
      // Reset if more than 15 minutes have passed
      if (now.getTime() - existing.lastAttempt.getTime() > 15 * 60 * 1000) {
        this.failedLoginAttempts.set(ip, { count: 1, lastAttempt: now });
      } else {
        existing.count++;
        existing.lastAttempt = now;
        this.failedLoginAttempts.set(ip, existing);
      }
    } else {
      this.failedLoginAttempts.set(ip, { count: 1, lastAttempt: now });
    }

    const attempt = this.failedLoginAttempts.get(ip);
    if (attempt && attempt.count >= 5) {
      this.logSecurityEvent({
        type: 'failed_login',
        ip,
        userAgent,
        endpoint: '/api/v1/auth/login',
        method: 'POST',
        timestamp: now,
        details: { failedAttempts: attempt.count }
      });

      // Alert if too many failed attempts
      if (attempt.count >= 10) {
        logger.error('🚨 SECURITY ALERT: Multiple failed login attempts', {
          ip,
          failedAttempts: attempt.count,
          userAgent
        });
        
        captureException(new Error(`Multiple failed login attempts from IP: ${ip}`), {
          extra: { ip, failedAttempts: attempt.count, userAgent }
        });
      }
    }
  }

  // Track suspicious activity
  trackSuspiciousActivity(req: Request, details: any) {
    this.logSecurityEvent({
      type: 'suspicious_activity',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      details
    });
  }

  // Track rate limit exceeded
  trackRateLimitExceeded(req: Request) {
    this.logSecurityEvent({
      type: 'rate_limit_exceeded',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      details: { rateLimit: 'exceeded' }
    });
  }

  // Track validation failures
  trackValidationFailure(req: Request, errors: any[]) {
    this.logSecurityEvent({
      type: 'validation_failed',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      details: { errors }
    });
  }

  // Log security event
  private logSecurityEvent(event: SecurityEvent) {
    this.events.push(event);
    
    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    logger.warn('🔒 Security Event', {
      type: event.type,
      ip: event.ip,
      endpoint: event.endpoint,
      method: event.method,
      details: event.details
    });
  }

  // Get security statistics
  getSecurityStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp > last24Hours);
    
    const stats = {
      totalEvents: this.events.length,
      eventsLast24Hours: recentEvents.length,
      failedLogins: recentEvents.filter(e => e.type === 'failed_login').length,
      suspiciousActivity: recentEvents.filter(e => e.type === 'suspicious_activity').length,
      rateLimitExceeded: recentEvents.filter(e => e.type === 'rate_limit_exceeded').length,
      validationFailures: recentEvents.filter(e => e.type === 'validation_failed').length,
      topSuspiciousIPs: this.getTopSuspiciousIPs(),
      recentEvents: recentEvents.slice(-10) // Last 10 events
    };

    return stats;
  }

  // Get top suspicious IPs
  private getTopSuspiciousIPs() {
    const ipCounts = new Map<string, number>();
    
    this.events.forEach(event => {
      const count = ipCounts.get(event.ip) || 0;
      ipCounts.set(event.ip, count + 1);
    });

    return Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  // Clear old events
  clearOldEvents() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    this.events = this.events.filter(event => event.timestamp > cutoff);
    
    // Clear old failed login attempts
    for (const [ip, attempt] of this.failedLoginAttempts.entries()) {
      if (attempt.lastAttempt < cutoff) {
        this.failedLoginAttempts.delete(ip);
      }
    }
  }
}

// Singleton instance
const securityMonitor = new SecurityMonitor();

// Middleware function
export const securityMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const userAgent = req.get('User-Agent');
  const ip = req.ip || 'unknown';
  
  // Suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];

  const isSuspiciousUserAgent = suspiciousPatterns.some(pattern => 
    userAgent && pattern.test(userAgent)
  );

  // Suspicious request patterns - daha spesifik ve doğru
  const suspiciousEndpoints = [
    /^\/wp-admin$/i,        // Sadece /wp-admin
    /^\/phpmyadmin$/i,      // Sadece /phpmyadmin  
    /^\/\.env$/i,           // Sadece /.env
    /^\/\.git/i,            // /.git ile başlayan
    /^\/\.sql$/i,           // Sadece /.sql
    /^\/admin$/i,           // Sadece /admin (API değil)
    /^\/wp-admin\/login$/i, // WordPress login
    /^\/phpmyadmin\/index\.php$/i, // PHPMyAdmin
  ];

  const isSuspiciousEndpoint = suspiciousEndpoints.some(pattern => 
    pattern.test(req.path)
  );

  // Log suspicious activity
  if (isSuspiciousUserAgent || isSuspiciousEndpoint) {
    securityMonitor.trackSuspiciousActivity(req, {
      suspiciousUserAgent: isSuspiciousUserAgent,
      suspiciousEndpoint: isSuspiciousEndpoint,
      userAgent,
      path: req.path
    });
  }

  next();
};

// Export functions
export const trackFailedLogin = (ip: string, userAgent?: string) => 
  securityMonitor.trackFailedLogin(ip, userAgent);

export const trackRateLimitExceeded = (req: Request) => 
  securityMonitor.trackRateLimitExceeded(req);

export const trackValidationFailure = (req: Request, errors: any[]) => 
  securityMonitor.trackValidationFailure(req, errors);

export const getSecurityStats = () => securityMonitor.getSecurityStats();
export const clearOldSecurityEvents = () => securityMonitor.clearOldEvents();

export default securityMonitor;
