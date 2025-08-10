import express from 'express';
import userJourneyService, { UserJourneyEvent } from '../services/userJourneyService';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';

const router: express.Router = express.Router();

// Track user journey event
router.post('/track', async (req, res) => {
  try {
    const event: UserJourneyEvent = req.body;
    
    // Validate required fields
    if (!event.userId || !event.sessionId || !event.eventType || !event.page) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, sessionId, eventType, page'
      });
    }

    const success = await userJourneyService.trackEvent(event);
    
    return res.json({
      success,
      message: success ? 'Event tracked successfully' : 'Failed to track event'
    });
  } catch (error) {
    logger.error('Failed to track user journey event:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track user journey event'
    });
  }
});

// Get user journey metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const metrics = await userJourneyService.getJourneyMetrics(days);
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get user journey metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user journey metrics'
    });
  }
});

// Get optimization recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const metrics = await userJourneyService.getJourneyMetrics(days);
    const recommendations = await userJourneyService.getOptimizationRecommendations(metrics);
    
    return res.json({
      success: true,
      data: {
        metrics,
        recommendations
      }
    });
  } catch (error) {
    logger.error('Failed to get optimization recommendations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get optimization recommendations'
    });
  }
});

// Initialize user journey tracking
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    // This would typically initialize tracking on the frontend
    return res.json({
      success: true,
      message: 'User journey tracking initialized',
      trackingScript: `
        // User Journey Tracking Script
        window.userJourneyTracker = {
          trackEvent: function(eventType, page, metadata = {}) {
            fetch('/api/v1/user-journey/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: window.currentUserId || 'anonymous',
                sessionId: window.sessionId || Date.now().toString(),
                eventType: eventType,
                page: page,
                timestamp: new Date().toISOString(),
                metadata: metadata
              })
            });
          }
        };
      `
    });
  } catch (error) {
    logger.error('Failed to initialize user journey tracking:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize user journey tracking'
    });
  }
});

export default router; 