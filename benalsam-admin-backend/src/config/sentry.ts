import * as Sentry from '@sentry/node';
import { Express } from 'express';

export const initializeSentry = (app: Express) => {
  // Sentry initialization
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Before send function to filter events
    beforeSend(event) {
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Filter out 404 errors for static files
      if (event.exception?.values?.[0]?.value?.includes('ENOENT')) {
        return null;
      }
      
      return event;
    },
    // Error sampling
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Maximum breadcrumbs
    maxBreadcrumbs: 50,
    // Attach stack traces
    attachStacktrace: true,
    // Send default PII
    sendDefaultPii: false,
  });

  console.log('✅ Sentry initialized successfully');
};

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      service: 'admin-backend',
      version: process.env.npm_package_version || '1.0.0',
    },
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: any) => {
  Sentry.captureMessage(message, {
    level,
    extra: context,
    tags: {
      service: 'admin-backend',
      version: process.env.npm_package_version || '1.0.0',
    },
  });
};

export const setUser = (user: { id: string; email?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.role,
  });
};

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const setContext = (name: string, context: any) => {
  Sentry.setContext(name, context);
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

// Simple error handler
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  Sentry.captureException(err);
  next(err);
};

export default Sentry;
