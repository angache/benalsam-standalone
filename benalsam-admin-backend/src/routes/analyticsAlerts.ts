import express from 'express';
import { authenticateToken } from '../middleware/auth';
import analyticsAlertsService from '../services/analyticsAlertsService';
import logger from '../config/logger';

const router: express.Router = express.Router();

// Initialize analytics alerts indexes
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const success = await analyticsAlertsService.initializeIndexes();
    if (success) {
      res.json({ success: true, message: 'Analytics alerts indexes initialized successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to initialize indexes' });
    }
  } catch (error: any) {
    logger.error('Error initializing analytics alerts indexes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Alert Rules Management
router.post('/rules', authenticateToken, async (req, res) => {
  try {
    const rule = await analyticsAlertsService.createAlertRule(req.body);
    res.json({ success: true, data: rule });
  } catch (error: any) {
    logger.error('Error creating alert rule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/rules', authenticateToken, async (req, res) => {
  try {
    const rules = await analyticsAlertsService.getAlertRules();
    res.json({ success: true, data: rules });
  } catch (error: any) {
    logger.error('Error getting alert rules:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/rules/:ruleId', authenticateToken, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const success = await analyticsAlertsService.updateAlertRule(ruleId, req.body);
    
    if (success) {
      res.json({ success: true, message: 'Alert rule updated successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update alert rule' });
    }
  } catch (error: any) {
    logger.error('Error updating alert rule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/rules/:ruleId', authenticateToken, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const success = await analyticsAlertsService.deleteAlertRule(ruleId);
    
    if (success) {
      res.json({ success: true, message: 'Alert rule deleted successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete alert rule' });
    }
  } catch (error: any) {
    logger.error('Error deleting alert rule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Notification Channels Management
router.post('/channels', authenticateToken, async (req, res) => {
  try {
    const channel = await analyticsAlertsService.createNotificationChannel(req.body);
    res.json({ success: true, data: channel });
  } catch (error: any) {
    logger.error('Error creating notification channel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/channels', authenticateToken, async (req, res) => {
  try {
    const channels = await analyticsAlertsService.getNotificationChannels();
    res.json({ success: true, data: channels });
  } catch (error: any) {
    logger.error('Error getting notification channels:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Alerts Management
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { status, severity, metric_type, start_date, end_date, limit } = req.query;
    
    const alerts = await analyticsAlertsService.getAlerts({
      status: status as string,
      severity: severity as string,
      metric_type: metric_type as string,
      start_date: start_date as string,
      end_date: end_date as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/alerts/:alertId/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;
    
    const success = await analyticsAlertsService.acknowledgeAlert(alertId, acknowledgedBy);
    
    if (success) {
      res.json({ success: true, message: 'Alert acknowledged successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to acknowledge alert' });
    }
  } catch (error: any) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/alerts/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const { alertId } = req.params;
    const success = await analyticsAlertsService.resolveAlert(alertId);
    
    if (success) {
      res.json({ success: true, message: 'Alert resolved successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to resolve alert' });
    }
  } catch (error: any) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Alert Summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summary = await analyticsAlertsService.getAlertSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    logger.error('Error getting alert summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check Alerts (for testing)
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const { metrics } = req.body;
    const newAlerts = await analyticsAlertsService.checkAlerts(metrics);
    res.json({ success: true, data: { alerts: newAlerts, count: newAlerts.length } });
  } catch (error: any) {
    logger.error('Error checking alerts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test Notifications
router.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    const { channelId, testAlert } = req.body;
    
    // Create a test alert
    const testAlertData = {
      id: `test_${Date.now()}`,
      rule_id: 'test_rule',
      rule_name: 'Test Alert',
      severity: 'medium' as const,
      metric_type: 'test',
      metric_name: 'test_metric',
      current_value: 100,
      threshold_value: 50,
      message: 'This is a test alert',
      status: 'active' as const,
      triggered_at: new Date().toISOString(),
      notification_sent: false,
      notification_channels: [channelId]
    };

    const success = await analyticsAlertsService.sendNotifications(testAlertData);
    
    if (success) {
      res.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test notification' });
    }
  } catch (error: any) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router; 