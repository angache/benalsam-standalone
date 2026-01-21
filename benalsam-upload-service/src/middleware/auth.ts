import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // For now, we'll use a simplified authentication that checks for x-user-id header
  // In production, this would verify a JWT token
  
  const userId = req.headers['x-user-id'] as string | undefined;
  
  // First try to get user ID from x-user-id header
  if (userId) {
    req.userId = userId;
    return next();
  }
  
  // For development purposes, allow requests without authentication
  // In production, uncomment the next lines:
  /*
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
  */
  
  // For now, set a default user ID for development
  req.userId = 'dev-user';
  next();
};