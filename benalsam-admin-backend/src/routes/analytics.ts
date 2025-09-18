import { Router } from 'express';
import { authenticateToken, authenticateSupabaseToken } from '../middleware/auth';
import userBehaviorService from '../services/userBehaviorService';
import { readThroughCache, cachePresets } from '../middleware/readThroughCache';
import logger from '../config/logger';
import { AnalyticsEvent, AnalyticsEventType } from 'benalsam-shared-types';

const router: Router = Router();

// Initialize user behavior indexes
router.post('/initialize', async (req, res) => {
  try {
    const success = await userBehaviorService.initializeIndexes();
    if (success) {
      res.json({ success: true, message: 'User behavior indexes initialized successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to initialize indexes' });
    }
  } catch (error) {
    logger.error('Error initializing analytics indexes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Track user behavior event
router.post('/track-behavior', async (req, res) => {
  try {
    logger.info('🔍 /track-behavior endpoint called');
    logger.info('🔍 Request body:', JSON.stringify(req.body, null, 2));
    
    const { event_type, event_data, session_id, device_info } = req.body;
    
    logger.info('🔍 Parsed data:');
    logger.info('🔍 event_type:', event_type);
    logger.info('🔍 event_data:', JSON.stringify(event_data, null, 2));
    logger.info('🔍 session_id:', session_id);
    logger.info('🔍 device_info:', JSON.stringify(device_info, null, 2));
    
    // Validate required fields
    if (!event_type) {
      logger.error('❌ Missing event_type');
      return res.status(400).json({ success: false, message: 'Missing event_type' });
    }
    
    if (!session_id) {
      logger.error('❌ Missing session_id');
      return res.status(400).json({ success: false, message: 'Missing session_id' });
    }
    
    // Create event with session-based tracking (no user profile)
    const event = {
      event_type,
      event_data: {
        ...event_data
      },
      timestamp: new Date().toISOString(),
      session_id,
      device_info
    };
    
    logger.info('🔍 Created event object:', JSON.stringify(event, null, 2));
    
    logger.info('🔍 About to call userBehaviorService.trackUserBehavior');
    const success = await userBehaviorService.trackUserBehavior(event);
    logger.info('🔍 userBehaviorService.trackUserBehavior result:', success);
    
    if (success) {
      logger.info('✅ User behavior tracked successfully');
      return res.json({ success: true, message: 'User behavior tracked successfully' });
    } else {
      logger.error('❌ userBehaviorService.trackUserBehavior returned false');
      return res.status(500).json({ success: false, message: 'Failed to track user behavior' });
    }
      } catch (error) {
      logger.error('❌ Error tracking user behavior:', error);
      if (error instanceof Error) {
        logger.error('❌ Error stack:', error.stack);
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Track user analytics
router.post('/track-analytics', authenticateToken, async (req, res) => {
  try {
    const analytics = req.body;
    const success = await userBehaviorService.trackUserAnalytics(analytics);
    
    if (success) {
      res.json({ success: true, message: 'User analytics tracked successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to track user analytics' });
    }
  } catch (error) {
    logger.error('Error tracking user analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Session-based analytics endpoints
router.get('/session-events', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, event_type, session_id, start_date, end_date } = req.query;
    
    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      event_type: event_type as string,
      session_id: session_id as string,
      start_date: start_date as string,
      end_date: end_date as string
    };
    
    const events = await userBehaviorService.getSessionEvents(filters);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Error fetching session events:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/session-stats', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await userBehaviorService.getSessionStats(parseInt(days as string));
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching session stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/session-journey/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { days = 7 } = req.query;
    const journey = await userBehaviorService.getSessionJourney(sessionId, parseInt(days as string));
    res.json({ success: true, data: journey });
  } catch (error) {
    logger.error('Error fetching session journey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/session-analytics/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { days = 7 } = req.query;
    const analytics = await userBehaviorService.getSessionAnalytics(sessionId, parseInt(days as string));
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error fetching session analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Track analytics event (new format)
router.post('/track-event', async (req, res) => {
  try {
    const analyticsEvent = req.body;
    const success = await userBehaviorService.trackAnalyticsEvent(analyticsEvent);
    
    if (success) {
      res.json({ success: true, message: 'Analytics event tracked successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to track analytics event' });
    }
  } catch (error) {
    logger.error('Error tracking analytics event:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user behavior stats
router.get('/user-stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const stats = await userBehaviorService.getUserBehaviorStats(userId, Number(days));
    
    if (stats) {
      res.json({ success: true, data: stats });
    } else {
      res.status(404).json({ success: false, message: 'User stats not found' });
    }
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get popular sections
router.get('/popular-sections', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await userBehaviorService.getPopularSections(Number(days));
    
    if (stats) {
      res.json({ success: true, data: stats });
    } else {
      res.status(404).json({ success: false, message: 'Popular sections not found' });
    }
  } catch (error) {
    logger.error('Error getting popular sections:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get bounce rate stats
router.get('/bounce-rate', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await userBehaviorService.getBounceRateStats(Number(days));
    
    if (stats) {
      res.json({ success: true, data: stats });
    } else {
      res.status(404).json({ success: false, message: 'Bounce rate stats not found' });
    }
  } catch (error) {
    logger.error('Error getting bounce rate stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get index stats
router.get('/index-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await userBehaviorService.getIndexStats();
    
    if (stats) {
      res.json({ success: true, data: stats });
    } else {
      res.status(404).json({ success: false, message: 'Index stats not found' });
    }
  } catch (error) {
    logger.error('Error getting index stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get performance metrics
router.get('/performance-metrics', authenticateToken, async (req, res) => {
  try {
    const { days = 7, event_type = 'performance' } = req.query;
    
    const metrics = await userBehaviorService.getPerformanceMetrics(Number(days), event_type as string);
    
    if (metrics) {
      res.json({ success: true, data: metrics });
    } else {
      res.status(404).json({ success: false, message: 'Performance metrics not found' });
    }
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get popular pages analytics
router.get('/popular-pages', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await userBehaviorService.getPopularPages(Number(days));
    
    if (stats) {
      res.json({ success: true, data: stats });
    } else {
      res.status(404).json({ success: false, message: 'Popular pages not found' });
    }
  } catch (error) {
    logger.error('Error getting popular pages:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get feature usage analytics
router.get('/feature-usage', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await userBehaviorService.getFeatureUsage(Number(days));
    
    if (stats) {
      res.json({ success: true, data: stats });
    } else {
      res.status(404).json({ success: false, message: 'Feature usage not found' });
    }
  } catch (error) {
    logger.error('Error getting feature usage:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user journey analytics
router.get('/user-journey/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    const journey = await userBehaviorService.getUserJourney(userId, Number(days));
    
    if (journey) {
      res.json({ success: true, data: journey });
    } else {
      res.status(404).json({ success: false, message: 'User journey not found' });
    }
  } catch (error) {
    logger.error('Error getting user journey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get real-time metrics
router.get('/real-time-metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = await userBehaviorService.getRealTimeMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Error getting real-time metrics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user activities
router.get('/user-activities', authenticateToken, async (req, res) => {
  try {
    const activities = await userBehaviorService.getUserActivities();
    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error getting user activities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get performance alerts
router.get('/performance-alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await userBehaviorService.getPerformanceAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error getting performance alerts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get comprehensive analytics dashboard (enterprise optimized) - Cache for 2 minutes
router.get('/dashboard', 
  readThroughCache({
    ttl: 120,
    namespace: 'analytics'
  }),
  authenticateToken, 
  async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startTime = Date.now();
    
    // Parallel execution with optimized queries
    const [
      popularPages,
      featureUsage,
      bounceRate,
      userActivities,
      performanceMetrics
    ] = await Promise.all([
      userBehaviorService.getPopularPages(Number(days)),
      userBehaviorService.getFeatureUsage(Number(days)),
      userBehaviorService.getBounceRateStats(Number(days)),
      userBehaviorService.getUserActivities(),
      userBehaviorService.getPerformanceMetrics(Number(days))
    ]);
    
    const dashboardData = {
      popularPages,
      featureUsage,
      bounceRate,
      userActivities,
      performanceMetrics,
      summary: {
        totalPages: popularPages?.length || 0,
        totalFeatures: featureUsage?.length || 0,
        totalActivities: userActivities?.length || 0,
        avgBounceRate: bounceRate?.average || 0
      },
      performance: {
        responseTime: Date.now() - startTime,
        optimized: true,
        cacheHit: false
      }
    };
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===========================
// STANDARDIZED ANALYTICS ENDPOINTS
// ===========================

// Track standardized analytics event
router.post('/track-event', async (req, res) => {
  try {
    const analyticsEvent: AnalyticsEvent = req.body;
    
    // Validate required fields
    if (!analyticsEvent.event_id || !analyticsEvent.event_name || !analyticsEvent.user || !analyticsEvent.session) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: event_id, event_name, user, session' 
      });
    }
    
    // Validate event type
    if (!Object.values(AnalyticsEventType).includes(analyticsEvent.event_name)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid event type: ${analyticsEvent.event_name}` 
      });
    }
    
    const success = await userBehaviorService.trackAnalyticsEvent(analyticsEvent);
    
    if (success) {
      return res.json({ success: true, message: 'Analytics event tracked successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to track analytics event' });
    }
  } catch (error) {
    logger.error('Error tracking analytics event:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get analytics events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, event_type, user_id, start_date, end_date } = req.query;
    
    const events = await userBehaviorService.getAnalyticsEvents({
      page: Number(page),
      limit: Number(limit),
      event_type: event_type as string,
      user_id: user_id as string,
      start_date: start_date as string,
      end_date: end_date as string
    });
    
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Error getting analytics events:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get analytics event types
router.get('/event-types', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const eventTypes = await userBehaviorService.getAnalyticsEventTypes(Number(days));
    
    res.json({ success: true, data: eventTypes });
  } catch (error) {
    logger.error('Error getting analytics event types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get session journey analytics
router.get('/session-journey/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { days = 7 } = req.query;
    
    const journey = await userBehaviorService.getSessionJourney(sessionId, Number(days));
    
    res.json({ success: true, data: journey });
  } catch (error) {
    logger.error('Error getting session journey:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get session data
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionData = await userBehaviorService.getAnalyticsSessionData(sessionId);
    
    res.json({ success: true, data: sessionData });
  } catch (error) {
    logger.error('Error getting session data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Dashboard stats endpoint
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Import required services
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get comprehensive dashboard stats
    const stats = {
      totalUsers: 0,
      totalListings: 0,
      totalCategories: 0,
      totalRevenue: 0,
      activeListings: 0,
      pendingModeration: 0,
      newUsersToday: 0,
      newListingsToday: 0,
      totalEvents: 0,
      totalSessions: 0,
      eventTypes: [],
      recentActivity: [],
      performanceMetrics: {},
      userJourneyStats: {}
    };
    
    try {
      // Get user stats
      const userStats = await prisma.user.count();
      stats.totalUsers = userStats;
      
      // Get today's new users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = await prisma.user.count({
        where: {
          created_at: {
            gte: today
          }
        }
      });
      stats.newUsersToday = newUsersToday;
      
    } catch (error) {
      logger.warn('Could not fetch user stats:', error);
    }
    
    try {
      // Get listing stats
      const listingStats = await prisma.listing.count();
      stats.totalListings = listingStats;
      
      // Get active listings
      const activeListings = await prisma.listing.count({
        where: {
          status: 'ACTIVE'
        }
      });
      stats.activeListings = activeListings;
      
      // Get pending moderation
      const pendingModeration = await prisma.listing.count({
        where: {
          status: 'PENDING_APPROVAL'
        }
      });
      stats.pendingModeration = pendingModeration;
      
      // Get today's new listings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newListingsToday = await prisma.listing.count({
        where: {
          created_at: {
            gte: today
          }
        }
      });
      stats.newListingsToday = newListingsToday;
      
    } catch (error) {
      logger.warn('Could not fetch listing stats:', error);
    }
    
    try {
      // Get category stats
      const categoryStats = await prisma.category.count();
      stats.totalCategories = categoryStats;
    } catch (error) {
      logger.warn('Could not fetch category stats:', error);
    }
    
    try {
      // Get revenue stats (mock data for now)
      stats.totalRevenue = 45230; // Mock revenue data
    } catch (error) {
      logger.warn('Could not fetch revenue stats:', error);
    }
    
    // Get analytics stats from userBehaviorService
    try {
      const analyticsStats = await userBehaviorService.getAnalyticsStats();
      if (analyticsStats) {
        stats.totalEvents = analyticsStats.total_events || 0;
        stats.totalSessions = analyticsStats.total_sessions || 0;
      }
    } catch (error) {
      logger.warn('Could not fetch analytics stats:', error);
    }
    
    // Get event types
    try {
      const eventTypes = await userBehaviorService.getAnalyticsEventTypes(Number(days));
      stats.eventTypes = eventTypes || [];
    } catch (error) {
      logger.warn('Could not fetch event types:', error);
    }
    
    // Get recent activity
    try {
      const recentEvents = await userBehaviorService.getAnalyticsEvents({
        page: 1,
        limit: 10,
        start_date: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString()
      });
      stats.recentActivity = recentEvents?.events || [];
    } catch (error) {
      logger.warn('Could not fetch recent activity:', error);
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Session-based analytics endpoints
router.get('/session-activities', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, session_id, start_date, end_date } = req.query;
    
    const activities = await userBehaviorService.getSessionActivities({
      page: Number(page),
      limit: Number(limit),
      session_id: session_id as string,
      start_date: start_date as string,
      end_date: end_date as string
    });
    
    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error getting session activities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router; 