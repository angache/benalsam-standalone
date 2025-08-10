// Environment-based configuration for admin-ui
export interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  environment: 'development' | 'production';
  elasticsearchUrl: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
  
  // Debug: Log environment variables
  console.log('🔧 Environment Variables:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  });
  const elasticsearchUrl = import.meta.env.VITE_ELASTICSEARCH_URL || 'http://localhost:9200';
  
  // Extract base URL for WebSocket
  const baseUrl = apiUrl.replace('/api/v1', '');
  const wsUrl = baseUrl.replace('http', 'ws');
  
  return {
    apiUrl: apiUrl, // Use full API URL with /api/v1
    wsUrl: wsUrl,
    environment: isProduction ? 'production' : 'development',
    elasticsearchUrl: elasticsearchUrl
  };
};

export const config = getEnvironmentConfig();

// Environment variables for Vite
export const VITE_CONFIG = {
  API_URL: config.apiUrl,
  WS_URL: config.wsUrl,
  ENVIRONMENT: config.environment,
  ELASTICSEARCH_URL: config.elasticsearchUrl
};

// Log configuration for debugging
console.log('🔧 Environment Config:', {
  environment: config.environment,
  apiUrl: config.apiUrl,
  elasticsearchUrl: config.elasticsearchUrl,
  hostname: window.location.hostname
}); 