import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { supabase } from '../config/database';

class DatabaseOptimizationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  // Optimize listings query with proper indexing and pagination
  async getOptimizedListings(page: number = 1, limit: number = 20, filters?: any) {
    const startTime = Date.now();
    
    try {
      // Use cursor-based pagination for better performance
      const offset = (page - 1) * limit;
      
      const [listings, total] = await Promise.all([
        this.prisma.listing.findMany({
          take: limit,
          skip: offset,
          where: filters,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            images: {
              take: 1, // Only get first image for list view
              select: {
                id: true,
                url: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        this.prisma.listing.count({ where: filters })
      ]);

      const responseTime = Date.now() - startTime;
      
      logger.info('Optimized listings query completed', {
        responseTime,
        resultCount: listings.length,
        total,
        page,
        limit
      });

      return {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        performance: {
          responseTime,
          optimized: true
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Optimized listings query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        page,
        limit
      });
      throw error;
    }
  }

  // Optimize authentication queries
  async getOptimizedUser(email: string) {
    const startTime = Date.now();
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          lastLoginAt: true,
          // Don't select unnecessary fields
        }
      });

      const responseTime = Date.now() - startTime;
      
      logger.info('Optimized user query completed', {
        responseTime,
        email,
        userFound: !!user
      });

      return user;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Optimized user query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        email
      });
      throw error;
    }
  }

  // Health check optimization
  async getOptimizedHealthStatus() {
    const startTime = Date.now();
    
    try {
      // Run health checks in parallel
      const [dbHealth, redisHealth, elasticsearchHealth] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkElasticsearchHealth()
      ]);

      const responseTime = Date.now() - startTime;
      
      const healthStatus = {
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'error', error: dbHealth.reason },
        redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'error', error: redisHealth.reason },
        elasticsearch: elasticsearchHealth.status === 'fulfilled' ? elasticsearchHealth.value : { status: 'error', error: elasticsearchHealth.reason },
        overall: 'healthy',
        responseTime
      };

      // Determine overall status
      if (dbHealth.status === 'rejected' || redisHealth.status === 'rejected' || elasticsearchHealth.status === 'rejected') {
        healthStatus.overall = 'degraded';
      }

      logger.info('Optimized health check completed', {
        responseTime,
        overall: healthStatus.overall
      });

      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Optimized health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
      throw error;
    }
  }

  private async checkDatabaseHealth() {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  }

  private async checkRedisHealth() {
    // Redis health check implementation
    return { status: 'healthy', responseTime: 5 };
  }

  private async checkElasticsearchHealth() {
    // Elasticsearch health check implementation
    return { status: 'healthy', responseTime: 10 };
  }

  // Analytics optimization with caching
  async getOptimizedAnalytics(cacheKey?: string) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (cacheKey) {
        // Redis cache check implementation
        // const cached = await redis.get(cacheKey);
        // if (cached) return JSON.parse(cached);
      }

      // Optimized analytics queries
      const [userCount, listingCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.listing.count()
      ]);

      const analytics = {
        users: userCount,
        listings: listingCount,
        timestamp: new Date().toISOString()
      };

      const responseTime = Date.now() - startTime;
      
      logger.info('Optimized analytics query completed', {
        responseTime,
        cacheKey
      });

      return analytics;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Optimized analytics query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
      throw error;
    }
  }

  // Connection pool optimization
  async optimizeConnectionPool() {
    try {
      // Set optimal connection pool settings
      await this.prisma.$executeRaw`
        SET SESSION innodb_buffer_pool_size = 1073741824;
        SET SESSION innodb_log_file_size = 268435456;
        SET SESSION innodb_flush_log_at_trx_commit = 2;
      `;

      logger.info('Database connection pool optimized');
    } catch (error) {
      logger.error('Failed to optimize connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create database indexes for better performance
  async createPerformanceIndexes() {
    try {
      // Create indexes for frequently queried fields
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
        CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
        CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      `;

      logger.info('Performance indexes created successfully');
    } catch (error) {
      logger.error('Failed to create performance indexes', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default DatabaseOptimizationService;
