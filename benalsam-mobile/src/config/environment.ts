// Environment configuration for mobile app
export const environment = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Admin Backend
  ADMIN_BACKEND_URL: process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL || 'http://localhost:3002',
  
  // Elasticsearch (via admin-backend)
  ELASTICSEARCH_ENABLED: process.env.EXPO_PUBLIC_ELASTICSEARCH_ENABLED === 'true',
  
  // Development
  IS_DEV: __DEV__,
  
  // API Endpoints
  API_ENDPOINTS: {
    ELASTICSEARCH_SEARCH: '/api/v1/elasticsearch/search',
    ELASTICSEARCH_SUGGESTIONS: '/api/v1/elasticsearch/suggestions',
    ELASTICSEARCH_POPULAR: '/api/v1/elasticsearch/popular',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${environment.ADMIN_BACKEND_URL}${endpoint}`;
}; 