/**
 * Admin Management Service
 * Handles admin user and role management
 */

import { apiClient, ApiResponse } from '@/lib/apiClient';
import { errorHandler } from '@/lib/errorHandler';

// Admin management types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  department?: string;
  phone?: string;
  notes?: string;
}

export interface CreateAdminUserData {
  email: string;
  name: string;
  role: string;
  password: string;
  permissions?: string[];
  department?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateAdminUserData {
  name?: string;
  role?: string;
  permissions?: string[];
  is_active?: boolean;
  department?: string;
  phone?: string;
  notes?: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminRoleData {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateAdminRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface AdminFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Admin Management Service
 */
export class AdminManagementService {
  /**
   * Get all admin users
   */
  static async getAdminUsers(filters?: AdminFilters): Promise<ApiResponse<{ users: AdminUser[]; total: number }>> {
    try {
      const response = await apiClient.get('/admin/users', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getAdminUsers');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getAdminUsers');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcıları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get single admin user
   */
  static async getAdminUser(userId: string): Promise<ApiResponse<AdminUser>> {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getAdminUser');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getAdminUser');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcı detayları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Create admin user
   */
  static async createAdminUser(userData: CreateAdminUserData): Promise<ApiResponse<AdminUser>> {
    try {
      const response = await apiClient.post('/admin/users', userData);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'createAdminUser');
        return response;
      }

      errorHandler.showSuccess('Admin kullanıcısı başarıyla oluşturuldu');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'createAdminUser');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcısı oluşturulurken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Update admin user
   */
  static async updateAdminUser(userId: string, userData: UpdateAdminUserData): Promise<ApiResponse<AdminUser>> {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'updateAdminUser');
        return response;
      }

      errorHandler.showSuccess('Admin kullanıcısı başarıyla güncellendi');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'updateAdminUser');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcısı güncellenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Delete admin user
   */
  static async deleteAdminUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'deleteAdminUser');
        return response;
      }

      errorHandler.showSuccess('Admin kullanıcısı başarıyla silindi');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'deleteAdminUser');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcısı silinirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get all admin roles
   */
  static async getAdminRoles(): Promise<ApiResponse<AdminRole[]>> {
    try {
      const response = await apiClient.get('/admin/roles');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getAdminRoles');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getAdminRoles');
      return {
        success: false,
        error: {
          message: 'Admin rolleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get single admin role
   */
  static async getAdminRole(roleId: string): Promise<ApiResponse<AdminRole>> {
    try {
      const response = await apiClient.get(`/admin/roles/${roleId}`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getAdminRole');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getAdminRole');
      return {
        success: false,
        error: {
          message: 'Admin rol detayları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Create admin role
   */
  static async createAdminRole(roleData: CreateAdminRoleData): Promise<ApiResponse<AdminRole>> {
    try {
      const response = await apiClient.post('/admin/roles', roleData);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'createAdminRole');
        return response;
      }

      errorHandler.showSuccess('Admin rolü başarıyla oluşturuldu');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'createAdminRole');
      return {
        success: false,
        error: {
          message: 'Admin rolü oluşturulurken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Update admin role
   */
  static async updateAdminRole(roleId: string, roleData: UpdateAdminRoleData): Promise<ApiResponse<AdminRole>> {
    try {
      const response = await apiClient.put(`/admin/roles/${roleId}`, roleData);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'updateAdminRole');
        return response;
      }

      errorHandler.showSuccess('Admin rolü başarıyla güncellendi');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'updateAdminRole');
      return {
        success: false,
        error: {
          message: 'Admin rolü güncellenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Delete admin role
   */
  static async deleteAdminRole(roleId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/admin/roles/${roleId}`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'deleteAdminRole');
        return response;
      }

      errorHandler.showSuccess('Admin rolü başarıyla silindi');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'deleteAdminRole');
      return {
        success: false,
        error: {
          message: 'Admin rolü silinirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get all permissions
   */
  static async getPermissions(): Promise<ApiResponse<AdminPermission[]>> {
    try {
      const response = await apiClient.get('/admin/permissions');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getPermissions');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getPermissions');
      return {
        success: false,
        error: {
          message: 'İzinler yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get activity logs
   */
  static async getActivityLogs(filters?: AdminFilters): Promise<ApiResponse<{ logs: AdminActivityLog[]; total: number }>> {
    try {
      const response = await apiClient.get('/admin/activity-logs', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getActivityLogs');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getActivityLogs');
      return {
        success: false,
        error: {
          message: 'Aktivite logları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivityLogs(userId: string): Promise<ApiResponse<AdminActivityLog[]>> {
    try {
      const response = await apiClient.get(`/admin/users/${userId}/activity-logs`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getUserActivityLogs');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getUserActivityLogs');
      return {
        success: false,
        error: {
          message: 'Kullanıcı aktivite logları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Bulk update admin users
   */
  static async bulkUpdateUsers(
    userIds: string[],
    updates: UpdateAdminUserData
  ): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    try {
      const response = await apiClient.post('/admin/users/bulk-update', {
        userIds,
        updates,
      });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'bulkUpdateUsers');
        return response;
      }

      const successCount = response.data?.success?.length || 0;
      errorHandler.showSuccess(`${successCount} kullanıcı başarıyla güncellendi`);
      
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'bulkUpdateUsers');
      return {
        success: false,
        error: {
          message: 'Toplu güncelleme sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Search admin users
   */
  static async searchAdminUsers(query: string): Promise<ApiResponse<AdminUser[]>> {
    try {
      const response = await apiClient.get('/admin/users/search', { q: query });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'searchAdminUsers');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'searchAdminUsers');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcı araması sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get admin user statistics
   */
  static async getAdminUserStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/admin/users/stats');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getAdminUserStats');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getAdminUserStats');
      return {
        success: false,
        error: {
          message: 'Admin kullanıcı istatistikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }
}

 