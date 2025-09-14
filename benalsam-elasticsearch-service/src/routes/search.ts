import { Router } from 'express';
import { elasticsearchService } from '../services/elasticsearchService';
import logger from '../config/logger';

const router = Router();

/**
 * @route   POST /search/listings
 * @desc    Search listings in Elasticsearch
 */
router.post('/listings', async (req, res) => {
  try {
    const { query, size = 10, from = 0, sort, filters } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString()
      });
    }

    const searchResult = await elasticsearchService.searchListings({
      query,
      size: parseInt(size),
      from: parseInt(from),
      sort,
      filters
    });

    res.json({
      success: true,
      data: searchResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Search error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.body.query
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /search/listings
 * @desc    Search listings with query parameters
 */
router.get('/listings', async (req, res) => {
  try {
    const { q, size = 10, from = 0, sort, status, category } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        timestamp: new Date().toISOString()
      });
    }

    // Build filters
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (category) {
      filters.category = category;
    }

    const searchResult = await elasticsearchService.searchListings({
      query: q as string,
      size: parseInt(size as string),
      from: parseInt(from as string),
      sort: sort as string,
      filters
    });

    res.json({
      success: true,
      data: searchResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Search error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query.q
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /search/listings/:id
 * @desc    Get specific listing by ID
 */
router.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await elasticsearchService.getListingById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: listing,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Get listing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /search/stats
 * @desc    Get search statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await elasticsearchService.getSearchStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Get search stats error:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
