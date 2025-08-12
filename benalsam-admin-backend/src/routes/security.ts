import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getSecurityStats, clearOldSecurityEvents } from '../middleware/securityMonitor';
import logger from '../config/logger';

const router = express.Router();

// Get security statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = getSecurityStats();
    
    logger.info('Security stats retrieved', {
      endpoint: req.path,
      ip: req.ip,
      stats: {
        totalEvents: stats.totalEvents,
        eventsLast24Hours: stats.eventsLast24Hours,
        failedLogins: stats.failedLogins,
        suspiciousActivity: stats.suspiciousActivity
      }
    });

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get security stats', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get security statistics',
      error: errorMessage
    });
  }
});

// Get recent security events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const stats = getSecurityStats();
    const recentEvents = stats.recentEvents || [];
    
    logger.info('Security events retrieved', {
      endpoint: req.path,
      ip: req.ip,
      eventCount: recentEvents.length
    });

    res.json({
      success: true,
      data: {
        events: recentEvents,
        total: recentEvents.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get security events', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get security events',
      error: errorMessage
    });
  }
});

// Get top suspicious IPs
router.get('/suspicious-ips', authenticateToken, async (req, res) => {
  try {
    const stats = getSecurityStats();
    const suspiciousIPs = stats.topSuspiciousIPs || [];
    
    logger.info('Suspicious IPs retrieved', {
      endpoint: req.path,
      ip: req.ip,
      ipCount: suspiciousIPs.length
    });

    res.json({
      success: true,
      data: {
        suspiciousIPs,
        total: suspiciousIPs.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get suspicious IPs', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get suspicious IPs',
      error: errorMessage
    });
  }
});

// Clear old security events
router.delete('/clear-old-events', authenticateToken, async (req, res) => {
  try {
    clearOldSecurityEvents();
    
    logger.info('Old security events cleared', {
      endpoint: req.path,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Old security events cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to clear old security events', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear old security events',
      error: errorMessage
    });
  }
});

// Get security summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const stats = getSecurityStats();
    
    const summary = {
      totalEvents: stats.totalEvents,
      eventsLast24Hours: stats.eventsLast24Hours,
      failedLogins: stats.failedLogins,
      suspiciousActivity: stats.suspiciousActivity,
      rateLimitExceeded: stats.rateLimitExceeded,
      validationFailures: stats.validationFailures,
      securityScore: calculateSecurityScore(stats),
      topThreats: getTopThreats(stats),
      recommendations: getSecurityRecommendations(stats)
    };

    logger.info('Security summary retrieved', {
      endpoint: req.path,
      ip: req.ip,
      securityScore: summary.securityScore
    });

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get security summary', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get security summary',
      error: errorMessage
    });
  }
});

// Helper functions
function calculateSecurityScore(stats: any): number {
  const totalEvents = stats.eventsLast24Hours || 0;
  const failedLogins = stats.failedLogins || 0;
  const suspiciousActivity = stats.suspiciousActivity || 0;
  
  // Base score: 10
  let score = 10;
  
  // Deduct points for security events
  if (failedLogins > 10) score -= 3;
  else if (failedLogins > 5) score -= 2;
  else if (failedLogins > 0) score -= 1;
  
  if (suspiciousActivity > 5) score -= 3;
  else if (suspiciousActivity > 2) score -= 2;
  else if (suspiciousActivity > 0) score -= 1;
  
  if (totalEvents > 50) score -= 2;
  else if (totalEvents > 20) score -= 1;
  
  return Math.max(0, Math.min(10, score));
}

function getTopThreats(stats: any): string[] {
  const threats = [];
  
  if (stats.failedLogins > 5) {
    threats.push('Multiple failed login attempts detected');
  }
  
  if (stats.suspiciousActivity > 2) {
    threats.push('Suspicious activity patterns detected');
  }
  
  if (stats.rateLimitExceeded > 10) {
    threats.push('High rate limiting violations');
  }
  
  if (stats.validationFailures > 20) {
    threats.push('Multiple input validation failures');
  }
  
  return threats;
}

function getSecurityRecommendations(stats: any): string[] {
  const recommendations = [];
  
  if (stats.failedLogins > 5) {
    recommendations.push('Consider implementing IP blocking for repeated failed logins');
  }
  
  if (stats.suspiciousActivity > 2) {
    recommendations.push('Review and update CORS policies');
  }
  
  if (stats.rateLimitExceeded > 10) {
    recommendations.push('Consider adjusting rate limiting thresholds');
  }
  
  if (stats.validationFailures > 20) {
    recommendations.push('Review input validation rules and user feedback');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Security status is good. Continue monitoring.');
  }
  
  return recommendations;
}

export default router;
