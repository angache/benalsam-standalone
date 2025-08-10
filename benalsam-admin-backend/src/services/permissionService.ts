import { supabase } from '../config/database';
import { Permission, RolePermission, UserPermission, AdminRole, AdminRoleDefinition } from '../types/admin-types';
import logger from '../config/logger';

export class PermissionService {
  // Get all permissions for an admin user (role + user-specific)
  static async getAdminPermissions(adminId: string): Promise<Permission[]> {
    try {
      // Geçici çözüm: Migration çalıştırılmadığı için manuel permission döndür
      logger.warn('Using fallback permissions for admin:', adminId);
      
      // Super admin için tüm permission'ları döndür
      const { data: admin } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', adminId)
        .single();

      if (admin?.role === 'SUPER_ADMIN') {
        const now = new Date().toISOString();
        return [
          { id: '1', name: 'dashboard:view', resource: 'dashboard', action: 'view', created_at: now, updated_at: now },
          { id: '2', name: 'listings:view', resource: 'listings', action: 'view', created_at: now, updated_at: now },
          { id: '3', name: 'listings:moderate', resource: 'listings', action: 'moderate', created_at: now, updated_at: now },
          { id: '4', name: 'categories:view', resource: 'categories', action: 'view', created_at: now, updated_at: now },
          { id: '5', name: 'categories:edit', resource: 'categories', action: 'edit', created_at: now, updated_at: now },
          { id: '6', name: 'categories:delete', resource: 'categories', action: 'delete', created_at: now, updated_at: now },
          { id: '7', name: 'users:view', resource: 'users', action: 'view', created_at: now, updated_at: now },
          { id: '8', name: 'users:manage', resource: 'users', action: 'manage', created_at: now, updated_at: now },
          { id: '9', name: 'users:ban', resource: 'users', action: 'ban', created_at: now, updated_at: now },
          { id: '10', name: 'users:delete', resource: 'users', action: 'delete', created_at: now, updated_at: now },
          { id: '11', name: 'admins:view', resource: 'admins', action: 'view', created_at: now, updated_at: now },
          { id: '12', name: 'admins:create', resource: 'admins', action: 'create', created_at: now, updated_at: now },
          { id: '13', name: 'admins:edit', resource: 'admins', action: 'edit', created_at: now, updated_at: now },
          { id: '14', name: 'admins:delete', resource: 'admins', action: 'delete', created_at: now, updated_at: now },
          { id: '15', name: 'admins:roles', resource: 'admins', action: 'roles', created_at: now, updated_at: now }
        ];
      }

      return [];
    } catch (error) {
      logger.error('Error in getAdminPermissions:', error);
      return [];
    }
  }

  // Check if admin has specific permission
  static async hasPermission(adminId: string, permissionName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('has_admin_permission', { 
          p_admin_id: adminId, 
          p_permission_name: permissionName 
        });

      if (error) {
        logger.error('Error checking permission:', error);
        throw error;
      }

      return data || false;
    } catch (error) {
      logger.error('Error in hasPermission:', error);
      throw error;
    }
  }

  // Check if admin has permission for resource and action
  static async hasResourcePermission(adminId: string, resource: string, action: string): Promise<boolean> {
    try {
      const permissionName = `${resource}:${action}`;
      return await this.hasPermission(adminId, permissionName);
    } catch (error) {
      logger.error('Error in hasResourcePermission:', error);
      throw error;
    }
  }

  // Get all permissions
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('resource, action');

      if (error) {
        logger.error('Error getting all permissions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAllPermissions:', error);
      throw error;
    }
  }

  // Get permissions by resource
  static async getPermissionsByResource(resource: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('resource', resource)
        .order('action');

      if (error) {
        logger.error('Error getting permissions by resource:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getPermissionsByResource:', error);
      throw error;
    }
  }

  // Get all roles
  static async getAllRoles(): Promise<AdminRoleDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false });

      if (error) {
        logger.error('Error getting all roles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAllRoles:', error);
      throw error;
    }
  }

  // Get role by name
  static async getRoleByName(name: string): Promise<AdminRoleDefinition | null> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        logger.error('Error getting role by name:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in getRoleByName:', error);
      throw error;
    }
  }

  // Get role permissions
  static async getRolePermissions(role: AdminRole): Promise<Permission[]> {
    try {
      // First get permission IDs for the role
      const { data: rolePermissions, error: roleError } = await supabase
        .from('admin_role_permissions')
        .select('permission_id')
        .eq('role', role);

      if (roleError) {
        logger.error('Error getting role permission IDs:', roleError);
        throw roleError;
      }

      if (!rolePermissions || rolePermissions.length === 0) {
        return [];
      }

      // Then get the actual permissions
      const permissionIds = rolePermissions.map(rp => rp.permission_id);
      const { data: permissions, error: permError } = await supabase
        .from('admin_permissions')
        .select('*')
        .in('id', permissionIds)
        .order('resource, action');

      if (permError) {
        logger.error('Error getting permissions:', permError);
        throw permError;
      }

      return permissions || [];
    } catch (error) {
      logger.error('Error in getRolePermissions:', error);
      throw error;
    }
  }

  // Get user-specific permissions
  static async getUserPermissions(adminId: string): Promise<UserPermission[]> {
    try {
      const { data, error } = await supabase
        .from('admin_user_permissions')
        .select(`
          *,
          admin_permissions (*)
        `)
        .eq('admin_id', adminId);

      if (error) {
        logger.error('Error getting user permissions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getUserPermissions:', error);
      throw error;
    }
  }

  // Grant permission to user
  static async grantUserPermission(
    adminId: string, 
    permissionId: string, 
    grantedBy: string
  ): Promise<UserPermission> {
    try {
      const { data, error } = await supabase
        .from('admin_user_permissions')
        .insert({
          admin_id: adminId,
          permission_id: permissionId,
          granted_by: grantedBy
        })
        .select()
        .single();

      if (error) {
        logger.error('Error granting user permission:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in grantUserPermission:', error);
      throw error;
    }
  }

  // Revoke permission from user
  static async revokeUserPermission(adminId: string, permissionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_user_permissions')
        .delete()
        .eq('admin_id', adminId)
        .eq('permission_id', permissionId);

      if (error) {
        logger.error('Error revoking user permission:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error in revokeUserPermission:', error);
      throw error;
    }
  }

  // Update role permissions
  static async updateRolePermissions(role: AdminRole, permissionIds: string[]): Promise<void> {
    try {
      // First, remove all existing permissions for this role
      const { error: deleteError } = await supabase
        .from('admin_role_permissions')
        .delete()
        .eq('role', role);

      if (deleteError) {
        logger.error('Error deleting role permissions:', deleteError);
        throw deleteError;
      }

      // Then, insert new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          role,
          permission_id: permissionId
        }));

        const { error: insertError } = await supabase
          .from('admin_role_permissions')
          .insert(rolePermissions);

        if (insertError) {
          logger.error('Error inserting role permissions:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      logger.error('Error in updateRolePermissions:', error);
      throw error;
    }
  }

  // Get permission matrix for all roles
  static async getPermissionMatrix(): Promise<Record<string, Permission[]>> {
    try {
      const roles = await this.getAllRoles();
      const matrix: Record<string, Permission[]> = {};

      for (const role of roles) {
        matrix[role.name] = await this.getRolePermissions(role.name as AdminRole);
      }

      return matrix;
    } catch (error) {
      logger.error('Error in getPermissionMatrix:', error);
      throw error;
    }
  }

  // Check if user can manage another user
  static async canManageUser(managerId: string, targetUserId: string): Promise<boolean> {
    try {
      // Get both users
      const { data: manager, error: managerError } = await supabase
        .from('admin_users')
        .select('role, level')
        .eq('id', managerId)
        .single();

      const { data: target, error: targetError } = await supabase
        .from('admin_users')
        .select('role, level')
        .eq('id', targetUserId)
        .single();

      if (managerError || targetError) {
        logger.error('Error getting users for management check:', { managerError, targetError });
        throw managerError || targetError;
      }

      // Super admin can manage everyone
      if (manager.role === AdminRole.SUPER_ADMIN) {
        return true;
      }

      // Users can't manage themselves
      if (managerId === targetUserId) {
        return false;
      }

      // Check if manager has higher level than target
      const managerRole = await this.getRoleByName(manager.role);
      const targetRole = await this.getRoleByName(target.role);

      if (!managerRole || !targetRole) {
        return false;
      }

      return managerRole.level > targetRole.level;
    } catch (error) {
      logger.error('Error in canManageUser:', error);
      throw error;
    }
  }

  // Get available permissions for a role
  static async getAvailablePermissionsForRole(role: AdminRole): Promise<Permission[]> {
    try {
      const allPermissions = await this.getAllPermissions();
      const rolePermissions = await this.getRolePermissions(role);
      
      const rolePermissionNames = rolePermissions.map(p => p.name);
      
      return allPermissions.filter(permission => 
        !rolePermissionNames.includes(permission.name)
      );
    } catch (error) {
      logger.error('Error in getAvailablePermissionsForRole:', error);
      throw error;
    }
  }
} 