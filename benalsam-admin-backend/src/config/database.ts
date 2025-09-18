import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Enterprise level database configuration
const databaseConfig = {
  // Connection pool settings
  pool: {
    min: 2,           // Minimum connections
    max: 20,          // Maximum connections (production için)
    acquire: 60000,   // Connection acquire timeout (60s)
    idle: 10000,      // Connection idle timeout (10s)
    evict: 30000,     // Connection eviction interval (30s)
  },
  
  // Query timeout settings
  query: {
    timeout: 30000,   // Query timeout (30s)
    slowQueryThreshold: 500, // Slow query threshold (0.5s) - baseline için geçici
  },
  
  // Retry settings
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
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
    await prisma.$queryRaw`SELECT 1`;
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
    // Get connection pool information
    const stats = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    return {
      ...(stats as any)[0],
      timestamp: new Date().toISOString()
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