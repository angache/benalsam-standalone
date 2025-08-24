import { Router, IRouter } from 'express';

const router: IRouter = Router();

// Hello World endpoint
router.get('/hello', (req, res) => {
  console.log('🧪 Hello World endpoint called!');
  res.json({ message: 'Hello World from test-listings!' });
});

// Test endpoint - Create test listings (no auth required)
router.post('/create', async (req, res): Promise<void> => {
  try {
    console.log('🧪 POST /create endpoint called!');
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

export { router as testListingsRouter };
