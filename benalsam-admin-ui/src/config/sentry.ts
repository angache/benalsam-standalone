import * as Sentry from '@sentry/react';

export const initializeSentry = () => {
  // Sentry'yi tamamen kapatmak için
  if (import.meta.env.VITE_DISABLE_SENTRY === 'true') {
    console.log('🚫 Sentry disabled');
    return;
  }
  
  // Sentry initialization
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.npm_package_version || '1.0.0',
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Enable debug mode in development
    debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
    // Before send function to filter events
    beforeSend(event) {
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      return event;
    },
    // Error sampling
    sampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
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
      service: 'admin-ui',
      version: import.meta.env.npm_package_version || '1.0.0',
    },
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: any) => {
  Sentry.captureMessage(message, {
    level,
    extra: context,
    tags: {
      service: 'admin-ui',
      version: import.meta.env.npm_package_version || '1.0.0',
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

export default Sentry;
