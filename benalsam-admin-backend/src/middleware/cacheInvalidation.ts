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

export interface InvalidationOptions {
  patterns?: string[];
  namespaces?: string[];
  keyGenerator?: (req: Request) => string[];
}

/**
 * Cache invalidation middleware
 * 
 * This middleware automatically invalidates cache entries when data is modified
 */
export function cacheInvalidation(options: InvalidationOptions = {}) {
  const {
    patterns = [],
    namespaces = [],
    keyGenerator = defaultKeyGenerator
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Intercept the response to invalidate cache after successful operations
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only invalidate cache for successful operations
      if (data && data.success === true) {
        // Invalidate cache asynchronously (don't wait)
        invalidateCache(req, patterns, namespaces, keyGenerator).catch(error => {
          logger.error('Cache invalidation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            patterns,
            namespaces
          });
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Default key generator for cache invalidation
 */
function defaultKeyGenerator(req: Request): string[] {
  const method = req.method.toLowerCase();
  const path = req.path;
  
  // Generate patterns based on the request
  const patterns: string[] = [];
  
  // Add method-specific patterns
  if (method === 'put' || method === 'patch') {
    // For updates, invalidate the specific resource and list endpoints
    patterns.push(`get:${path}`);
    patterns.push(`get:${path.split('/').slice(0, -1).join('/')}`);
  } else if (method === 'delete') {
    // For deletes, invalidate the specific resource and list endpoints
    patterns.push(`get:${path}`);
    patterns.push(`get:${path.split('/').slice(0, -1).join('/')}`);
  } else if (method === 'post') {
    // For creates, invalidate list endpoints
    patterns.push(`get:${path.split('/').slice(0, -1).join('/')}`);
  }
  
  return patterns;
}

/**
 * Invalidate cache entries
 */
async function invalidateCache(
  req: Request,
  patterns: string[],
  namespaces: string[],
  keyGenerator: (req: Request) => string[]
): Promise<void> {
  try {
    const generatedPatterns = keyGenerator(req);
    const allPatterns = [...patterns, ...generatedPatterns];
    
    // Invalidate cache for each namespace and pattern combination
    for (const namespace of namespaces) {
      for (const pattern of allPatterns) {
        try {
          await makeCacheServiceRequest('POST', '/clear', {});
          logger.debug('Cache invalidated', {
            pattern,
            namespace,
            endpoint: req.path,
            method: req.method
          });
        } catch (error) {
          logger.warn('Cache invalidation failed for pattern', { pattern, error });
        }
      }
    }
  } catch (error) {
    logger.error('Cache invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      patterns,
      namespaces
    });
  }
}

/**
 * Cache invalidation presets
 */
export const invalidationPresets = {
  // Invalidate listings cache
  listings: {
    patterns: ['get:/api/v1/listings*'],
    namespaces: ['listings']
  },
  
  // Invalidate users cache
  users: {
    patterns: ['get:/api/v1/users*'],
    namespaces: ['users']
  },
  
  // Invalidate admin users cache
  adminUsers: {
    patterns: ['get:/api/v1/admin/users*'],
    namespaces: ['admin-users']
  },
  
  // Invalidate analytics cache
  analytics: {
    patterns: ['get:/api/v1/analytics*'],
    namespaces: ['analytics']
  },
  
  // Invalidate all caches
  all: {
    patterns: ['*'],
    namespaces: ['listings', 'users', 'admin-users', 'analytics']
  }
};
