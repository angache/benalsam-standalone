/**
 * Environment Configuration
 * Centralized configuration for different environments
 */

export interface EnvironmentConfig {
  // Supabase configuration (existing)
  supabase: {
    url: string;
    anonKey: string;
  };

  // Admin Backend configuration (new)
  adminApi: {
    url: string;
    wsUrl: string;
  };

  // Environment detection
  isDevelopment: boolean;
  isProduction: boolean;
  isVPS: boolean;
  isStaging: boolean;

  // Feature flags
  features: {
    enableAnalytics: boolean;
    enableAdminFeatures: boolean;
    enableAnalyticsCharts: boolean;
    enableBulkOperations: boolean;
  };

  // Performance & Monitoring
  monitoring: {
    enablePerformanceMonitoring: boolean;
    enableErrorTracking: boolean;
    sentryDsn?: string;
  };
}

/**
 * Get environment configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = (import.meta as any).env?.DEV || false;
  const isProduction = (import.meta as any).env?.PROD || false;
  const isStaging = (import.meta as any).env?.VITE_STAGING === 'true';

  // Check if we're running on VPS (by checking if we can access VPS IP)
  const isVPS = typeof window !== 'undefined' && (
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1'
  );

  // Production domain (replace with your actual domain)
  const PRODUCTION_DOMAIN = 'your-domain.com';

  return {
    // Supabase configuration (existing)
    supabase: {
      url: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co',
      anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys',
    },

    // Admin Backend configuration (new)
    adminApi: {
      url: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002/api/v1',
      wsUrl: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3002',
    },

    // Environment detection
    isDevelopment,
    isProduction,
    isVPS,
    isStaging,

    // Feature flags
    features: {
      enableAnalytics: (import.meta as any).env?.VITE_ENABLE_ANALYTICS === 'true' || isProduction,
      enableAdminFeatures: (import.meta as any).env?.VITE_ENABLE_ADMIN_FEATURES !== 'false',
      enableAnalyticsCharts: (import.meta as any).env?.VITE_ENABLE_ANALYTICS_CHARTS !== 'false',
      enableBulkOperations: (import.meta as any).env?.VITE_ENABLE_BULK_OPERATIONS !== 'false',
    },

    // Performance & Monitoring
    monitoring: {
      enablePerformanceMonitoring: (import.meta as any).env?.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' || isProduction,
      enableErrorTracking: isProduction,
      sentryDsn: (import.meta as any).env?.VITE_SENTRY_DSN,
    },
  };
};

/**
 * Get current environment config
 */
export const config = getEnvironmentConfig();

/**
 * Environment-specific utilities
 */
export const env = {
  /**
   * Check if running in development
   */
  isDev: config.isDevelopment,

  /**
   * Check if running in production
   */
  isProd: config.isProduction,

  /**
   * Check if running on VPS
   */
  isVPS: config.isVPS,

  /**
   * Check if running in staging
   */
  isStaging: config.isStaging,

  /**
   * Get admin API URL
   */
  getAdminApiUrl: () => config.adminApi.url,

  /**
   * Get admin WebSocket URL
   */
  getAdminWsUrl: () => config.adminApi.wsUrl,

  /**
   * Get Supabase URL
   */
  getSupabaseUrl: () => config.supabase.url,

  /**
   * Get Supabase anon key
   */
  getSupabaseAnonKey: () => config.supabase.anonKey,

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled: (feature: keyof EnvironmentConfig['features']) => {
    return config.features[feature];
  },

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled: (type: keyof EnvironmentConfig['monitoring']) => {
    return config.monitoring[type];
  },

  /**
   * Log environment info (development only)
   */
  logEnvironment: () => {
    if (config.isDevelopment) {
      console.log('🔧 Environment Config:', {
        environment: config.isProduction ? 'production' : config.isStaging ? 'staging' : 'development',
        adminApiUrl: config.adminApi.url,
        adminWsUrl: config.adminApi.wsUrl,
        supabaseUrl: config.supabase.url,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        features: config.features,
        monitoring: config.monitoring,
      });
    }
  },
};

// Log environment info in development
if (typeof window !== 'undefined') {
  env.logEnvironment();
}

export default config; 