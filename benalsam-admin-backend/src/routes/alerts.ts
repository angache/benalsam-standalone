import express from 'express';
import alertService, { AlertRule, Alert } from '../services/alertService';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';

const router: express.Router = express.Router();

// Get all alert rules
router.get('/rules', authenticateToken, async (req, res) => {
  try {
    const rules = await alertService.getAlertRules();
    
    return res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Failed to get alert rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get alert rules'
    });
  }
});

// Create alert rule
router.post('/rules', authenticateToken, async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Validate required fields
    if (!ruleData.name || !ruleData.type || !ruleData.severity || !ruleData.condition) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, severity, condition'
      });
    }

    const rule = await alertService.createAlertRule(ruleData);
    
    return res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Failed to create alert rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create alert rule'
    });
  }
});

// Update alert rule
router.put('/rules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const success = await alertService.updateAlertRule(id, updates);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Alert rule updated successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }
  } catch (error) {
    logger.error('Failed to update alert rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update alert rule'
    });
  }
});

// Delete alert rule
router.delete('/rules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await alertService.deleteAlertRule(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Alert rule deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }
  } catch (error) {
    logger.error('Failed to delete alert rule:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete alert rule'
    });
  }
});

// Get alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, severity, limit } = req.query;
    const alerts = await alertService.getAlerts(
      status as string,
      severity as string,
      parseInt(limit as string) || 50
    );
    
    return res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Failed to get alerts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy } = req.body;
    
    if (!acknowledgedBy) {
      return res.status(400).json({
        success: false,
        message: 'acknowledgedBy field is required'
      });
    }
    
    const success = await alertService.acknowledgeAlert(id, acknowledgedBy);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
  } catch (error) {
    logger.error('Failed to acknowledge alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

// Resolve alert
router.post('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await alertService.resolveAlert(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
  } catch (error) {
    logger.error('Failed to resolve alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

// Get alert metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const metrics = await alertService.getAlertMetrics(days);
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get alert metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get alert metrics'
    });
  }
});

// Check alert conditions (manual trigger)
router.post('/check', authenticateToken, async (req, res) => {
  try {
    await alertService.checkAlertConditions();
    
    return res.json({
      success: true,
      message: 'Alert conditions checked successfully'
    });
  } catch (error) {
    logger.error('Failed to check alert conditions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check alert conditions'
    });
  }
});

export default router; 