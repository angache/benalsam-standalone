/**
 * Authentication Middleware
 * 
 * @fileoverview Authentication middleware for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Get user ID from header (simplified for now)
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Set user in request (simplified for now)
    req.user = {
      id: userId,
      email: `user-${userId}@example.com`,
      role: 'user'
    };

    next();
  } catch (error) {
    logger.error('❌ Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
