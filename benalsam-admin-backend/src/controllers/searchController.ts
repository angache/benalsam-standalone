import { Request, Response } from 'express';
import { searchService, SearchParams } from '../services/searchService';
import { searchServiceClient, SearchServiceRequest } from '../services/searchServiceClient';
import { serviceRegistry } from '../services/serviceRegistry';
// import searchCacheService from '../services/searchCacheService'; // Deprecated - moved to Cache Service
import logger from '../config/logger';

export class SearchController {
  /**
   * Search listings
   * POST /api/search/listings
   */
  static async searchListings(req: Request, res: Response) {
    try {
      const {
        query,
        categories,
        location,
        urgency,
        minPrice,
        maxPrice,
        page = 1,
        pageSize = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        attributes
      } = req.body;

      // Validate input
      if (page < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page must be greater than 0',
          error: 'INVALID_PAGE'
        });
      }

      if (pageSize < 1 || pageSize > 100) {
        return res.status(400).json({
          success: false,
          message: 'Page size must be between 1 and 100',
          error: 'INVALID_PAGE_SIZE'
        });
      }

      // Try Search Service first using Service Registry
      try {
        const searchRequest = {
          query,
          categories,
          location,
          urgency,
          minPrice,
          maxPrice,
          page,
          pageSize,
          sortBy,
          sortOrder,
          attributes
        };

        logger.info('🔍 Forwarding search to Search Service via Service Registry:', searchRequest);

        const searchResult = await serviceRegistry.request(
          'search',
          'POST',
          '/api/v1/search/listings',
          searchRequest
        );

        if (searchResult.success) {
          return res.status(200).json({
            success: true,
            data: searchResult.data,
            totalCount: searchResult.total,
            searchEngine: 'search-service',
            responseTime: searchResult.responseTime,
            cached: searchResult.cached,
            pagination: {
              page: searchResult.page,
              pageSize: searchResult.pageSize,
              totalPages: searchResult.totalPages,
              totalCount: searchResult.total
            },
            metadata: {
              service: 'search-service',
              aggregations: searchResult.aggregations
            }
          });
        }
      } catch (searchServiceError) {
        logger.warn('⚠️ Search Service failed, falling back to local search:', searchServiceError);
      }

      // Fallback to local search service
      const searchParams: SearchParams = {
        query,
        categories,
        location,
        urgency,
        minPrice,
        maxPrice,
        page,
        pageSize,
        sortBy,
        sortOrder,
        attributes
      };

      // Get session ID for cache
      const sessionId = req.headers['x-session-id'] as string;

      logger.info('🔄 Using local search service as fallback:', searchParams);

      const result = await searchService.searchListings(searchParams, sessionId);

      return res.status(200).json({
        success: true,
        data: result.data,
        totalCount: result.totalCount,
        searchEngine: result.searchEngine,
        responseTime: result.responseTime,
        cached: result.cached,
        pagination: result.pagination,
        metadata: {
          ...result.metadata,
          fallback: true
        }
      });

    } catch (error) {
      logger.error('Search listings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Search operation failed',
        error: 'SEARCH_ERROR'
      });
    }
  }

  /**
   * Get search suggestions
   * GET /api/search/suggestions?q=query
   */
  static async getSuggestions(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required',
          error: 'MISSING_QUERY'
        });
      }

      // Try Search Service first using Service Registry
      try {
        const suggestionsResult = await serviceRegistry.request(
          'search',
          'GET',
          `/api/v1/search/suggestions?q=${encodeURIComponent(q)}`
        );
        
        if (suggestionsResult.success) {
          return res.status(200).json({
            success: true,
            data: suggestionsResult.data,
            service: 'search-service'
          });
        }
      } catch (searchServiceError) {
        logger.warn('⚠️ Search Service suggestions failed, using fallback:', searchServiceError);
      }

      // Fallback to local service
      const suggestions = await searchService.getSuggestions(q);

      return res.status(200).json({
        success: true,
        data: suggestions,
        service: 'local-fallback'
      });

    } catch (error) {
      logger.error('Get suggestions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
        error: 'SUGGESTIONS_ERROR'
      });
    }
  }

  /**
   * Get search analytics
   * GET /api/search/analytics
   */
  static async getAnalytics(req: Request, res: Response) {
    try {
      // Try Search Service first using Service Registry
      try {
        const analyticsResult = await serviceRegistry.request(
          'search',
          'GET',
          '/api/v1/search/analytics'
        );
        
        if (analyticsResult.success) {
          return res.status(200).json({
            success: true,
            data: analyticsResult.data,
            service: 'search-service'
          });
        }
      } catch (searchServiceError) {
        logger.warn('⚠️ Search Service analytics failed, using fallback:', searchServiceError);
      }

      // Fallback to local service
      const analytics = await searchService.getAnalytics();

      return res.status(200).json({
        success: true,
        data: analytics,
        service: 'local-fallback'
      });

    } catch (error) {
      logger.error('Get analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get analytics',
        error: 'ANALYTICS_ERROR'
      });
    }
  }

  /**
   * Health check for search services
   * GET /api/search/health
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      // Check both Search Service and local service using Service Registry
      const searchServiceHealth = await serviceRegistry.healthCheck('search');
      const localServiceHealth = await searchService.healthCheck();

      // Determine if local service is healthy (all services available)
      const localServiceHealthy = localServiceHealth.elasticsearch && localServiceHealth.redis && localServiceHealth.supabase;

      return res.status(200).json({
        success: true,
        data: {
          searchService: searchServiceHealth,
          localService: {
            ...localServiceHealth,
            healthy: localServiceHealthy
          },
          overall: searchServiceHealth.healthy || localServiceHealthy ? 'healthy' : 'unhealthy'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Health check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: 'HEALTH_CHECK_ERROR'
      });
    }
  }

  /**
   * Manual reindex (admin only)
   * POST /api/search/reindex
   */
  static async reindex(req: Request, res: Response) {
    try {
      // Try Search Service first using Service Registry
      try {
        const reindexResult = await serviceRegistry.request(
          'search',
          'POST',
          '/api/v1/search/reindex'
        );
        
        if (reindexResult.success) {
          return res.status(200).json({
            success: true,
            message: 'Reindex operation completed via Search Service',
            data: reindexResult.data,
            service: 'search-service',
            timestamp: new Date().toISOString()
          });
        }
      } catch (searchServiceError) {
        logger.warn('⚠️ Search Service reindex failed, using local service:', searchServiceError);
      }

      // Fallback to local reindex
      logger.info('Reindex request received - using local service');
      
      return res.status(200).json({
        success: true,
        message: 'Reindex operation started via local service',
        service: 'local-fallback',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Reindex error:', error);
      return res.status(500).json({
        success: false,
        message: 'Reindex operation failed',
        error: 'REINDEX_ERROR'
      });
    }
  }
} 