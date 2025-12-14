/**
 * AI Learning Admin Routes
 * 
 * @fileoverview Admin endpoints for AI learning system management
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { learningScheduler } from '../services/ai/learningScheduler';
import { learningService } from '../services/ai/learningService';
import { supabase } from '../config/database';
import { logger } from '../config/logger';

// Simple async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

const router = Router();

/**
 * GET /api/v1/ai-learning/status
 * Get learning system status
 */
router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  // Get some stats from database
  const { data: patterns, error } = await supabase
    .from('ai_learned_patterns')
    .select('category, pattern_type');

  const patternStats: Record<string, number> = {};
  if (patterns && !error) {
    for (const row of patterns) {
      const key = `${row.category}_${row.pattern_type}`;
      patternStats[key] = (patternStats[key] || 0) + 1;
    }
  }

  res.json({
    success: true,
    data: {
      scheduler: {
        running: true, // TODO: Track scheduler state
        lastAnalysis: null, // TODO: Track last analysis time
        nextAnalysis: null // TODO: Calculate next analysis time
      },
      patterns: patternStats || {},
      cache: {
        enabled: true,
        ttl: '24 hours'
      }
    }
  });
}));

/**
 * POST /api/v1/ai-learning/trigger-analysis
 * Manually trigger analysis of successful listings
 */
router.post('/trigger-analysis', asyncHandler(async (_req: Request, res: Response) => {
  logger.info('📚 Manual trigger: Analyzing successful listings');
  
  await learningScheduler.triggerAnalysis();
  
  res.json({
    success: true,
    message: 'Analysis triggered successfully'
  });
}));

/**
 * POST /api/v1/ai-learning/trigger-cleanup
 * Manually trigger cleanup of old patterns
 */
router.post('/trigger-cleanup', asyncHandler(async (_req: Request, res: Response) => {
  logger.info('🧹 Manual trigger: Cleaning up old patterns');
  
  await learningScheduler.triggerCleanup();
  
  res.json({
    success: true,
    message: 'Cleanup triggered successfully'
  });
}));

/**
 * GET /api/v1/ai-learning/patterns/:category
 * Get learned patterns for a category
 */
router.get('/patterns/:category', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  
  if (!category) {
    res.status(400).json({
      success: false,
      message: 'Category parameter is required'
    });
    return;
  }
  
  const patterns = await learningService.getLearnedPatterns(category);
  
  if (!patterns) {
    res.status(404).json({
      success: false,
      message: 'No patterns found for this category'
    });
    return;
  }
  
  res.json({
    success: true,
    data: patterns
  });
}));

export default router;

