import * as Sentry from '@sentry/node';
import { Express } from 'express';

export const initializeSentry = (app: Express) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Sentry'yi tamamen kapatmak için (manuel veya development'ta otomatik)
  if (process.env.DISABLE_SENTRY === 'true' || (isDevelopment && process.env.ENABLE_SENTRY_IN_DEV !== 'true')) {
    if (process.env.DISABLE_SENTRY === 'true') {
      console.log('🚫 Sentry disabled (DISABLE_SENTRY=true)');
    } else {
      console.log('🚫 Sentry disabled in development (set ENABLE_SENTRY_IN_DEV=true to enable)');
    }
    console.log('ℹ️  Sentry REST API is still available for Dashboard');
    return;
  }

  const sentryDsn = process.env.SENTRY_DSN || '';
  
  // DSN kontrolü
  if (!sentryDsn || sentryDsn === '') {
    console.warn('⚠️ SENTRY_DSN is not set. Sentry error tracking is disabled.');
    console.warn('⚠️ Please set SENTRY_DSN in your .env file to enable error tracking.');
    return;
  }
  
  // DSN format kontrolü
  if (!sentryDsn.startsWith('https://') || !sentryDsn.includes('@')) {
    console.error('❌ Invalid SENTRY_DSN format. Expected format: https://xxx@xxx.ingest.sentry.io/xxx');
    return;
  }
  
  // Sentry initialization
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    // Performance Monitoring - Development'ta kapat (spam önleme)
    tracesSampleRate: isDevelopment ? 0 : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
    profilesSampleRate: isDevelopment ? 0 : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
    // Debug mode - sadece SENTRY_DEBUG=true olduğunda açık
    debug: process.env.SENTRY_DEBUG === 'true',
    // Before send function to filter events
    beforeSend(event, hint) {
      // Log before sending for debugging (sadece SENTRY_DEBUG=true olduğunda)
      if (process.env.SENTRY_DEBUG === 'true') {
        console.log('📤 Sending event to Sentry:', event.exception?.values?.[0]?.value || event.message);
      }
      
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Filter out 404 errors for static files
      if (event.exception?.values?.[0]?.value?.includes('ENOENT')) {
        return null;
      }
      
      // Filter out network errors in development (ECONNRESET, ETIMEDOUT) - normal davranış
      if (isDevelopment) {
        const errorMessage = event.exception?.values?.[0]?.value || '';
        if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ETIMEDOUT')) {
          // Development'ta network hatalarını ignore et (normal davranış)
          return null;
        }
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
  console.log(`📡 Sentry DSN: ${sentryDsn.substring(0, 20)}...`);
};

export const captureException = (error: Error, context?: any) => {
  // Log only if SENTRY_DEBUG is enabled
  if (process.env.SENTRY_DEBUG === 'true') {
    console.log('🔴 Capturing exception:', error.message);
    console.log('🔴 Error stack:', error.stack);
  }
  
  const eventId = Sentry.captureException(error, {
    extra: context,
    tags: {
      service: 'admin-backend',
      version: process.env.npm_package_version || '1.0.0',
    },
  });
  
  // Log only if SENTRY_DEBUG is enabled
  if (process.env.SENTRY_DEBUG === 'true') {
    console.log('✅ Exception captured with event ID:', eventId);
  }
  
  // Flush to ensure event is sent immediately (silent - no logging)
  Sentry.flush(2000).then(() => {
    if (process.env.SENTRY_DEBUG === 'true') {
      console.log('📤 Sentry flush completed');
    }
  }).catch((err) => {
    // Only log flush failures if debug is enabled
    if (process.env.SENTRY_DEBUG === 'true') {
      console.error('❌ Sentry flush failed:', err);
    }
  });
  
  return eventId;
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
