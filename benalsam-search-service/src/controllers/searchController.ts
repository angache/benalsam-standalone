import { Request, Response } from 'express';
import { searchService } from '../services/SearchService';
import { SearchParams } from '../types/search';
import logger from '../config/logger';

export class SearchController {
  /**
   * Search listings
   * POST /api/v1/search/listings
   */
  static async searchListings(req: Request, res: Response) {
    try {
      const {
        query,
        categories,
        categoryIds,
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
        categoryIds,
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

      logger.info('Search request received', {
        query: searchParams.query,
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        categories: searchParams.categories?.length || 0,
        categoryIds: searchParams.categoryIds?.length || 0
      });

      const result = await searchService.searchListings(searchParams);

      logger.info('Search completed', {
        total: result.total,
        responseTime: result.responseTime,
        cached: result.cached
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages
        },
        meta: {
          responseTime: result.responseTime,
          cached: result.cached,
          query: result.query,
          filters: result.filters
        }
      });

    } catch (error) {
      logger.error('Search error:', error);
      return res.status(500).json({
        success: false,
        message: 'Search operation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        } : undefined
      });
    }
  }

  /**
   * Get search suggestions
   * GET /api/v1/search/suggestions
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

      // For now, return empty suggestions
      // This would be implemented with actual suggestion logic
      const suggestions: string[] = [];

      return res.json({
        success: true,
        data: suggestions,
        query: q
      });

    } catch (error) {
      logger.error('Suggestions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get search statistics
   * GET /api/v1/search/stats
   */
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await searchService.getAnalytics();

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get search statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear search cache
   * POST /api/v1/search/cache/clear
   */
  static async clearCache(req: Request, res: Response) {
    try {
      // Cache is disabled for now
      return res.json({
        success: true,
        message: 'Search cache cleared successfully'
      });

    } catch (error) {
      logger.error('Clear cache error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear search cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Health check for search service
   * GET /api/v1/search/health
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      const health = await searchService.healthCheck();

      return res.json({
        success: true,
        data: {
          status: health.elasticsearch && health.supabase ? 'healthy' : 'degraded',
          elasticsearch: health.elasticsearch,
          redis: health.redis,
          supabase: health.supabase,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Health check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
