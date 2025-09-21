import express, { Router } from 'express';
import predictiveCacheService from '../services/predictiveCacheService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: Predictive Cache Routes
 * 
 * Predictive cache routes KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ ANONYMIZED - Kişisel veri döndürülmez
 * ✅ PATTERN_BASED - Sadece davranış pattern'leri
 * ✅ TRANSPARENCY - Prediction süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli veriler döndürülür
 */

// Record user behavior
router.post('/behavior', async (req, res) => {
  try {
    const { sessionId, behavior } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID gerekli'
      });
    }
    
    predictiveCacheService.recordUserBehavior(sessionId, behavior);
    
    return res.json({
      success: true,
      message: 'User behavior recorded'
    });
  } catch (error) {
    logger.error('❌ Record behavior error:', error);
    return res.status(500).json({
      success: false,
      error: 'User behavior kaydedilemedi'
    });
  }
});

// Get current predictions
router.get('/predictions', async (req, res) => {
  try {
    const predictions = predictiveCacheService.getCurrentPredictions();
    
    return res.json({
      success: true,
      data: {
        predictions,
        count: predictions.length
      }
    });
  } catch (error) {
    logger.error('❌ Get predictions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Predictions alınamadı'
    });
  }
});

// Get model stats
router.get('/model-stats', async (req, res) => {
  try {
    const modelStats = predictiveCacheService.getModelStats();
    
    return res.json({
      success: true,
      data: modelStats
    });
  } catch (error) {
    logger.error('❌ Get model stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Model stats alınamadı'
    });
  }
});

// Get user behavior stats
router.get('/behavior-stats', async (req, res) => {
  try {
    const behaviorStats = predictiveCacheService.getUserBehaviorStats();
    
    return res.json({
      success: true,
      data: behaviorStats
    });
  } catch (error) {
    logger.error('❌ Get behavior stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Behavior stats alınamadı'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await predictiveCacheService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Predictive cache health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check başarısız'
    });
  }
});

// Get prediction accuracy
router.get('/accuracy', async (req, res) => {
  try {
    const modelStats = predictiveCacheService.getModelStats();
    const behaviorStats = predictiveCacheService.getUserBehaviorStats();
    
    const accuracy = {
      modelAccuracy: modelStats.accuracy,
      totalPredictions: modelStats.totalPredictions,
      successfulPredictions: modelStats.successfulPredictions,
      activeSessions: behaviorStats.activeSessions,
      averagePredictionScore: behaviorStats.averagePredictionScore
    };
    
    return res.json({
      success: true,
      data: accuracy
    });
  } catch (error) {
    logger.error('❌ Get accuracy error:', error);
    return res.status(500).json({
      success: false,
      error: 'Accuracy bilgisi alınamadı'
    });
  }
});

// Get prediction trends
router.get('/trends', async (req, res) => {
  try {
    const predictions = predictiveCacheService.getCurrentPredictions();
    const behaviorStats = predictiveCacheService.getUserBehaviorStats();
    
    // Calculate trends
    const highPriorityPredictions = predictions.filter(p => p.priority === 'high').length;
    const mediumPriorityPredictions = predictions.filter(p => p.priority === 'medium').length;
    const lowPriorityPredictions = predictions.filter(p => p.priority === 'low').length;
    
    const trends = {
      totalPredictions: predictions.length,
      highPriorityCount: highPriorityPredictions,
      mediumPriorityCount: mediumPriorityPredictions,
      lowPriorityCount: lowPriorityPredictions,
      activeSessions: behaviorStats.activeSessions,
      averageConfidence: predictions.length > 0 ? 
        predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length : 0
    };
    
    return res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('❌ Get trends error:', error);
    return res.status(500).json({
      success: false,
      error: 'Trends bilgisi alınamadı'
    });
  }
});

// Get prediction by type
router.get('/predictions/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const predictions = predictiveCacheService.getCurrentPredictions();
    
    const filteredPredictions = predictions.filter(p => p.dataType === type);
    
    return res.json({
      success: true,
      data: {
        predictions: filteredPredictions,
        count: filteredPredictions.length,
        type
      }
    });
  } catch (error) {
    logger.error('❌ Get predictions by type error:', error);
    return res.status(500).json({
      success: false,
      error: 'Type-based predictions alınamadı'
    });
  }
});

// Get high-confidence predictions
router.get('/predictions/priority/high', async (req, res) => {
  try {
    const predictions = predictiveCacheService.getCurrentPredictions();
    const highPriorityPredictions = predictions.filter(p => p.priority === 'high');
    
    return res.json({
      success: true,
      data: {
        predictions: highPriorityPredictions,
        count: highPriorityPredictions.length,
        priority: 'high'
      }
    });
  } catch (error) {
    logger.error('❌ Get high priority predictions error:', error);
    return res.status(500).json({
      success: false,
      error: 'High priority predictions alınamadı'
    });
  }
});

export default router; 