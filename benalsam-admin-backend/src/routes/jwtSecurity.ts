import express, { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { jwtSecurityService } from '../services/jwtSecurityService';
import { AdminRole } from '../types/admin-types';
import { AuthenticatedRequest } from '../types';
import logger from '../config/logger';

const router: Router = express.Router();

/**
 * Get JWT security status
 */
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await jwtSecurityService.getSecurityStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting JWT security status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Force JWT secret rotation (Super Admin only)
 */
router.post('/rotate-secret', authenticateToken, requireRole(AdminRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await jwtSecurityService.forceRotation();
    
    if (result.success) {
      logger.warn('JWT secret rotation forced by admin', {
        adminId: req.admin?.id,
        adminEmail: req.admin?.email,
        rotationTime: result.rotationTime
      });
      
      res.json({
        success: true,
        message: 'JWT secret rotated successfully',
        data: {
          rotationTime: result.rotationTime,
          nextRotation: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to rotate JWT secret',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error forcing JWT secret rotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rotate JWT secret',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Blacklist a token (logout)
 */
router.post('/blacklist', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    await jwtSecurityService.blacklistToken(token);
    
    res.json({
      success: true,
      message: 'Token blacklisted successfully'
    });
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to blacklist token',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clean up expired blacklisted tokens (Super Admin only)
 */
router.post('/cleanup-blacklist', authenticateToken, requireRole(AdminRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cleaned = await jwtSecurityService.cleanupBlacklist();
    
    logger.info('Blacklist cleanup performed by admin', {
      adminId: req.admin?.id,
      adminEmail: req.admin?.email,
      cleanedTokens: cleaned
    });
    
    res.json({
      success: true,
      message: 'Blacklist cleanup completed',
      data: {
        cleanedTokens: cleaned
      }
    });
  } catch (error) {
    logger.error('Error cleaning up blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup blacklist',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test JWT token validation
 */
router.post('/test-validation', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    const result = await jwtSecurityService.verify(token);
    
    res.json({
      success: true,
      data: {
        valid: result.valid,
        needsRefresh: result.needsRefresh,
        rotationRequired: result.rotationRequired,
        error: result.error
      }
    });
  } catch (error) {
    logger.error('Error testing token validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test token validation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get JWT security recommendations
 */
router.get('/recommendations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await jwtSecurityService.getSecurityStatus();
    const recommendations = [];
    
    // Check rotation timing
    const hoursUntilRotation = status.timeUntilRotation / (1000 * 60 * 60);
    if (hoursUntilRotation < 2) {
      recommendations.push({
        type: 'warning',
        message: 'JWT secret rotation is due soon',
        action: 'Consider rotating the secret manually'
      });
    }
    
    // Check blacklist size
    if (status.blacklistedTokens > 1000) {
      recommendations.push({
        type: 'info',
        message: 'Large number of blacklisted tokens',
        action: 'Consider running blacklist cleanup'
      });
    }
    
    // Check if previous secret exists
    if (!status.hasPreviousSecret) {
      recommendations.push({
        type: 'info',
        message: 'No previous secret available for rotation',
        action: 'This is normal for first-time setup'
      });
    }
    
    res.json({
      success: true,
      data: {
        recommendations,
        status
      }
    });
  } catch (error) {
    logger.error('Error getting JWT security recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
