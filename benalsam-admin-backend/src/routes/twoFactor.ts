import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { twoFactorService } from '../services/twoFactorService';
import { authRateLimiter } from '../middleware/rateLimit';
import logger from '../config/logger';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/database';

const router = Router();

/**
 * @route GET /api/v1/2fa/setup
 * @desc Get 2FA setup status
 * @access Private
 */
router.get('/setup', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.admin?.id || req.user?.id;
    const email = req.admin?.email || req.user?.email;

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
    logger.error('2FA setup failed', { error, userId: req.admin?.id || req.user?.id });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate 2FA setup'
    });
  }
});

/**
 * @route POST /api/v1/2fa/setup
 * @desc Generate 2FA setup (QR code and backup codes)
 * @access Private
 */
router.post('/setup', authenticateToken, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.admin?.id || req.user?.id;
    const email = req.admin?.email || req.user?.email;

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
      logger.error('2FA setup failed', { error, userId: req.admin?.id || req.user?.id });
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
router.post('/verify', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'User ID is required'
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
      logger.error('2FA verification failed', { error, userId: req.admin?.id || req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify token'
      });
    }
});

/**
 * @route POST /api/v1/2fa/verify-and-login
 * @desc Verify 2FA token and return admin session
 * @access Public (no auth required)
 */
router.post('/verify-and-login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, token, email, password } = req.body;

    if (!userId || !token || !email || !password) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'User ID, token, email, and password are required'
      });
    }

    // First verify 2FA token
    const result = await twoFactorService.verifyToken(userId, token);

    if (!result.success) {
      return res.status(400).json({
        error: 'Verification failed',
        message: result.message
      });
    }

    // 2FA verification successful, now get admin user and create session
    const { supabase } = await import('../config/database');
    const { ApiResponseUtil } = await import('../utils/response');
    
    // Get admin user
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (adminError || !admin) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Admin user not found'
      });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { jwtUtils } = await import('../utils/jwt');
    const jwtToken = jwtUtils.sign({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || []
    });
    const jwtRefreshToken = jwtUtils.signRefresh({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || []
    });

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Log activity
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: admin.id,
        action: 'LOGIN',
        resource: 'auth',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      });

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;

    // Return success response with tokens
    return res.json({
      success: true,
      data: {
        admin: adminWithoutPassword,
        token: jwtToken,
        refreshToken: jwtRefreshToken,
        requires2FA: false
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    logger.error('2FA verify and login failed', { error, userId: req.body?.userId });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify and login'
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
    const userId = req.admin?.id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { secret, verificationCode } = req.body;
    
    if (!secret || !verificationCode) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Secret and verification code are required'
      });
    }

    await twoFactorService.enableTwoFactor(userId, secret, verificationCode);

    return res.json({
      success: true,
      message: '2FA enabled successfully'
    });
      } catch (error) {
      logger.error('2FA enable failed', { error, userId: req.admin?.id || req.user?.id });
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
    const userId = req.admin?.id || req.user?.id;

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
      logger.error('2FA disable failed', { error, userId: req.admin?.id || req.user?.id });
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
    const userId = req.admin?.id || req.user?.id;

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
      logger.error('Backup codes regeneration failed', { error, userId: req.admin?.id || req.user?.id });
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
    const userId = req.admin?.id || req.user?.id;

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
      logger.error('2FA status check failed', { error, userId: req.admin?.id || req.user?.id });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check 2FA status'
      });
    }
});

// Debug profile status
router.get('/debug-profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.admin?.id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Get profile status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error getting profile:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get profile'
      });
    }

    return res.json({
      success: true,
      data: profile,
      message: 'Profile status retrieved'
    });
  } catch (error) {
    logger.error('Debug profile failed', { error, userId: req.admin?.id || req.user?.id });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to debug profile'
    });
  }
});

// Force enable 2FA for testing
router.post('/force-enable', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.admin?.id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Update profile to enable 2FA
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_2fa_enabled: true,
        two_factor_secret: 'TEST_SECRET_FOR_ADMIN'
      })
      .eq('id', userId);

    if (error) {
      logger.error('Error enabling 2FA:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to enable 2FA'
      });
    }

    return res.json({
      success: true,
      message: '2FA force enabled successfully'
    });
  } catch (error) {
    logger.error('2FA force enable failed', { error, userId: req.admin?.id || req.user?.id });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to force enable 2FA'
    });
  }
});

export default router;
