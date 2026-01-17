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
  // Next.js environment detection
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging';

  // Check if we should use VPS services (override for local testing)
  // Set USE_VPS_SERVICES=true to use VPS even in development
  // Set USE_VPS_SERVICES=false to use local services even in production
  const useVpsServices = process.env.USE_VPS_SERVICES === 'true' || 
                         process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true' ||
                         (isProduction && process.env.USE_VPS_SERVICES !== 'false');

  // Check if we're running on VPS (by checking if we can access VPS IP)
  const isVPS = typeof window !== 'undefined' && (
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1'
  );

  // Production domain (VPS API domain)
  const PRODUCTION_DOMAIN = 'api.benalsam.com';

  return {
    // Supabase configuration (existing)
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys',
    },

    // Admin Backend configuration (new)
    // Use VPS if: production mode OR USE_VPS_SERVICES=true
    // Use local if: development mode AND USE_VPS_SERVICES not set to true
    adminApi: {
      url: useVpsServices
        ? `https://${PRODUCTION_DOMAIN}/api/v1/admin`
        : (process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || 'http://localhost:3002/api/v1'),
      wsUrl: useVpsServices
        ? `wss://${PRODUCTION_DOMAIN}`
        : (process.env.NEXT_PUBLIC_ADMIN_BACKEND_WS_URL || (process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api/v1', '') || 'ws://localhost:3002')),
    },

    // Environment detection
    isDevelopment,
    isProduction,
    isVPS,
    isStaging,

    // Feature flags
    features: {
      enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' || isProduction,
      enableAdminFeatures: process.env.NEXT_PUBLIC_ENABLE_ADMIN_FEATURES !== 'false',
      enableAnalyticsCharts: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_CHARTS !== 'false',
      enableBulkOperations: process.env.NEXT_PUBLIC_ENABLE_BULK_OPERATIONS !== 'false',
    },

    // Performance & Monitoring
    monitoring: {
      enablePerformanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true' || isProduction,
      enableErrorTracking: isProduction,
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
      const useVps = process.env.USE_VPS_SERVICES === 'true' || 
                     process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true';
      console.log('🔧 Environment Config:', {
        environment: config.isProduction ? 'production' : config.isStaging ? 'staging' : 'development',
        adminApiUrl: config.adminApi.url,
        adminWsUrl: config.adminApi.wsUrl,
        supabaseUrl: config.supabase.url,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        useVpsServices: useVps ? '✅ VPS' : '❌ Local',
        features: config.features,
        monitoring: config.monitoring,
      });
      console.log('🌐 API Source:', useVps ? 'VPS (api.benalsam.com)' : 'Local (localhost)');
    }
  },
};

// Log environment info in development
if (typeof window !== 'undefined') {
  env.logEnvironment();
  
  // Browser console'da kullanım için window object'e ekle
  (window as any).checkApiSource = () => {
    const useVps = config.adminApi.url.includes('api.benalsam.com');
    console.log('🔍 API Source Check:');
    console.log('===================');
    console.log('📍 Admin API URL:', config.adminApi.url);
    console.log('📍 WebSocket URL:', config.adminApi.wsUrl);
    console.log('🌐 Source:', useVps ? '✅ VPS (api.benalsam.com)' : '❌ Local (localhost)');
    console.log('🔧 Environment:', config.isProduction ? 'Production' : 'Development');
    console.log('===================');
    return {
      url: config.adminApi.url,
      wsUrl: config.adminApi.wsUrl,
      isVps: useVps,
      environment: config.isProduction ? 'production' : 'development'
    };
  };
  
  (window as any).getApiConfig = () => config;
}

export default config; 