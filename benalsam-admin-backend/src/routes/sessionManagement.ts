import express from 'express';
import { authenticateToken } from '../middleware/auth';
import sessionCleanupService from '../services/sessionCleanupService';
import logger from '../config/logger';
import { supabase } from '../index';

const router: express.Router = express.Router();

// Session cleanup endpoint
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    logger.info('🔧 Manual session cleanup requested');
    await sessionCleanupService.manualCleanup();
    
    res.json({
      success: true,
      message: 'Session cleanup completed successfully'
    });
  } catch (error) {
    logger.error('❌ Error in manual session cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform session cleanup'
    });
  }
});

// Session statistics endpoint
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: activeSessions, error: activeError } = await supabase
      .from('user_session_logs')
      .select('id, session_id, user_id, session_start, last_activity')
      .eq('status', 'active');
    
    const { data: terminatedSessions, error: terminatedError } = await supabase
      .from('user_session_logs')
      .select('id, session_id, user_id, session_start, session_end, session_duration')
      .eq('status', 'terminated')
      .gte('session_end', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if (activeError || terminatedError) {
      throw new Error('Failed to fetch session statistics');
    }
    
    res.json({
      success: true,
      data: {
        activeSessions: activeSessions?.length || 0,
        terminatedSessions: terminatedSessions?.length || 0,
        totalSessions: (activeSessions?.length || 0) + (terminatedSessions?.length || 0)
      }
    });
  } catch (error) {
    logger.error('❌ Error fetching session stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session statistics'
    });
  }
});

export default router; 