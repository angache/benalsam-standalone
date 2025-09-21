import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { AdminRole, Permission } from '../types/admin-types';
import { ApiResponseUtil } from '../utils/response';
import { jwtUtils } from '../utils/jwt';
import { PermissionService } from '../services/permissionService';
import logger from '../config/logger';

// Re-export AuthenticatedRequest for use in routes
export { AuthenticatedRequest } from '../types';

export interface AuthMiddlewareOptions {
  requiredRole?: AdminRole;
  requiredPermissions?: string[];
  requiredResource?: string;
  requiredAction?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth middleware - Token:', token ? 'Token exists' : 'No token');
    console.log('🔐 Auth middleware - Auth header:', authHeader);

    if (!token) {
      console.log('❌ No token provided');
      ApiResponseUtil.unauthorized(res, 'Access token required');
      return;
    }

    console.log('🔐 Verifying token...');
    
    // First try to verify as admin token
    try {
      const decoded = await jwtUtils.verify(token);
      console.log('🔐 Token decoded as admin:', decoded);
      
      // Get admin user from Supabase
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', decoded.adminId)
        .single();

      if (!error && admin && admin.is_active) {
        // Get user permissions
        const permissions = await PermissionService.getAdminPermissions(admin.id);

        // Update last login
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', admin.id);

        console.log('✅ Auth successful for admin:', admin.email);
        req.admin = {
          ...admin,
          permissions
        };
        next();
        return;
      }
    } catch (adminError) {
      console.log('🔐 Not an admin token, trying Supabase token...');
    }

    // If not admin token, try as Supabase token
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.log('❌ Supabase user not found:', { error, user: !!user });
        ApiResponseUtil.unauthorized(res, 'Invalid token');
        return;
      }

      console.log('✅ Auth successful for user:', user.email);
      req.user = user;
      next();
    } catch (userError) {
      console.log('❌ Both admin and user auth failed');
      logger.error('Authentication error:', userError);
      ApiResponseUtil.unauthorized(res, 'Invalid token');
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    ApiResponseUtil.unauthorized(res, 'Invalid token');
  }
};

export const requireRole = (requiredRole: AdminRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      ApiResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    const roleHierarchy = {
      [AdminRole.SUPPORT]: 1,
      [AdminRole.MODERATOR]: 2,
      [AdminRole.CONTENT_MANAGER]: 3,
      [AdminRole.ANALYTICS_MANAGER]: 4,
      [AdminRole.CATEGORY_MANAGER]: 5,
      [AdminRole.USER_MANAGER]: 6,
      [AdminRole.ADMIN]: 7,
      [AdminRole.SUPER_ADMIN]: 8,
    };

    const userRoleLevel = roleHierarchy[req.admin.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      ApiResponseUtil.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.admin) {
      ApiResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    // Super admin has all permissions
    if (req.admin.role === AdminRole.SUPER_ADMIN) {
      next();
      return;
    }

    const permissionName = `${resource}:${action}`;
    const hasPermission = req.admin.permissions?.some(
      (permission: Permission) => permission.name === permissionName
    );

    if (!hasPermission) {
      ApiResponseUtil.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.admin) {
      ApiResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    // Super admin has all permissions
    if (req.admin.role === AdminRole.SUPER_ADMIN) {
      next();
      return;
    }

    const userPermissions = req.admin.permissions?.map((p: Permission) => p.name) || [];
    const hasAnyPermission = permissions.some(permission => userPermissions.includes(permission));

    if (!hasAnyPermission) {
      ApiResponseUtil.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const requireAllPermissions = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.admin) {
      ApiResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    // Super admin has all permissions
    if (req.admin.role === AdminRole.SUPER_ADMIN) {
      next();
      return;
    }

    const userPermissions = req.admin.permissions?.map((p: Permission) => p.name) || [];
    const hasAllPermissions = permissions.every(permission => userPermissions.includes(permission));

    if (!hasAllPermissions) {
      ApiResponseUtil.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const authMiddleware = (options: AuthMiddlewareOptions = {}) => {
  const middleware: any[] = [authenticateToken];

  // Add role requirement
  if (options.requiredRole) {
    middleware.push(requireRole(options.requiredRole));
  }

  // Add permission requirements
  if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    if (options.requiredPermissions.length === 1) {
      const [resource, action] = options.requiredPermissions[0].split(':');
      middleware.push(requirePermission(resource, action));
    } else {
      middleware.push(requireAnyPermission(options.requiredPermissions));
    }
  }

  // Add resource/action requirements
  if (options.requiredResource && options.requiredAction) {
    middleware.push(requirePermission(options.requiredResource, options.requiredAction));
  }

  return middleware;
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await jwtUtils.verify(token);
      
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', decoded.adminId)
        .single();

      if (admin && admin.is_active) {
        // Get user permissions
        const permissions = await PermissionService.getAdminPermissions(admin.id);
        req.admin = {
          ...admin,
          permissions
        };
      }
    }
  } catch (error) {
    // Silently ignore token errors for optional auth
    logger.debug('Optional auth token error:', error);
  }

  next();
};

// Supabase JWT authentication for mobile app analytics
export const authenticateSupabaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔐 Token exists:', !!token);

    if (!token) {
      console.log('❌ No token provided');
      ApiResponseUtil.unauthorized(res, 'Access token required');
      return;
    }

    console.log('🔐 Token length:', token.length);
    console.log('🔐 Token preview:', token.substring(0, 20) + '...');

    // Decode Supabase JWT token (without signature verification for now)
    const decoded = jwtUtils.verifySupabaseToken(token);
    console.log('🔐 Token decoded successfully');
    
    // Get user from Supabase using the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Supabase user error:', error);
      ApiResponseUtil.unauthorized(res, 'Invalid user token');
      return;
    }

    console.log('✅ User authenticated:', user.id);

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: 'user'
    };
    next();
  } catch (error) {
    console.log('❌ Authentication error:', error);
    logger.error('Supabase authentication error:', error);
    ApiResponseUtil.unauthorized(res, 'Invalid token');
  }
}; 