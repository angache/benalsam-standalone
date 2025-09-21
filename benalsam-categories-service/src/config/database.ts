import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Database configuration
const databaseConfig = {
  // Connection settings
  connection: {
    timeout: 20000,   // Connection timeout (20s)
    retries: 3,       // Max retries
    retryDelay: 1000, // Retry delay (1s)
  },
  
  // Query settings
  query: {
    timeout: 15000,   // Query timeout (15s)
    slowQueryThreshold: 1000, // Slow query threshold (1s)
  },
  
  // Health check settings
  healthCheck: {
    interval: 30000,  // Health check interval (30s)
    timeout: 5000,    // Health check timeout (5s)
  }
};

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    
    // Simple health check query
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      service: 'categories-service'
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'categories-service'
    });
    
    return {
      status: 'unhealthy',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      service: 'categories-service'
    };
  }
};

// Connection pool stats (Supabase managed)
export const getConnectionPoolStats = async () => {
  try {
    return {
      provider: 'supabase',
      managed: true,
      note: 'Supabase manages connection pooling automatically',
      timestamp: new Date().toISOString(),
      service: 'categories-service'
    };
  } catch (error) {
    logger.error('Failed to get connection pool stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'categories-service'
    });
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      service: 'categories-service'
    };
  }
};

export default supabase;
