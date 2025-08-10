import { Request, Response } from 'express';
import { searchService, SearchParams } from '../services/searchService';
import searchCacheService from '../services/searchCacheService';
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

      logger.info('Search request:', searchParams);

      const result = await searchService.searchListings(searchParams, sessionId);

      return res.status(200).json({
        success: true,
        data: result.data,
        totalCount: result.totalCount,
        searchEngine: result.searchEngine,
        responseTime: result.responseTime,
        cached: result.cached,
        pagination: result.pagination,
        metadata: result.metadata
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

      const suggestions = await searchService.getSuggestions(q);

      return res.status(200).json({
        success: true,
        data: suggestions
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
      const analytics = await searchService.getAnalytics();

      return res.status(200).json({
        success: true,
        data: analytics
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
      const health = await searchService.healthCheck();

      return res.status(200).json({
        success: true,
        data: health,
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
      // TODO: Implement reindex functionality
      logger.info('Reindex request received');

      return res.status(200).json({
        success: true,
        message: 'Reindex operation started',
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