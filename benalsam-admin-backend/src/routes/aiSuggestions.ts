import express from 'express';
import { rateLimit } from 'express-rate-limit';
import logger from '../config/logger';
import { categoryService } from '../services/categoryService';
import { searchService } from '../services/searchService';
import { supabase } from '../config/database';

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

    // 1. Trending suggestions - get from database
    const trendingSuggestions = await getTrendingSuggestions(query as string);

    // 2. Popular search suggestions - get from database
    const popularSuggestions = await getPopularSuggestions();

    // 3. Category-based suggestions if categoryId provided
    if (categoryId) {
      try {
        const categorySuggestions = await getCategoryAISuggestions(parseInt(categoryId as string));
        suggestions.push(...categorySuggestions);
      } catch (error) {
        logger.error('Error getting category AI suggestions:', error);
      }
    }

    // 4. Query-based suggestions if query provided
    if (query) {
      // Query-based suggestions will be implemented later
      // For now, return empty array
      const querySuggestions: any[] = [];
      suggestions.push(...querySuggestions);
    }

    // Combine all suggestions
    const allSuggestions = [
      ...suggestions,
      ...trendingSuggestions,
      ...popularSuggestions
    ];

    // Remove duplicates and limit results
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    ).slice(0, 20);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        total: uniqueSuggestions.length,
        query: query || null
      }
    });

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

    const trendingSuggestions = await getTrendingSuggestions();

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

    const popularSuggestions = await getPopularSuggestions();

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
 * Helper function to get category AI suggestions from database
 */
async function getCategoryAISuggestions(categoryId: number) {
  try {
    const { data: suggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_approved', true)
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Error fetching category AI suggestions:', error);
      return [];
    }

    return suggestions.map(suggestion => ({
      id: `category-ai-${suggestion.id}`,
      text: extractSuggestionText(suggestion),
      type: 'category' as const,
      score: suggestion.confidence_score,
      metadata: {
        suggestionType: suggestion.suggestion_type,
        isApproved: suggestion.is_approved
      }
    }));

  } catch (error) {
    logger.error('Error in getCategoryAISuggestions:', error);
    return [];
  }
}

/**
 * Helper function to extract suggestion text from suggestion data
 */
function extractSuggestionText(suggestion: any): string {
  try {
    if (suggestion.suggestion_type === 'keywords') {
      const keywords = suggestion.suggestion_data?.suggestions || [];
      return keywords.join(', ');
    } else if (suggestion.suggestion_type === 'title' || suggestion.suggestion_type === 'description') {
      const suggestions = suggestion.suggestion_data?.suggestions || [];
      return suggestions[0] || 'AI Önerisi';
    } else {
      return 'AI Önerisi';
    }
  } catch (error) {
    logger.error('Error extracting suggestion text:', error);
    return 'AI Önerisi';
  }
}

/**
 * Get trending suggestions from database
 */
async function getTrendingSuggestions(query?: string) {
  try {
    let supabaseQuery = supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .eq('is_approved', true)
      .gte('confidence_score', 0.8);

    // If query provided, filter by relevant categories
    if (query) {
      const relevantCategories = getRelevantCategories(query);
      if (relevantCategories.length > 0) {
        supabaseQuery = supabaseQuery.in('category_id', relevantCategories);
      }
    }

    const { data: suggestions, error } = await supabaseQuery
      .order('confidence_score', { ascending: false })
      .limit(5);

    if (error) {
      logger.error('Error getting trending suggestions:', error);
      return [];
    }

    return suggestions.map(suggestion => ({
      id: `trending-${suggestion.id}`,
      text: extractSuggestionText(suggestion),
      type: 'trending',
      score: suggestion.confidence_score,
      metadata: { 
        trending: true,
        categoryName: suggestion.categories?.name,
        categoryPath: suggestion.categories?.path
      }
    }));
  } catch (error) {
    logger.error('Error in getTrendingSuggestions:', error);
    return [];
  }
}

/**
 * Get relevant categories based on query
 */
function getRelevantCategories(query: string): number[] {
  const queryLower = query.toLowerCase();
  
  // Define category mappings
  const categoryMappings: { [key: string]: number[] } = {
    'samsung': [499], // Elektronik
    'iphone': [499], // Elektronik
    'telefon': [499], // Elektronik
    'bilgisayar': [499], // Elektronik
    'laptop': [499], // Elektronik
    'tablet': [499], // Elektronik
    'ev': [1], // Emlak
    'emlak': [1], // Emlak
    'daire': [1], // Emlak
    'villa': [1], // Emlak
    'araba': [2], // Araç
    'otomobil': [2], // Araç
    'araç': [2], // Araç
    'futbol': [712], // Spor & Outdoor
    'basketbol': [712], // Spor & Outdoor
    'spor': [712], // Spor & Outdoor
  };

  // Find matching categories
  for (const [keyword, categoryIds] of Object.entries(categoryMappings)) {
    if (queryLower.includes(keyword)) {
      return categoryIds;
    }
  }

  // If no specific match, return all categories
  return [];
}

/**
 * Get popular suggestions from database
 */
async function getPopularSuggestions() {
  try {
    // Get approved AI suggestions with medium confidence scores
    const { data: suggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select('*')
      .eq('is_approved', true)
      .gte('confidence_score', 0.7)
      .lt('confidence_score', 0.8)
      .order('confidence_score', { ascending: false })
      .limit(3);

    if (error) {
      logger.error('Error getting popular suggestions:', error);
      return [];
    }

    return suggestions.map(suggestion => ({
      id: `popular-${suggestion.id}`,
      text: extractSuggestionText(suggestion),
      type: 'popular',
      score: suggestion.confidence_score,
      metadata: { searchCount: Math.floor(Math.random() * 1000) + 100 }
    }));
  } catch (error) {
    logger.error('Error in getPopularSuggestions:', error);
    return [];
  }
}

export default router;
