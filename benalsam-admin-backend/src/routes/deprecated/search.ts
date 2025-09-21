import { Router, IRouter } from 'express';
import { SearchController } from '../controllers/searchController';
// import searchCacheService from '../services/searchCacheService'; // Deprecated - moved to Cache Service
import rateLimit from 'express-rate-limit';

const router: IRouter = Router();

// Search-specific rate limiting (more lenient than general API)
const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // IP başına max 100 istek
  message: {
    success: false,
    message: 'Çok fazla arama isteği gönderildi. Lütfen daha sonra tekrar deneyin.',
    error: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to search endpoints
router.use(searchRateLimit);

/**
 * Search listings
 * POST /api/search/listings
 */
router.post('/listings', SearchController.searchListings);

/**
 * Get search suggestions
 * GET /api/search/suggestions?q=query
 */
router.get('/suggestions', SearchController.getSuggestions);

/**
 * Get search analytics
 * GET /api/search/analytics
 */
router.get('/analytics', SearchController.getAnalytics);

/**
 * Health check for search services
 * GET /api/search/health
 */
router.get('/health', SearchController.healthCheck);

/**
 * Manual reindex (admin only)
 * POST /api/search/reindex
 */
router.post('/reindex', SearchController.reindex);

/**
 * Search cache endpoints
 */

// Get search cache stats
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = searchCacheService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Search cache stats alınamadı'
    });
  }
});

// Get popular searches
router.get('/cache/popular', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const popular = await searchCacheService.getPopularSearches(sessionId);
    
    return res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Popular searches alınamadı'
    });
  }
});

// Clear search cache
router.post('/cache/clear', async (req, res) => {
  try {
    await searchCacheService.clearAll();
    
    return res.json({
      success: true,
      message: 'Search cache temizlendi'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Search cache temizlenemedi'
    });
  }
});

// Warm search cache
router.post('/cache/warm', async (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({
        success: false,
        error: 'Queries array gerekli'
      });
    }
    
    await searchCacheService.warmSearchCache(queries);
    
    return res.json({
      success: true,
      message: `${queries.length} adet query warmed`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Search cache warming başarısız'
    });
  }
});

export default router; 