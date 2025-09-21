import { Router, IRouter } from 'express';
import { SearchController } from '../controllers/searchController';
import rateLimit from 'express-rate-limit';

const router: IRouter = Router();

// Search-specific rate limiting
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

/**
 * Search endpoints
 */

// Search listings
router.post('/listings', searchRateLimit, SearchController.searchListings);

// Get search suggestions
router.get('/suggestions', searchRateLimit, SearchController.getSuggestions);

// Get search statistics
router.get('/stats', SearchController.getStats);

// Clear search cache
router.post('/cache/clear', SearchController.clearCache);

// Search service health check
router.get('/health', SearchController.healthCheck);

export default router;
