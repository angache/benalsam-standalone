/**
 * Monitoring & Analytics System
 * Centralized monitoring for production environment
 */

import { env } from '@/config/environment';

// Performance monitoring
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

// Error tracking
export interface ErrorEvent {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
  };
  tags?: Record<string, string>;
}

// Analytics events
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
  };
  timestamp?: number;
}

/**
 * Monitoring Service
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized = false;
  private performanceMetrics: PerformanceMetric[] = [];
  private errorEvents: ErrorEvent[] = [];
  private analyticsEvents: AnalyticsEvent[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize monitoring
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Initialize Sentry if enabled
    if (env.isMonitoringEnabled('enableErrorTracking') && env.getSupabaseUrl()) {
      this.initializeSentry();
    }

    // Initialize performance monitoring
    if (env.isMonitoringEnabled('enablePerformanceMonitoring')) {
      this.initializePerformanceMonitoring();
    }

    // Initialize analytics
    if (env.isFeatureEnabled('enableAnalytics')) {
      this.initializeAnalytics();
    }

    this.isInitialized = true;
    console.log('🔍 Monitoring system initialized');
  }

  /**
   * Initialize Sentry error tracking
   */
  private initializeSentry(): void {
    try {
      // Dynamic import to avoid bundle bloat
      import('@sentry/react').then((Sentry) => {
        Sentry.init({
          dsn: 'your-sentry-dsn', // Replace with actual DSN
          environment: env.isProd ? 'production' : env.isStaging ? 'staging' : 'development',
          tracesSampleRate: env.isProd ? 0.1 : 1.0,
        });

        console.log('✅ Sentry initialized');
      });
    } catch (error) {
      console.warn('⚠️ Failed to initialize Sentry:', error);
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPerformanceMetric({
              name: entry.name,
              value: entry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
              tags: {
                type: entry.entryType,
                url: window.location.href,
              },
            });
          }
        });

        observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
        console.log('✅ Performance monitoring initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize performance monitoring:', error);
      }
    }
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): void {
    // Initialize Google Analytics or other analytics service
    console.log('✅ Analytics initialized');
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);

    // Send to monitoring service
    if (env.isMonitoringEnabled('enablePerformanceMonitoring')) {
      this.sendPerformanceMetric(metric);
    }

    // Keep only last 100 metrics in memory
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  /**
   * Record error event
   */
  recordError(error: Error | string, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      user: this.getCurrentUser(),
      tags: {
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    this.errorEvents.push(errorEvent);

    // Send to Sentry if enabled
    if (env.isMonitoringEnabled('enableErrorTracking')) {
      this.sendErrorToSentry(errorEvent);
    }

    // Keep only last 50 errors in memory
    if (this.errorEvents.length > 50) {
      this.errorEvents = this.errorEvents.slice(-50);
    }
  }

  /**
   * Record analytics event
   */
  recordAnalyticsEvent(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      user: this.getCurrentUser(),
      timestamp: Date.now(),
    };

    this.analyticsEvents.push(analyticsEvent);

    // Send to analytics service
    if (env.isFeatureEnabled('enableAnalytics')) {
      this.sendAnalyticsEvent(analyticsEvent);
    }

    // Keep only last 100 events in memory
    if (this.analyticsEvents.length > 100) {
      this.analyticsEvents = this.analyticsEvents.slice(-100);
    }
  }

  /**
   * Send performance metric to monitoring service
   */
  private async sendPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Send to your monitoring endpoint
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  /**
   * Send error to Sentry
   */
  private async sendErrorToSentry(errorEvent: ErrorEvent): Promise<void> {
    try {
      const { captureException, setUser, setTag } = await import('@sentry/react');
      
      if (errorEvent.user) {
        setUser(errorEvent.user);
      }

      if (errorEvent.tags) {
        Object.entries(errorEvent.tags).forEach(([key, value]) => {
          setTag(key, value);
        });
      }

      captureException(new Error(errorEvent.message), {
        contexts: errorEvent.context,
      });
    } catch (error) {
      console.warn('Failed to send error to Sentry:', error);
    }
  }

  /**
   * Send analytics event
   */
  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  /**
   * Get current user info
   */
  private getCurrentUser(): { id?: string; email?: string } {
    // Get user info from auth service or localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          id: user.id,
          email: user.email,
        };
      } catch (error) {
        console.warn('Failed to parse user from localStorage:', error);
      }
    }
    return {};
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get error events
   */
  getErrorEvents(): ErrorEvent[] {
    return [...this.errorEvents];
  }

  /**
   * Get analytics events
   */
  getAnalyticsEvents(): AnalyticsEvent[] {
    return [...this.analyticsEvents];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.performanceMetrics = [];
    this.errorEvents = [];
    this.analyticsEvents = [];
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Initialize monitoring on module load
if (typeof window !== 'undefined') {
  monitoringService.initialize();
} 