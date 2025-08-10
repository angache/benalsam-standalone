// Rate Limit API Routes for Cross-Platform Security

import { Router } from 'express';
import { sharedRateLimitService } from '../services/rateLimitService';

const router: Router = Router();

/**
 * POST /api/rate-limit/check
 * Check if login attempt is allowed for email
 */
router.post('/check', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email is required and must be a string'
      });
      return;
    }

    const result = await sharedRateLimitService.checkRateLimit(email);
    
    res.json({
      success: true,
      data: result
    });
    return;

  } catch (error) {
    console.error('🔴 [RateLimitAPI] Check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
});

/**
 * POST /api/rate-limit/record-failed
 * Record a failed login attempt for email
 */
router.post('/record-failed', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email is required and must be a string'
      });
      return;
    }

    await sharedRateLimitService.recordFailedAttempt(email);
    
    res.json({
      success: true,
      message: 'Failed attempt recorded'
    });
    return;

  } catch (error) {
    console.error('🔴 [RateLimitAPI] Record failed error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
});

/**
 * POST /api/rate-limit/reset
 * Reset rate limit for successful login
 */
router.post('/reset', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email is required and must be a string'
      });
      return;
    }

    await sharedRateLimitService.resetRateLimit(email);
    
    res.json({
      success: true,
      message: 'Rate limit reset'
    });
    return;

  } catch (error) {
    console.error('🔴 [RateLimitAPI] Reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
});

/**
 * GET /api/rate-limit/status/:email
 * Get current rate limit status for email
 */
router.get('/status/:email', async (req, res): Promise<void> => {
  try {
    const { email } = req.params;
    
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email is required and must be a string'
      });
      return;
    }

    const status = await sharedRateLimitService.getRateLimitStatus(email);
    
    res.json({
      success: true,
      data: status
    });
    return;

  } catch (error) {
    console.error('🔴 [RateLimitAPI] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
});

export { router as rateLimitRoutes };
export default router;