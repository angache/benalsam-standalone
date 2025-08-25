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
    // Trending'ler Supabase'de çünkü usage tracking ve analytics orada
    if (suggestions.length < 5) {
      const trendingSuggestions = await getTrendingSuggestions(query as string);
      suggestions.push(...trendingSuggestions);
    }

    // 4. Popular suggestions - get from database (fallback)
    // Popular'lar da Supabase'de çünkü confidence score ve category analytics orada
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

    // Build Elasticsearch query with better relevance
    const esQuery = {
      min_score: 0.3, // Lower minimum score to include more relevant results
      query: {
        bool: {
          should: [
            // Exact phrase match (highest priority)
            {
              multi_match: {
                query: query,
                fields: [
                  'suggestion_data.keywords^4',
                  'suggestion_data.brand^3',
                  'suggestion_data.model^3'
                ],
                type: 'phrase',
                boost: 3.0
              }
            },
            // Individual terms match
            {
              multi_match: {
                query: query,
                fields: [
                  'suggestion_data.keywords^2',
                  'suggestion_data.brand^1.5',
                  'suggestion_data.model^1.5',
                  'category_name^1',
                  'suggestion_data.description^0.5'
                ],
                fuzziness: 'AUTO',
                type: 'best_fields',
                minimum_should_match: '60%'
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
        { _score: { order: 'desc' } },
        { confidence_score: { order: 'desc' } }
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
      text: `[ES] ${extractSuggestionText(suggestion)}`,
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

    // ES handles relevance automatically, no need for manual filtering

    const { data: suggestions, error } = await supabaseQuery
      .order('confidence_score', { ascending: false })
      .limit(5);

    logger.info(`📊 Found ${suggestions?.length || 0} suggestions for query: "${query}"`);

    if (error) {
      logger.error('Error getting trending suggestions:', error);
      return [];
    }

    return suggestions.map(suggestion => ({
      id: `trending-${suggestion.id}`,
      text: `[SPB-TRENDING] ${extractSuggestionText(suggestion)}`,
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
  // ES full-text search already handles relevance automatically
  // No need for manual category filtering
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

    // ES handles relevance automatically, no need for manual filtering

    const { data: suggestions, error } = await supabaseQuery
      .order('confidence_score', { ascending: false })
      .limit(3);

    if (error) {
      logger.error('Error getting popular suggestions:', error);
      return [];
    }

    return suggestions.map(suggestion => ({
      id: `popular-${suggestion.id}`,
      text: `[SPB-POPULAR] ${extractSuggestionText(suggestion)}`,
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

/**
 * @route POST /api/v1/ai-suggestions/process-queue
 * @desc Manually process queue
 * @access Public
 */
router.post('/process-queue', async (req, res) => {
  try {
    // Queue processor'ı manuel olarak çalıştır
    const { QueueProcessorService } = require('../services/queueProcessorService');
    const queueProcessor = new QueueProcessorService();
    
    // Pending job'ları al ve işle
    const { data: pendingJobs, error } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Queue error',
        error: error
      });
    }

    let processedCount = 0;
    for (const job of pendingJobs || []) {
      try {
        await queueProcessor['processJob'](job);
        processedCount++;
      } catch (error) {
        logger.error(`Error processing job ${job.id}:`, error);
      }
    }

    return res.json({
      success: true,
      data: {
        processedCount,
        totalJobs: pendingJobs?.length || 0
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in manual queue processing:', error);
    return res.status(500).json({
      success: false,
      message: 'Manual processing error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/debug-categories
 * @desc Debug category filtering
 * @access Public
 */
router.get('/debug-categories', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter required'
      });
    }

    const relevantCategories = getRelevantCategories(query as string);
    
    // Tüm AI suggestions'ları al
    const { data: allSuggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .eq('is_approved', true);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error
      });
    }

    // Filtrelenmiş suggestions'ları al
    const filteredSuggestions = relevantCategories.length > 0 
      ? allSuggestions.filter(s => relevantCategories.includes(s.category_id))
      : [];

    return res.json({
      success: true,
      data: {
        query: query,
        relevantCategories,
        totalSuggestions: allSuggestions.length,
        filteredSuggestionsCount: filteredSuggestions.length,
        allSuggestions: allSuggestions.map(s => ({
          id: s.id,
          category_id: s.category_id,
          category_name: s.categories?.name,
          suggestion_data: s.suggestion_data
        })),
        filteredSuggestions: filteredSuggestions.map(s => ({
          id: s.id,
          category_id: s.category_id,
          category_name: s.categories?.name,
          suggestion_data: s.suggestion_data
        }))
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in debug categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/ai-suggestions/log-click
 * @desc Log AI suggestion click for usage tracking
 * @access Public
 */
router.post('/log-click', async (req, res) => {
  try {
    const { suggestionId, query, sessionId, resultPosition, searchType } = req.body;

    if (!suggestionId || !query) {
      return res.status(400).json({
        success: false,
        message: 'suggestionId and query are required'
      });
    }

    // Log the click using Supabase function
    const { error } = await supabase.rpc('log_ai_suggestion_click', {
      p_suggestion_id: suggestionId,
      p_query: query,
      p_session_id: sessionId || null,
      p_result_position: resultPosition || null,
      p_search_type: searchType || 'ai_suggestion'
    });

    if (error) {
      logger.error('Error logging AI suggestion click:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to log click',
        error: error.message
      });
    }

    // Update usage count
    await supabase.rpc('update_suggestion_usage_count', {
      p_suggestion_id: suggestionId
    });

    logger.info(`✅ AI suggestion click logged: ${suggestionId} for query: "${query}"`);

    return res.json({
      success: true,
      message: 'Click logged successfully'
    });

  } catch (error: any) {
    logger.error('❌ Error logging AI suggestion click:', error);
    return res.status(500).json({
      success: false,
      message: 'Click logging failed',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route GET /api/v1/ai-suggestions/trending-by-usage
 * @desc Get trending suggestions based on actual usage data
 * @access Public
 */
router.get('/trending-by-usage', async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const { data: trendingData, error } = await supabase.rpc('get_trending_suggestions_by_usage', {
      p_days: parseInt(days as string),
      p_limit: parseInt(limit as string)
    });

    if (error) {
      logger.error('Error getting trending by usage:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get trending data',
        error: error.message
      });
    }

    // Get detailed suggestion data
    const suggestionIds = trendingData.map((item: any) => item.suggestion_id);
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .in('id', suggestionIds)
      .eq('is_approved', true);

    if (suggestionsError) {
      logger.error('Error getting suggestion details:', suggestionsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to get suggestion details',
        error: suggestionsError.message
      });
    }

    // Combine trending data with suggestion details
    const trendingSuggestions = suggestions.map(suggestion => {
      const trendingInfo = trendingData.find((item: any) => item.suggestion_id === suggestion.id);
      return {
        id: `trending-usage-${suggestion.id}`,
        text: `[TRENDING-USAGE] ${extractSuggestionText(suggestion)}`,
        type: 'trending_usage',
        score: trendingInfo?.total_clicks || 0,
        metadata: {
          categoryName: suggestion.categories?.name,
          categoryPath: suggestion.categories?.path,
          totalClicks: trendingInfo?.total_clicks || 0,
          clickThroughRate: trendingInfo?.click_through_rate || 0,
          avgDwellTime: trendingInfo?.avg_dwell_time || 0,
          days: parseInt(days as string)
        }
      };
    });

    return res.json({
      success: true,
      data: {
        suggestions: trendingSuggestions,
        total: trendingSuggestions.length,
        days: parseInt(days as string),
        source: 'usage_analytics'
      }
    });

  } catch (error: any) {
    logger.error('❌ Error getting trending by usage:', error);
    return res.status(500).json({
      success: false,
      message: 'Trending by usage failed',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/ai-suggestions/rebuild-indexes
 * @desc Rebuild ES indexes from Supabase data
 * @access Public
 */
router.post('/rebuild-indexes', async (req, res) => {
  try {
    logger.info('🔄 Starting ES index rebuild...');

    // 1. ES indexini temizle
    try {
      await aiSuggestionsES.deleteIndex();
      logger.info('✅ ES index deleted');
    } catch (error: any) {
      logger.warn('⚠️ ES index delete failed (might not exist):', error);
    }

    // 2. ES indexini yeniden oluştur
    try {
      await aiSuggestionsES.createIndex();
      logger.info('✅ ES index recreated');
    } catch (error: any) {
      logger.error('❌ ES index creation failed:', error);
      return res.status(500).json({
        success: false,
        message: 'ES index creation failed',
        error: error.message || 'Unknown error'
      });
    }

    // 3. Supabase'den tüm onaylı önerileri al
    const { data: suggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select(`
        *,
        categories!inner(name, path, level)
      `)
      .eq('is_approved', true);

    if (error) {
      logger.error('❌ Error fetching suggestions from Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message || 'Unknown error'
      });
    }

    logger.info(`📊 Found ${suggestions?.length || 0} approved suggestions`);

    // 4. Her öneriyi ES'ye indexle
    let indexedCount = 0;
    for (const suggestion of suggestions || []) {
      try {
        const transformedData = {
          id: suggestion.id,
          category_id: suggestion.category_id,
          category_name: suggestion.categories?.name,
          category_path: suggestion.categories?.path,
          suggestion_type: suggestion.suggestion_type,
          suggestion_data: {
            ...suggestion.suggestion_data,
            // suggestions varsa keywords olarak kopyala
            ...(suggestion.suggestion_data.suggestions && {
              keywords: suggestion.suggestion_data.suggestions
            })
          },
          confidence_score: suggestion.confidence_score,
          is_approved: suggestion.is_approved,
          created_at: suggestion.created_at,
          updated_at: suggestion.updated_at,
          search_boost: suggestion.search_boost || 1.0,
          usage_count: suggestion.usage_count || 0,
          last_used_at: suggestion.last_used_at
        };

        // suggestions field'ını kaldır
        if (transformedData.suggestion_data.suggestions) {
          delete transformedData.suggestion_data.suggestions;
        }

        await aiSuggestionsES.indexDocument(
          `ai_suggestions_${suggestion.id}`,
          transformedData
        );
        indexedCount++;
      } catch (error) {
        logger.error(`❌ Error indexing suggestion ${suggestion.id}:`, error);
      }
    }

    logger.info(`✅ Successfully indexed ${indexedCount} suggestions`);

    return res.json({
      success: true,
      data: {
        indexedCount,
        totalSuggestions: suggestions?.length || 0,
        message: `ES indexleri başarıyla yeniden yüklendi! ${indexedCount} kayıt indexlendi.`
      }
    });

  } catch (error: any) {
    logger.error('❌ Error rebuilding ES indexes:', error);
    return res.status(500).json({
      success: false,
      message: 'ES index rebuild failed',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;
