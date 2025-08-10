import { Request, Response } from 'express';
import { supabase } from '../config/database';
import {
  AdminUser,
  AdminRole,
  Permission,
  AdminRoleDefinition,
  AdminApiResponse,
  CreateAdminUserDto,
  UpdateAdminUserDto
} from '../types/admin-types';
import { ApiResponseUtil } from '../utils/response';
import { PermissionService } from '../services/permissionService';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';

export class AdminManagementController {
  // Get all admin users with pagination and filters
  static async getAdminUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role = '',
        isActive = ''
      } = req.query;

      let query = supabase
        .from('admin_users')
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      if (isActive !== '') {
        query = query.eq('is_active', isActive === 'true');
      }

      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data: admins, error, count } = await query;

      if (error) {
        logger.error('Error fetching admin users:', error);
        ApiResponseUtil.error(res, 'Failed to fetch admin users');
        return;
      }

      // Get role details for each admin
      const adminsWithRoles = await Promise.all(
        (admins || []).map(async (admin) => {
          const roleDetails = await PermissionService.getRoleByName(admin.role);
          return {
            ...admin,
            roleDetails
          };
        })
      );

      const totalPages = Math.ceil((count || 0) / Number(limit));

      const response: AdminApiResponse<AdminUser[]> = {
        success: true,
        data: adminsWithRoles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAdminUsers:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Get single admin user by ID
  static async getAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !admin) {
        ApiResponseUtil.notFound(res, 'Admin user not found');
        return;
      }

      // Get role details and permissions
      const [roleDetails, userPermissions] = await Promise.all([
        PermissionService.getRoleByName(admin.role),
        PermissionService.getUserPermissions(id)
      ]);

      const adminWithDetails = {
        ...admin,
        roleDetails,
        userPermissions
      };

      ApiResponseUtil.success(res, adminWithDetails);
    } catch (error) {
      logger.error('Error in getAdminUser:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Create new admin user
  static async createAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const adminData: CreateAdminUserDto = req.body;

      // Validate required fields
      if (!adminData.email || !adminData.password || !adminData.firstName || !adminData.lastName) {
        ApiResponseUtil.badRequest(res, 'Missing required fields');
        return;
      }

      // Check if email already exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', adminData.email)
        .single();

      if (existingAdmin) {
        ApiResponseUtil.badRequest(res, 'Email already exists');
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // Create admin user
      const { data: newAdmin, error } = await supabase
        .from('admin_users')
        .insert({
          email: adminData.email,
          password: hashedPassword,
          first_name: adminData.firstName,
          last_name: adminData.lastName,
          role: adminData.role || AdminRole.SUPPORT,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating admin user:', error);
        ApiResponseUtil.error(res, 'Failed to create admin user');
        return;
      }

      // Grant additional permissions if specified
      if (adminData.permissions && adminData.permissions.length > 0) {
        const currentUser = (req as any).admin;
        for (const permissionId of adminData.permissions) {
          await PermissionService.grantUserPermission(
            newAdmin.id,
            permissionId,
            currentUser.id
          );
        }
      }

      ApiResponseUtil.success(res, newAdmin, 'Admin user created successfully');
    } catch (error) {
      logger.error('Error in createAdminUser:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Update admin user
  static async updateAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateAdminUserDto = req.body;
      const currentUser = (req as any).admin;

      // Check if user can manage this admin
      const canManage = await PermissionService.canManageUser(currentUser.id, id);
      if (!canManage) {
        ApiResponseUtil.forbidden(res, 'Cannot manage this user');
        return;
      }

      // Get existing admin
      const { data: existingAdmin, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingAdmin) {
        ApiResponseUtil.notFound(res, 'Admin user not found');
        return;
      }

      // Prepare update data
      const updateFields: any = {};
      if (updateData.firstName) updateFields.first_name = updateData.firstName;
      if (updateData.lastName) updateFields.last_name = updateData.lastName;
      if (updateData.role) updateFields.role = updateData.role;
      if (typeof updateData.isActive === 'boolean') updateFields.is_active = updateData.isActive;

      // Update admin user
      const { data: updatedAdmin, error } = await supabase
        .from('admin_users')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating admin user:', error);
        ApiResponseUtil.error(res, 'Failed to update admin user');
        return;
      }

      // Update user permissions if specified
      if (updateData.permissions) {
        // Remove existing user-specific permissions
        const existingPermissions = await PermissionService.getUserPermissions(id);
        for (const perm of existingPermissions) {
          await PermissionService.revokeUserPermission(id, perm.permission_id);
        }

        // Grant new permissions
        for (const permissionId of updateData.permissions) {
          await PermissionService.grantUserPermission(
            id,
            permissionId,
            currentUser.id
          );
        }
      }

      ApiResponseUtil.success(res, updatedAdmin, 'Admin user updated successfully');
    } catch (error) {
      logger.error('Error in updateAdminUser:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Delete admin user
  static async deleteAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = (req as any).admin;

      // Prevent self-deletion
      if (currentUser.id === id) {
        ApiResponseUtil.badRequest(res, 'Cannot delete your own account');
        return;
      }

      // Check if user can manage this admin
      const canManage = await PermissionService.canManageUser(currentUser.id, id);
      if (!canManage) {
        ApiResponseUtil.forbidden(res, 'Cannot manage this user');
        return;
      }

      // Delete admin user
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting admin user:', error);
        ApiResponseUtil.error(res, 'Failed to delete admin user');
        return;
      }

      ApiResponseUtil.success(res, null, 'Admin user deleted successfully');
    } catch (error) {
      logger.error('Error in deleteAdminUser:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Get all roles
  static async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await PermissionService.getAllRoles();
      ApiResponseUtil.success(res, roles);
    } catch (error) {
      logger.error('Error in getRoles:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Get role details with permissions
  static async getRoleDetails(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      const [roleDetails, rolePermissions, availablePermissions] = await Promise.all([
        PermissionService.getRoleByName(role),
        PermissionService.getRolePermissions(role as AdminRole),
        PermissionService.getAvailablePermissionsForRole(role as AdminRole)
      ]);

      if (!roleDetails) {
        ApiResponseUtil.notFound(res, 'Role not found');
        return;
      }

      const response = {
        role: roleDetails,
        permissions: rolePermissions,
        availablePermissions
      };

      ApiResponseUtil.success(res, response);
    } catch (error) {
      logger.error('Error in getRoleDetails:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Update role permissions
  static async updateRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        ApiResponseUtil.badRequest(res, 'permissionIds must be an array');
        return;
      }

      await PermissionService.updateRolePermissions(role as AdminRole, permissionIds);
      ApiResponseUtil.success(res, null, 'Role permissions updated successfully');
    } catch (error) {
      logger.error('Error in updateRolePermissions:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Get all permissions
  static async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { resource } = req.query;

      let permissions: Permission[];
      if (resource) {
        permissions = await PermissionService.getPermissionsByResource(resource as string);
      } else {
        permissions = await PermissionService.getAllPermissions();
      }

      ApiResponseUtil.success(res, permissions);
    } catch (error) {
      logger.error('Error in getPermissions:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Get permission matrix
  static async getPermissionMatrix(req: Request, res: Response): Promise<void> {
    try {
      const matrix = await PermissionService.getPermissionMatrix();
      ApiResponseUtil.success(res, matrix);
    } catch (error) {
      logger.error('Error in getPermissionMatrix:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }

  // Get current user permissions
  static async getCurrentUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = (req as any).admin;
      const permissions = await PermissionService.getAdminPermissions(currentUser.id);
      ApiResponseUtil.success(res, permissions);
    } catch (error) {
      logger.error('Error in getCurrentUserPermissions:', error);
      ApiResponseUtil.error(res, 'Internal server error');
    }
  }
} 