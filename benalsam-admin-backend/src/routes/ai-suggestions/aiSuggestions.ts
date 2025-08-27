// ===========================
// MAIN AI SUGGESTIONS ROUTER
// ===========================

import express from 'express';
import { rateLimit } from 'express-rate-limit';
import logger from '../../config/logger';

// Services
import ElasticsearchSuggestionsService from './services/ElasticsearchSuggestionsService';
import CategorySuggestionsService from './services/CategorySuggestionsService';
import TrendingSuggestionsService from './services/TrendingSuggestionsService';
import PopularSuggestionsService from './services/PopularSuggestionsService';

// Utils
import { mergeSuggestions } from './utils/suggestionProcessor';

// Types
import { SuggestionResponse } from './types';

const router = express.Router();

// Initialize services
const elasticsearchService = new ElasticsearchSuggestionsService();
const categoryService = new CategorySuggestionsService();
const trendingService = new TrendingSuggestionsService();
const popularService = new PopularSuggestionsService();

// Rate limiting for AI suggestions
const aiSuggestionsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many AI suggestions requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route GET /api/v1/ai-suggestions
 * @desc Get AI-powered suggestions based on query and context
 * @access Public
 */
router.get('/', aiSuggestionsLimiter, async (req, res) => {
  try {
    const { q: query, categoryId } = req.query;
    
    logger.info('🤖 AI Suggestions request:', { query, categoryId });

    let suggestions = [];

    // 1. Query-based suggestions from Elasticsearch (if query provided)
    if (query) {
      try {
        const esSuggestions = await elasticsearchService.getSuggestions(query as string);
        suggestions.push(...esSuggestions);
      } catch (error) {
        logger.error('Error getting ES suggestions:', error);
      }
    }

    // 2. Category-based suggestions if categoryId provided
    if (categoryId) {
      try {
        const categorySuggestions = await categoryService.getSuggestions(parseInt(categoryId as string));
        suggestions.push(...categorySuggestions);
      } catch (error) {
        logger.error('Error getting category AI suggestions:', error);
      }
    }

    // 3. Trending suggestions - get from database (fallback)
    if (suggestions.length < 5) {
      const trendingSuggestions = await trendingService.getSuggestions(query as string);
      suggestions.push(...trendingSuggestions);
    }

    // 4. Popular suggestions - get from database (fallback)
    if (suggestions.length < 10) {
      const popularSuggestions = await popularService.getSuggestions(query as string);
      suggestions.push(...popularSuggestions);
    }

    // Merge and process all suggestions
    const uniqueSuggestions = mergeSuggestions(
      suggestions.filter(s => s.type === 'elasticsearch'),
      suggestions.filter(s => s.type === 'category'),
      suggestions.filter(s => s.type === 'trending'),
      suggestions.filter(s => s.type === 'popular')
    );

    const response: SuggestionResponse = {
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        total: uniqueSuggestions.length,
        query: query || null,
        source: query ? 'hybrid' : 'database'
      }
    };

    res.json(response);

  } catch (error: any) {
    logger.error('❌ Error in AI suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'AI suggestions service error',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/trending
 * @desc Get trending AI suggestions
 * @access Public
 */
router.get('/trending', aiSuggestionsLimiter, async (req, res) => {
  try {
    logger.info('🔥 Trending AI suggestions request');

    const trendingSuggestions = await trendingService.getSuggestions();

    res.json({
      success: true,
      data: {
        suggestions: trendingSuggestions,
        total: trendingSuggestions.length
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in trending AI suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Trending suggestions service error',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/popular
 * @desc Get popular AI suggestions
 * @access Public
 */
router.get('/popular', aiSuggestionsLimiter, async (req, res) => {
  try {
    logger.info('⭐ Popular AI suggestions request');

    const popularSuggestions = await popularService.getSuggestions();

    res.json({
      success: true,
      data: {
        suggestions: popularSuggestions,
        total: popularSuggestions.length
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in popular AI suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Popular suggestions service error',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/stats
 * @desc Get AI suggestions statistics
 * @access Public
 */
router.get('/stats', aiSuggestionsLimiter, async (req, res) => {
  try {
    logger.info('📊 AI suggestions stats request');

    const [categoryStats, trendingStats, popularStats] = await Promise.all([
      categoryService.getSuggestionsStats(),
      trendingService.getTrendingStats(),
      popularService.getPopularStats()
    ]);

    res.json({
      success: true,
      data: {
        category: categoryStats,
        trending: trendingStats,
        popular: popularStats
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in AI suggestions stats:', error);
    res.status(500).json({
      success: false,
      message: 'AI suggestions stats service error',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
