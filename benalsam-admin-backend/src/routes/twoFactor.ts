import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { twoFactorService } from '../services/twoFactorService';
import { authRateLimiter } from '../middleware/rateLimit';
import logger from '../config/logger';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @route POST /api/v1/2fa/setup
 * @desc Generate 2FA setup (QR code and backup codes)
 * @access Private
 */
router.post('/setup', authenticateToken, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const setup = await twoFactorService.generateSetup(userId, email);

    return res.json({
      success: true,
      data: {
        secret: setup.secret,
        qrCode: setup.qrCode,
        backupCodes: setup.backupCodes
      },
      message: '2FA setup generated successfully'
    });
      } catch (error) {
      logger.error('2FA setup failed', { error, userId: req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate 2FA setup'
      });
    }
});

/**
 * @route POST /api/v1/2fa/verify
 * @desc Verify 2FA token
 * @access Private
 */
router.post('/verify', authenticateToken, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (!token) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Token is required'
      });
    }

    const result = await twoFactorService.verifyToken(userId, token);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        backupCodeUsed: result.backupCodeUsed
      });
    } else {
      return res.status(400).json({
        error: 'Verification failed',
        message: result.message
      });
    }
      } catch (error) {
      logger.error('2FA verification failed', { error, userId: req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify token'
      });
    }
});

/**
 * @route POST /api/v1/2fa/enable
 * @desc Enable 2FA for user
 * @access Private
 */
router.post('/enable', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    await twoFactorService.enableTwoFactor(userId);

    return res.json({
      success: true,
      message: '2FA enabled successfully'
    });
      } catch (error) {
      logger.error('2FA enable failed', { error, userId: req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to enable 2FA'
      });
    }
});

/**
 * @route POST /api/v1/2fa/disable
 * @desc Disable 2FA for user
 * @access Private
 */
router.post('/disable', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    await twoFactorService.disableTwoFactor(userId);

    return res.json({
      success: true,
      message: '2FA disabled successfully'
    });
      } catch (error) {
      logger.error('2FA disable failed', { error, userId: req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to disable 2FA'
      });
    }
});

/**
 * @route POST /api/v1/2fa/backup-codes/regenerate
 * @desc Regenerate backup codes
 * @access Private
 */
router.post('/backup-codes/regenerate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const backupCodes = await twoFactorService.regenerateBackupCodes(userId);

    return res.json({
      success: true,
      data: {
        backupCodes
      },
      message: 'Backup codes regenerated successfully'
    });
      } catch (error) {
      logger.error('Backup codes regeneration failed', { error, userId: req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to regenerate backup codes'
      });
    }
});

/**
 * @route GET /api/v1/2fa/status
 * @desc Get 2FA status for user
 * @access Private
 */
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const isEnabled = await twoFactorService.isTwoFactorEnabled(userId);

    return res.json({
      success: true,
      data: {
        isEnabled
      }
    });
      } catch (error) {
      logger.error('2FA status check failed', { error, userId: req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check 2FA status'
      });
    }
});

export default router;
