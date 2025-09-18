import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Enterprise level database configuration - Supabase optimized
const databaseConfig = {
  // Connection pool settings - Supabase optimized
  pool: {
    min: 1,           // Minimum connections (Supabase managed)
    max: 10,          // Maximum connections (Supabase limit: 15)
    acquire: 30000,   // Connection acquire timeout (30s)
    idle: 5000,       // Connection idle timeout (5s)
    evict: 15000,     // Connection eviction interval (15s)
    createTimeoutMillis: 10000,  // Connection creation timeout (10s)
    destroyTimeoutMillis: 5000,  // Connection destruction timeout (5s)
    reapIntervalMillis: 1000,    // Connection reaping interval (1s)
    createRetryIntervalMillis: 200, // Connection retry interval (200ms)
  },
  
  // Query timeout settings
  query: {
    timeout: 20000,   // Query timeout (20s) - reduced for better UX
    slowQueryThreshold: 1000, // Slow query threshold (1s) - production ready
  },
  
  // Retry settings
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,  // Exponential backoff
  }
};

// Optimized Prisma client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Query performance monitoring
prisma.$on('query', (e) => {
  const queryTime = e.duration;
  
  if (queryTime > databaseConfig.query.slowQueryThreshold) {
    logger.warn('🐌 Slow database query detected', {
      query: e.query,
      params: e.params,
      duration: `${queryTime}ms`,
      target: databaseConfig.query.slowQueryThreshold
    });
  }
  
  // Log all queries in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database query executed', {
      query: e.query,
      params: e.params,
      duration: `${queryTime}ms`
    });
  }
});

// Error handling
prisma.$on('error', (e) => {
  logger.error('Database error occurred', {
    error: e.message,
    target: e.target,
    timestamp: new Date().toISOString()
  });
});

// Connection management
process.on('beforeExit', async () => {
  logger.info('Database connection pool shutting down...');
  await prisma.$disconnect();
});

// Health check function
export const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    // Simple health check
    await prisma.$executeRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Connection pool stats
export const getConnectionPoolStats = async () => {
  try {
    // Get actual connection pool information from Supabase
    const stats = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) FILTER (WHERE state = 'waiting') as waiting_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND pid != pg_backend_pid()`
    );
    
    const poolStats = stats[0] || {};
    
    return {
      total_connections: parseInt(poolStats.total_connections) || 0,
      active_connections: parseInt(poolStats.active_connections) || 0,
      idle_connections: parseInt(poolStats.idle_connections) || 0,
      idle_in_transaction: parseInt(poolStats.idle_in_transaction) || 0,
      waiting_connections: parseInt(poolStats.waiting_connections) || 0,
      pool_config: {
        min: databaseConfig.pool.min,
        max: databaseConfig.pool.max,
        acquire_timeout: databaseConfig.pool.acquire,
        idle_timeout: databaseConfig.pool.idle,
        evict_interval: databaseConfig.pool.evict
      },
      timestamp: new Date().toISOString(),
      note: 'Supabase connection pool with Prisma optimization'
    };
  } catch (error) {
    logger.error('Failed to get connection pool stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

export default prisma; 