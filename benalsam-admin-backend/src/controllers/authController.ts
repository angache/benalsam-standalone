import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/database';
import { securityConfig } from '../config/app';
import { LoginDto, AdminRole, CreateAdminUserDto, JwtPayload } from '../types/admin-types';
import { ApiResponseUtil } from '../utils/response';
import { jwtUtils } from '../utils/jwt';
import logger from '../config/logger';
import { trackFailedLogin } from '../middleware/securityMonitor';

export class AuthController {
  // Admin login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginDto = req.body;

      logger.info(`Login attempt for email: ${email}`);

      // Validate input
      if (!email || !password) {
        ApiResponseUtil.badRequest(res, 'Email and password are required');
        return;
      }

      // Find admin user from Supabase
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      logger.info(`Supabase query result:`, { admin: !!admin, error });

      if (error || !admin) {
        logger.error(`Admin not found or error:`, error);
        // Track failed login attempt
        trackFailedLogin(req.ip || 'unknown', req.get('User-Agent'));
        ApiResponseUtil.unauthorized(res, 'Invalid credentials');
        return;
      }

      logger.info(`Admin found: ${admin.email}, is_active: ${admin.is_active}`);

      // Check if admin is active
      if (!admin.is_active) {
        ApiResponseUtil.unauthorized(res, 'Account is deactivated');
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      logger.info(`Password validation result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        // Track failed login attempt
        trackFailedLogin(req.ip || 'unknown', req.get('User-Agent'));
        ApiResponseUtil.unauthorized(res, 'Invalid credentials');
        return;
      }

      // Generate JWT token
      const payload: any = { // JwtPayload is not imported, using 'any' for now
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
      };

      const token = jwtUtils.sign(payload);
      const refreshToken = jwtUtils.signRefresh(payload);

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

      // Remove password from response first
      const { password: _, ...adminWithoutPassword } = admin;

      // Check if 2FA is required - now from admin_users table
      if (admin.is_2fa_enabled) {
        logger.info(`2FA required for admin: ${admin.email}`);
        
        // Return 2FA required response without creating session
        ApiResponseUtil.success(res, {
          admin: adminWithoutPassword,
          requires2FA: true,
        }, '2FA verification required');
        return;
      }

      logger.info(`Login successful for: ${admin.email}`);

      ApiResponseUtil.success(res, {
        admin: adminWithoutPassword,
        token,
        refreshToken,
        requires2FA: false,
      }, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      ApiResponseUtil.internalServerError(res, 'Login failed');
    }
  }

  // Create new admin user (Super Admin only)
  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, permissions } = req.body; // CreateAdminUserDto is not imported, using 'any' for now

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        ApiResponseUtil.badRequest(res, 'All fields are required');
        return;
      }

      // Check if email already exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingAdmin) {
        ApiResponseUtil.conflict(res, 'Email already exists');
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, securityConfig.bcryptRounds);

      // Create admin user
      const { data: newAdmin, error } = await supabase
        .from('admin_users')
        .insert({
          email: email.toLowerCase(),
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: role || AdminRole.ADMIN,
          permissions: permissions || [],
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create admin error:', error);
        ApiResponseUtil.internalServerError(res, 'Failed to create admin user');
        return;
      }

      // Create corresponding profile for admin user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newAdmin.id, // Use same ID as admin user
          email: newAdmin.email,
          name: `${firstName} ${lastName}`,
          avatar_url: null,
          is_admin: true, // Mark as admin profile
        });

      if (profileError) {
        logger.warn('Failed to create admin profile:', profileError);
        // Don't fail the admin creation, just log the warning
      }

      // Log activity
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: (req as any).admin.id,
          action: 'CREATE_ADMIN',
          resource: 'admin_users',
          resource_id: newAdmin.id,
          details: { created_admin_email: email },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        });

      // Remove password from response
      const { password: _, ...adminWithoutPassword } = newAdmin;

      ApiResponseUtil.created(res, adminWithoutPassword, 'Admin user created successfully');
    } catch (error) {
      logger.error('Create admin error:', error);
      ApiResponseUtil.internalServerError(res, 'Failed to create admin user');
    }
  }

  // Get current admin profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const admin = (req as any).admin;

      if (!admin) {
        ApiResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Remove password from response
      const { password: _, ...adminWithoutPassword } = admin;

      ApiResponseUtil.success(res, adminWithoutPassword, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile error:', error);
      ApiResponseUtil.internalServerError(res, 'Failed to get profile');
    }
  }

  // Update admin profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const admin = (req as any).admin;
      const { firstName, lastName, currentPassword, newPassword } = req.body;

      if (!admin) {
        ApiResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const updateData: any = {};

      // Update basic info
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;

      // Update password if provided
      if (currentPassword && newPassword) {
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
          ApiResponseUtil.badRequest(res, 'Current password is incorrect');
          return;
        }

        // Hash new password
        updateData.password = await bcrypt.hash(newPassword, securityConfig.bcryptRounds);
      }

      // Update admin
      const { data: updatedAdmin, error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', admin.id)
        .select()
        .single();

      if (error) {
        logger.error('Update profile error:', error);
        ApiResponseUtil.internalServerError(res, 'Failed to update profile');
        return;
      }

      // Log activity
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: admin.id,
          action: 'UPDATE_PROFILE',
          resource: 'admin_users',
          resource_id: admin.id,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        });

      // Remove password from response
      const { password: _, ...adminWithoutPassword } = updatedAdmin;

      ApiResponseUtil.success(res, adminWithoutPassword, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      ApiResponseUtil.internalServerError(res, 'Failed to update profile');
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        ApiResponseUtil.badRequest(res, 'Refresh token is required');
        return;
      }

      // Verify refresh token
      const decoded = await jwtUtils.verify(refreshToken);

      // Get admin user
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', decoded.adminId)
        .single();

      if (error || !admin || !admin.is_active) {
        ApiResponseUtil.unauthorized(res, 'Invalid refresh token');
        return;
      }

      // Generate new tokens
      const payload: any = { // JwtPayload is not imported, using 'any' for now
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
      };

      const newToken = jwtUtils.sign(payload);
      const newRefreshToken = jwtUtils.signRefresh(payload);

      ApiResponseUtil.success(res, {
        token: newToken,
        refreshToken: newRefreshToken,
      }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Refresh token error:', error);
      ApiResponseUtil.unauthorized(res, 'Invalid refresh token');
    }
  }

  // Logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const admin = (req as any).admin;

      if (admin) {
        // Log activity
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: admin.id,
            action: 'LOGOUT',
            resource: 'auth',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
          });
      }

      ApiResponseUtil.success(res, null, 'Logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      ApiResponseUtil.success(res, null, 'Logout successful');
    }
  }
} 