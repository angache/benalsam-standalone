import express, { Router } from 'express';
import smartInvalidationService from '../services/smartInvalidationService';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * KVKK COMPLIANCE: Smart Invalidation Routes
 * 
 * Smart invalidation routes KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ INTELLIGENT_CLEANUP - Akıllı temizlik algoritmaları
 * ✅ PATTERN_RECOGNITION - Pattern tabanlı invalidation
 * ✅ DEPENDENCY_TRACKING - İlişkili veri takibi
 * ✅ TRANSPARENCY - Invalidation kuralları açık
 */

// Get smart invalidation statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = smartInvalidationService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Smart invalidation stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Smart invalidation stats alınamadı'
    });
  }
});

// Get all patterns
router.get('/patterns', async (req, res) => {
  try {
    const patterns = smartInvalidationService.getPatterns();
    
    return res.json({
      success: true,
      data: {
        patterns,
        count: patterns.length
      }
    });
  } catch (error) {
    logger.error('❌ Get patterns error:', error);
    return res.status(500).json({
      success: false,
      error: 'Patterns alınamadı'
    });
  }
});

// Get all rules
router.get('/rules', async (req, res) => {
  try {
    const rules = smartInvalidationService.getRules();
    
    return res.json({
      success: true,
      data: {
        rules,
        count: rules.length
      }
    });
  } catch (error) {
    logger.error('❌ Get rules error:', error);
    return res.status(500).json({
      success: false,
      error: 'Rules alınamadı'
    });
  }
});

// Get all dependencies
router.get('/dependencies', async (req, res) => {
  try {
    const dependencies = smartInvalidationService.getDependencies();
    
    return res.json({
      success: true,
      data: {
        dependencies,
        count: dependencies.length
      }
    });
  } catch (error) {
    logger.error('❌ Get dependencies error:', error);
    return res.status(500).json({
      success: false,
      error: 'Dependencies alınamadı'
    });
  }
});

// Add dependency
router.post('/dependency', async (req, res) => {
  try {
    const { key, dependencies } = req.body;
    
    if (!key || !dependencies) {
      return res.status(400).json({
        success: false,
        error: 'Key ve dependencies gerekli'
      });
    }
    
    smartInvalidationService.addDependency(key, dependencies);
    
    return res.json({
      success: true,
      message: 'Dependency eklendi'
    });
  } catch (error) {
    logger.error('❌ Add dependency error:', error);
    return res.status(500).json({
      success: false,
      error: 'Dependency eklenemedi'
    });
  }
});

// Invalidate with cascade
router.post('/invalidate-cascade', async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Key gerekli'
      });
    }
    
    const result = await smartInvalidationService.invalidateWithCascade(key);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('❌ Invalidate cascade error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cascade invalidation başarısız'
    });
  }
});

// Get pattern by type
router.get('/patterns/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const patterns = smartInvalidationService.getPatterns();
    
    const filteredPatterns = patterns.filter(p => p.id.includes(type));
    
    return res.json({
      success: true,
      data: {
        patterns: filteredPatterns,
        count: filteredPatterns.length,
        type
      }
    });
  } catch (error) {
    logger.error('❌ Get patterns by type error:', error);
    return res.status(500).json({
      success: false,
      error: 'Type-based patterns alınamadı'
    });
  }
});

// Get rules by priority
router.get('/rules/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const rules = smartInvalidationService.getRules();
    
    const filteredRules = rules.filter(r => r.priority === priority);
    
    return res.json({
      success: true,
      data: {
        rules: filteredRules,
        count: filteredRules.length,
        priority
      }
    });
  } catch (error) {
    logger.error('❌ Get rules by priority error:', error);
    return res.status(500).json({
      success: false,
      error: 'Priority-based rules alınamadı'
    });
  }
});

// Get high confidence patterns
router.get('/patterns/confidence/high', async (req, res) => {
  try {
    const patterns = smartInvalidationService.getPatterns();
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    
    return res.json({
      success: true,
      data: {
        patterns: highConfidencePatterns,
        count: highConfidencePatterns.length,
        confidence: 'high'
      }
    });
  } catch (error) {
    logger.error('❌ Get high confidence patterns error:', error);
    return res.status(500).json({
      success: false,
      error: 'High confidence patterns alınamadı'
    });
  }
});

// Get pattern performance
router.get('/patterns/performance', async (req, res) => {
  try {
    const patterns = smartInvalidationService.getPatterns();
    
    const performance = patterns.map(pattern => ({
      id: pattern.id,
      name: pattern.name,
      confidence: pattern.confidence,
      frequency: pattern.frequency,
      lastTriggered: pattern.lastTriggered,
      timeSinceLastTrigger: Date.now() - pattern.lastTriggered,
      performance: pattern.frequency > 0 ? pattern.confidence * (pattern.frequency / 10) : 0
    }));
    
    return res.json({
      success: true,
      data: {
        performance,
        count: performance.length
      }
    });
  } catch (error) {
    logger.error('❌ Get pattern performance error:', error);
    return res.status(500).json({
      success: false,
      error: 'Pattern performance alınamadı'
    });
  }
});

// Get dependency graph
router.get('/dependency-graph', async (req, res) => {
  try {
    const dependencies = smartInvalidationService.getDependencies();
    
    const graph = dependencies.map(dep => ({
      key: dep.key,
      dependencies: dep.dependencies,
      dependents: dep.dependents,
      dependencyCount: dep.dependencies.length,
      dependentCount: dep.dependents.length,
      lastAccessed: dep.lastAccessed,
      accessCount: dep.accessCount,
      invalidationScore: dep.invalidationScore
    }));
    
    return res.json({
      success: true,
      data: {
        graph,
        count: graph.length,
        totalDependencies: graph.reduce((sum, g) => sum + g.dependencyCount, 0),
        totalDependents: graph.reduce((sum, g) => sum + g.dependentCount, 0)
      }
    });
  } catch (error) {
    logger.error('❌ Get dependency graph error:', error);
    return res.status(500).json({
      success: false,
      error: 'Dependency graph alınamadı'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await smartInvalidationService.healthCheck();
    
    return res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Smart invalidation health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check başarısız'
    });
  }
});

// Get invalidation summary
router.get('/summary', async (req, res) => {
  try {
    const stats = smartInvalidationService.getStats();
    const patterns = smartInvalidationService.getPatterns();
    const rules = smartInvalidationService.getRules();
    const dependencies = smartInvalidationService.getDependencies();
    
    const summary = {
      stats,
      patterns: {
        total: patterns.length,
        active: patterns.filter(p => p.confidence > 0.7).length,
        highConfidence: patterns.filter(p => p.confidence > 0.8).length
      },
      rules: {
        total: rules.length,
        highPriority: rules.filter(r => r.priority === 'high').length,
        mediumPriority: rules.filter(r => r.priority === 'medium').length,
        lowPriority: rules.filter(r => r.priority === 'low').length
      },
      dependencies: {
        total: dependencies.length,
        withDependents: dependencies.filter(d => d.dependents.length > 0).length,
        withDependencies: dependencies.filter(d => d.dependencies.length > 0).length
      }
    };
    
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('❌ Get summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Summary alınamadı'
    });
  }
});

export default router; 