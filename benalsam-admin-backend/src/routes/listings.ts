import { Router, IRouter } from 'express';
import { listingsController } from '../controllers/listingsController';
import { authenticateToken } from '../middleware/auth';
import { readThroughCache, cachePresets } from '../middleware/readThroughCache';
import { cacheInvalidation, invalidationPresets } from '../middleware/cacheInvalidation';

const router: IRouter = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get all listings with filters - Cache for 5 minutes
router.get('/', 
  readThroughCache({
    ...cachePresets.mediumTerm,
    namespace: 'listings'
  }),
  listingsController.getListings
);

// Get single listing - Cache for 10 minutes (rarely changes)
router.get('/:id', 
  readThroughCache({
    ttl: 600,
    namespace: 'listings'
  }),
  listingsController.getListing
);

// Update listing - Invalidate cache
router.put('/:id', 
  cacheInvalidation(invalidationPresets.listings),
  listingsController.updateListing
);

// Delete listing - Invalidate cache
router.delete('/:id', 
  cacheInvalidation(invalidationPresets.listings),
  listingsController.deleteListing
);

// Moderate listing (approve/reject) - Invalidate cache
router.post('/:id/moderate', 
  cacheInvalidation(invalidationPresets.listings),
  listingsController.moderateListing
);

// Re-evaluate listing (move active listing back to pending) - Invalidate cache
router.post('/:id/re-evaluate', 
  cacheInvalidation(invalidationPresets.listings),
  listingsController.reEvaluateListing
);

// Test endpoint - Create test listings (no auth required)
router.post('/test/create', async (req, res): Promise<void> => {
  try {
    console.log('🧪 POST /test/create endpoint called!');
    console.log('🧪 Request body:', req.body);
    
    const { count = 5, includeImages = true } = req.body;
    
    if (!count || count < 1 || count > 100) {
      res.status(400).json({ error: 'Count must be between 1 and 100' });
      return;
    }

    console.log('🧪 Test listings endpoint called with count:', count);
    
    // Simple response for now
    res.json({ 
      success: true, 
      message: `Test endpoint working! Count: ${count}, IncludeImages: ${includeImages}`,
      count: count,
      stats: {
        users: 5,
        categories: 10,
        generated: count,
        inserted: count
      }
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as listingsRouter }; 