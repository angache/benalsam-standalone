import { Request, Response } from 'express';
import { AdminElasticsearchService } from '../services/elasticsearchService';
import logger from '../config/logger';

const elasticsearchService = new AdminElasticsearchService();

export class ElasticsearchController {
  /**
   * Get all indices
   */
  async getIndices(req: Request, res: Response) {
    try {
      const indices = await elasticsearchService.getIndices();
      res.json({
        success: true,
        data: indices,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to get indices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get indices',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Search documents in an index
   */
  async searchDocuments(req: Request, res: Response) {
    try {
      const { index } = req.params;
      const { query, size = 10, from = 0 } = req.query;
      
      if (!index) {
        return res.status(400).json({
        success: false,
          error: 'Index name is required',
          timestamp: new Date().toISOString()
        });
      }

      const searchQuery = query && typeof query === 'string' ? query : '*';
      const searchSize = parseInt(size as string) || 10;
      const searchFrom = parseInt(from as string) || 0;

      const results = await elasticsearchService.searchDocuments(
        index,
        searchQuery,
        searchSize,
        searchFrom
      );
      
      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to search documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search documents',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(req: Request, res: Response) {
    try {
      const { index, id } = req.params;
      
      if (!index || !id) {
        return res.status(400).json({
          success: false,
          error: 'Index name and document ID are required',
          timestamp: new Date().toISOString()
        });
      }

      const document = await elasticsearchService.getDocument(index, id);
      
      res.json({
        success: true,
        data: document,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to get document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(req: Request, res: Response) {
    try {
      const { index } = req.params;
      
      if (!index) {
        return res.status(400).json({
          success: false,
          error: 'Index name is required',
          timestamp: new Date().toISOString()
        });
      }

      const stats = await elasticsearchService.getIndexStatsForIndex(index);
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to get index stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get index stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Reindex an index
   */
  async reindex(req: Request, res: Response) {
    try {
      const { index } = req.params;
      
      if (!index) {
        return res.status(400).json({
        success: false,
          error: 'Index name is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await elasticsearchService.reindexIndex(index);
      
      res.json({
        success: true,
        data: result,
        message: `Index ${index} reindexed successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to reindex:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reindex',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(req: Request, res: Response) {
    try {
      const { index } = req.params;
      
      if (!index) {
        return res.status(400).json({
        success: false,
          error: 'Index name is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await elasticsearchService.deleteIndexByName(index);
      
      res.json({
        success: true,
        data: result,
        message: `Index ${index} deleted successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Failed to delete index:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete index',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
} 

export const elasticsearchController = new ElasticsearchController(); 