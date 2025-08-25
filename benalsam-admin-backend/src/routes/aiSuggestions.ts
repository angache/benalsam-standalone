import express from 'express';
import { rateLimit } from 'express-rate-limit';
import logger from '../config/logger';
import { categoryService } from '../services/categoryService';
import { searchService } from '../services/searchService';
import { supabase } from '../config/database';
import { AdminElasticsearchService } from '../services/elasticsearchService';

const router = express.Router();

// Initialize Elasticsearch service for AI suggestions
const aiSuggestionsES = new AdminElasticsearchService(
  process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
  'ai_suggestions'
);

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
        const esSuggestions = await getESSuggestions(query as string);
        suggestions.push(...esSuggestions);
      } catch (error) {
        logger.error('Error getting ES suggestions:', error);
      }
    }

    // 2. Category-based suggestions if categoryId provided
    if (categoryId) {
      try {
        const categorySuggestions = await getCategoryAISuggestions(parseInt(categoryId as string));
        suggestions.push(...categorySuggestions);
      } catch (error) {
        logger.error('Error getting category AI suggestions:', error);
      }
    }

    // 3. Trending suggestions - get from database (fallback)
    if (suggestions.length < 5) {
      const trendingSuggestions = await getTrendingSuggestions(query as string);
      suggestions.push(...trendingSuggestions);
    }

    // 4. Popular suggestions - get from database (fallback)
    if (suggestions.length < 10) {
      const popularSuggestions = await getPopularSuggestions(query as string);
      suggestions.push(...popularSuggestions);
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    ).slice(0, 20);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        total: uniqueSuggestions.length,
        query: query || null,
        source: query ? 'hybrid' : 'database'
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
 * Get suggestions from Elasticsearch
 */
async function getESSuggestions(query: string) {
  try {
    logger.info(`🔍 ES search for query: ${query}`);

    // Build Elasticsearch query
    const esQuery = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: [
                  'suggestion_data.keywords^3',
                  'suggestion_data.brand^2',
                  'suggestion_data.model^2',
                  'category_name^1.5',
                  'suggestion_data.description^1'
                ],
                fuzziness: 'AUTO',
                type: 'best_fields'
              }
            }
          ],
          filter: [
            { term: { is_approved: true } },
            { range: { confidence_score: { gte: 0.7 } } }
          ]
        }
      },
      sort: [
        { confidence_score: { order: 'desc' } },
        { search_boost: { order: 'desc' } }
      ],
      size: 10
    };

    // Search in Elasticsearch
    const response = await aiSuggestionsES.search(esQuery);
    
    if (!response || !response.hits || !response.hits.hits) {
      logger.warn('No ES results found');
      return [];
    }

    // Get suggestion IDs from ES results
    const suggestionIds = response.hits.hits.map((hit: any) => hit._source.id);

    // Get detailed data from Supabase
    const { data: suggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .in('id', suggestionIds)
      .eq('is_approved', true);

    if (error) {
      logger.error('Error getting suggestions from Supabase:', error);
      return [];
    }

    // Combine ES scores with Supabase data
    const esScores = new Map();
    response.hits.hits.forEach((hit: any) => {
      esScores.set(hit._source.id, hit._score);
    });

    return suggestions.map(suggestion => ({
      id: `es-${suggestion.id}`,
      text: extractSuggestionText(suggestion),
      type: 'search',
      score: esScores.get(suggestion.id) || suggestion.confidence_score,
      metadata: {
        categoryName: suggestion.categories?.name,
        categoryPath: suggestion.categories?.path,
        confidenceScore: suggestion.confidence_score,
        source: 'elasticsearch'
      }
    }));

  } catch (error) {
    logger.error('Error in getESSuggestions:', error);
    return [];
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

  // If no specific match, return empty array (no irrelevant suggestions)
  return [];
}

/**
 * Get popular suggestions from database
 */
async function getPopularSuggestions(query?: string) {
  try {
    let supabaseQuery = supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .eq('is_approved', true)
      .gte('confidence_score', 0.7)
      .lt('confidence_score', 0.8);

    // If query provided, filter by relevant categories
    if (query) {
      const relevantCategories = getRelevantCategories(query);
      if (relevantCategories.length > 0) {
        supabaseQuery = supabaseQuery.in('category_id', relevantCategories);
      }
    }

    const { data: suggestions, error } = await supabaseQuery
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
      metadata: { 
        searchCount: Math.floor(Math.random() * 1000) + 100,
        categoryName: suggestion.categories?.name,
        categoryPath: suggestion.categories?.path
      }
    }));
  } catch (error) {
    logger.error('Error in getPopularSuggestions:', error);
    return [];
  }
}

/**
 * @route GET /api/v1/ai-suggestions/debug-queue
 * @desc Debug queue processing
 * @access Public
 */
router.get('/debug-queue', async (req, res) => {
  try {
    // Queue durumunu kontrol et
    const { data: queueJobs, error: queueError } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (queueError) {
      return res.status(500).json({
        success: false,
        message: 'Queue error',
        error: queueError
      });
    }

    // ES durumunu kontrol et
    const esResponse = await aiSuggestionsES.search({
      query: { match_all: {} },
      size: 5
    });

    return res.json({
      success: true,
      data: {
        queueJobs,
        esCount: esResponse?.hits?.total?.value || 0,
        esHits: esResponse?.hits?.hits?.map((hit: any) => hit._source) || []
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in debug queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

export default router;
