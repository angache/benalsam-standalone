import express from 'express';
import { rateLimit } from 'express-rate-limit';
import logger from '../config/logger';
import { categoryService } from '../services/categoryService';
import { searchService } from '../services/searchService';

const router = express.Router();

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

    const suggestions = [];

    // 1. Trending suggestions (always include)
    const trendingSuggestions = [
      {
        id: 'trending-1',
        text: 'iPhone 15 Pro',
        type: 'trending',
        score: 0.95,
        metadata: { trending: true }
      },
      {
        id: 'trending-2',
        text: 'MacBook Air M2',
        type: 'trending',
        score: 0.92,
        metadata: { trending: true }
      },
      {
        id: 'trending-3',
        text: 'Samsung Galaxy S24',
        type: 'trending',
        score: 0.89,
        metadata: { trending: true }
      }
    ];

    // 2. Popular search suggestions
    const popularSuggestions = [
      {
        id: 'popular-1',
        text: 'Araba',
        type: 'popular',
        score: 0.88,
        metadata: { searchCount: 1250 }
      },
      {
        id: 'popular-2',
        text: 'Ev',
        type: 'popular',
        score: 0.85,
        metadata: { searchCount: 980 }
      },
      {
        id: 'popular-3',
        text: 'Telefon',
        type: 'popular',
        score: 0.82,
        metadata: { searchCount: 756 }
      },
      {
        id: 'popular-4',
        text: 'Bilgisayar',
        type: 'popular',
        score: 0.79,
        metadata: { searchCount: 654 }
      },
      {
        id: 'popular-5',
        text: 'Mobilya',
        type: 'popular',
        score: 0.76,
        metadata: { searchCount: 543 }
      }
    ];

    // 3. Category-based suggestions
    let categorySuggestions = [];
    if (categoryId) {
      try {
        const categories = await categoryService.getCategories();
        const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));
        
        if (selectedCategory) {
          // Get subcategories as suggestions
          if (selectedCategory.subcategories) {
            categorySuggestions = selectedCategory.subcategories.slice(0, 5).map(subcat => ({
              id: `category-${subcat.id}`,
              text: subcat.name,
              type: 'category',
              score: 0.85,
              category: subcat,
              metadata: { 
                subcategoryCount: subcat.stats?.subcategoryCount || 0,
                attributeCount: subcat.stats?.attributeCount || 0
              }
            }));
          }
        }
      } catch (error) {
        logger.error('Error getting category suggestions:', error);
      }
    }

    // 4. Query-based suggestions
    let searchSuggestions = [];
    if (query && query.length > 0) {
      // Filter existing suggestions based on query
      const queryLower = query.toLowerCase();
      
      const filteredTrending = trendingSuggestions.filter(s => 
        s.text.toLowerCase().includes(queryLower)
      );
      
      const filteredPopular = popularSuggestions.filter(s => 
        s.text.toLowerCase().includes(queryLower)
      );

      const filteredCategory = categorySuggestions.filter(s => 
        s.text.toLowerCase().includes(queryLower)
      );

      // Add query-based suggestions
      searchSuggestions = [
        ...filteredTrending,
        ...filteredPopular,
        ...filteredCategory
      ];

      // Add exact match suggestions
      if (query.length > 2) {
        searchSuggestions.unshift({
          id: `search-exact-${Date.now()}`,
          text: query,
          type: 'search',
          score: 0.99,
          metadata: { exactMatch: true }
        });
      }
    }

    // Combine all suggestions
    let allSuggestions = [];

    if (query && query.length > 0) {
      // If there's a query, prioritize search suggestions
      allSuggestions = [
        ...searchSuggestions,
        ...trendingSuggestions.filter(s => !searchSuggestions.find(ss => ss.id === s.id)),
        ...popularSuggestions.filter(s => !searchSuggestions.find(ss => ss.id === s.id))
      ];
    } else if (categoryId) {
      // If there's a category, prioritize category suggestions
      allSuggestions = [
        ...categorySuggestions,
        ...trendingSuggestions,
        ...popularSuggestions
      ];
    } else {
      // Default: show trending and popular
      allSuggestions = [
        ...trendingSuggestions,
        ...popularSuggestions
      ];
    }

    // Limit results and remove duplicates
    const uniqueSuggestions = allSuggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.id === suggestion.id)
      )
      .slice(0, 10);

    logger.info(`🤖 Generated ${uniqueSuggestions.length} AI suggestions`);

    return res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        total: uniqueSuggestions.length,
        query: query || null,
        categoryId: categoryId || null,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ AI Suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'AI suggestions generation failed',
      error: 'AI_SUGGESTIONS_ERROR'
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/trending
 * @desc Get trending suggestions only
 * @access Public
 */
router.get('/trending', aiSuggestionsLimiter, async (req, res) => {
  try {
    const trendingSuggestions = [
      {
        id: 'trending-1',
        text: 'iPhone 15 Pro',
        type: 'trending',
        score: 0.95,
        metadata: { trending: true }
      },
      {
        id: 'trending-2',
        text: 'MacBook Air M2',
        type: 'trending',
        score: 0.92,
        metadata: { trending: true }
      },
      {
        id: 'trending-3',
        text: 'Samsung Galaxy S24',
        type: 'trending',
        score: 0.89,
        metadata: { trending: true }
      },
      {
        id: 'trending-4',
        text: 'PlayStation 5',
        type: 'trending',
        score: 0.86,
        metadata: { trending: true }
      },
      {
        id: 'trending-5',
        text: 'AirPods Pro',
        type: 'trending',
        score: 0.83,
        metadata: { trending: true }
      }
    ];

    return res.json({
      success: true,
      data: {
        suggestions: trendingSuggestions,
        total: trendingSuggestions.length,
        type: 'trending'
      }
    });

  } catch (error) {
    logger.error('❌ Trending suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Trending suggestions generation failed',
      error: 'TRENDING_SUGGESTIONS_ERROR'
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/popular
 * @desc Get popular search suggestions only
 * @access Public
 */
router.get('/popular', aiSuggestionsLimiter, async (req, res) => {
  try {
    const popularSuggestions = [
      {
        id: 'popular-1',
        text: 'Araba',
        type: 'popular',
        score: 0.88,
        metadata: { searchCount: 1250 }
      },
      {
        id: 'popular-2',
        text: 'Ev',
        type: 'popular',
        score: 0.85,
        metadata: { searchCount: 980 }
      },
      {
        id: 'popular-3',
        text: 'Telefon',
        type: 'popular',
        score: 0.82,
        metadata: { searchCount: 756 }
      },
      {
        id: 'popular-4',
        text: 'Bilgisayar',
        type: 'popular',
        score: 0.79,
        metadata: { searchCount: 654 }
      },
      {
        id: 'popular-5',
        text: 'Mobilya',
        type: 'popular',
        score: 0.76,
        metadata: { searchCount: 543 }
      }
    ];

    return res.json({
      success: true,
      data: {
        suggestions: popularSuggestions,
        total: popularSuggestions.length,
        type: 'popular'
      }
    });

  } catch (error) {
    logger.error('❌ Popular suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Popular suggestions generation failed',
      error: 'POPULAR_SUGGESTIONS_ERROR'
    });
  }
});

export default router;
