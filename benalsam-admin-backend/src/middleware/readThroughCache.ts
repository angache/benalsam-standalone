import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../config/logger';

const CACHE_SERVICE_URL = process.env['CACHE_SERVICE_URL'] || 'http://localhost:3014';

/**
 * Cache Service'e istek yapmak için helper function
 */
async function makeCacheServiceRequest(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  try {
    const url = `${CACHE_SERVICE_URL}/api/v1/cache${endpoint}`;
    
    const config = {
      method,
      url,
      ...(data && { data }),
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    logger.error('Cache Service request failed:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  cacheCondition?: (data: any) => boolean;
}

/**
 * Read-through cache middleware
 * 
 * This middleware implements the read-through cache pattern:
 * 1. Check cache first
 * 2. If cache miss, execute the original handler
 * 3. Store the result in cache
 * 4. Return the result
 */
export function readThroughCache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    namespace = 'api',
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    cacheCondition = () => true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache if condition is met
    if (skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get from cache first
      const cachedResult = await makeCacheServiceRequest('POST', '/get', { key: cacheKey });
      
      if (cachedResult.success && cachedResult.data !== null) {
        logger.debug('Cache hit', {
          key: cacheKey,
          namespace,
          endpoint: req.path,
          method: req.method
        });
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': ttl.toString()
        });
        
        return res.json(cachedResult.data);
      }

      logger.debug('Cache miss', {
        key: cacheKey,
        namespace,
        endpoint: req.path,
        method: req.method
      });

      // Cache miss - intercept the response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Check if we should cache this response
        if (cacheCondition(data)) {
          // Store in cache asynchronously (don't wait)
          makeCacheServiceRequest('POST', '/set', { key: cacheKey, data, ttl }).catch(error => {
            logger.error('Cache set failed', {
              key: cacheKey,
              namespace,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          });
        }

        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': ttl.toString()
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', {
        key: cacheKey,
        namespace,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Default cache key generator
 * Creates a key based on method, path, and query parameters
 */
function defaultKeyGenerator(req: Request): string {
  const method = req.method.toLowerCase();
  const path = req.path;
  const query = req.query;
  
  // Sort query parameters for consistent keys
  const sortedQuery = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const queryString = sortedQuery ? `?${sortedQuery}` : '';
  
  return `${method}:${path}${queryString}`;
}

/**
 * Cache key generator for user-specific data
 */
export function userSpecificKeyGenerator(req: Request): string {
  const userId = (req as any).user?.id || 'anonymous';
  const method = req.method.toLowerCase();
  const path = req.path;
  const query = req.query;
  
  const sortedQuery = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const queryString = sortedQuery ? `?${sortedQuery}` : '';
  
  return `user:${userId}:${method}:${path}${queryString}`;
}

/**
 * Cache key generator for admin-specific data
 */
export function adminSpecificKeyGenerator(req: Request): string {
  const adminId = (req as any).user?.id || 'anonymous';
  const method = req.method.toLowerCase();
  const path = req.path;
  const query = req.query;
  
  const sortedQuery = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const queryString = sortedQuery ? `?${sortedQuery}` : '';
  
  return `admin:${adminId}:${method}:${path}${queryString}`;
}

/**
 * Skip cache for write operations
 */
export function skipWriteOperations(req: Request): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

/**
 * Skip cache for admin operations
 */
export function skipAdminOperations(req: Request): boolean {
  return req.path.includes('/admin/') || req.path.includes('/moderate');
}

/**
 * Only cache successful responses
 */
export function onlyCacheSuccess(data: any): boolean {
  return data && data.success === true;
}

/**
 * Cache configuration presets
 */
export const cachePresets = {
  // Short-term cache for frequently accessed data
  shortTerm: {
    ttl: 60, // 1 minute
    namespace: 'short'
  },
  
  // Medium-term cache for moderately accessed data
  mediumTerm: {
    ttl: 300, // 5 minutes
    namespace: 'medium'
  },
  
  // Long-term cache for rarely changing data
  longTerm: {
    ttl: 1800, // 30 minutes
    namespace: 'long'
  },
  
  // User-specific cache
  userSpecific: {
    ttl: 300,
    namespace: 'user',
    keyGenerator: userSpecificKeyGenerator
  },
  
  // Admin-specific cache
  adminSpecific: {
    ttl: 300,
    namespace: 'admin',
    keyGenerator: adminSpecificKeyGenerator
  },
  
  // Read-only cache (skips write operations)
  readOnly: {
    ttl: 300,
    namespace: 'readonly',
    skipCache: skipWriteOperations
  }
};
