/**
 * Database Configuration
 * 
 * @fileoverview Database connection configuration for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { databaseCircuitBreaker } from '../utils/circuitBreaker';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create Supabase client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database connection status
let isConnected = false;

/**
 * Test database connection with circuit breaker protection
 */
export async function testConnection(): Promise<boolean> {
  return await databaseCircuitBreaker.execute(async () => {
    const { error } = await supabase
      .from('listings')
      .select('count')
      .limit(1);

    if (error) {
      logger.error('❌ Database connection test failed:', error);
      throw new Error(`Database connection test failed: ${error.message}`);
    }

    logger.info('✅ Database connection test successful');
    return true;
  }, 'database-connection-test');
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  try {
    logger.info('🔌 Connecting to database...');
    
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection test failed');
    }
    
    isConnected = true;
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Get database connection status
 */
export function getConnectionStatus(): boolean {
  return isConnected;
}

/**
 * Health check for database with circuit breaker metrics
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    responseTime: number;
    error?: string;
  };
  circuitBreaker: {
    state: string;
    failureCount: number;
    isHealthy: boolean;
  };
}> {
  const startTime = Date.now();
  const circuitBreakerMetrics = databaseCircuitBreaker.getMetrics();
  
  try {
    const connected = await testConnection();
    const responseTime = Date.now() - startTime;
    
    return {
      status: connected ? 'healthy' : 'unhealthy',
      details: {
        connected,
        responseTime
      },
      circuitBreaker: {
        state: circuitBreakerMetrics.state,
        failureCount: circuitBreakerMetrics.failureCount,
        isHealthy: circuitBreakerMetrics.isHealthy
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      circuitBreaker: {
        state: circuitBreakerMetrics.state,
        failureCount: circuitBreakerMetrics.failureCount,
        isHealthy: circuitBreakerMetrics.isHealthy
      }
    };
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    // Supabase client doesn't need explicit disconnection
    // It manages connections automatically
    logger.info('✅ Database disconnected gracefully', { service: 'listing-service' });
  } catch (error) {
    logger.error('❌ Error disconnecting from database:', error, { service: 'listing-service' });
  }
}
