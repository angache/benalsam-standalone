import express, { Router } from 'express';
import apiCacheService from '../services/apiCacheService';

const router: Router = express.Router();

// Simple test endpoint with cache
router.get('/test', apiCacheService.cacheMiddleware(300000), (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Test endpoint with cache',
      timestamp: new Date().toISOString(),
      sessionId: req.headers['x-session-id'] || 'anonymous'
    }
  });
});

// Test endpoint without cache
router.get('/test-no-cache', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Test endpoint without cache',
      timestamp: new Date().toISOString(),
      sessionId: req.headers['x-session-id'] || 'anonymous'
    }
  });
});

export default router; 