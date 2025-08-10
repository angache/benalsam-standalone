// ===========================
// ADMIN TYPES (LOCAL)
// ===========================

// Admin Role enum
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
  CATEGORY_MANAGER = 'CATEGORY_MANAGER',
  ANALYTICS_MANAGER = 'ANALYTICS_MANAGER',
  USER_MANAGER = 'USER_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
}

// Admin Permission types
export interface AdminPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type Permission = AdminPermission;

export interface AdminRolePermission {
  id: string;
  role: AdminRole;
  permission_id: string;
  permission?: AdminPermission;
  created_at: string;
}

export type RolePermission = AdminRolePermission;

export interface AdminUserPermission {
  id: string;
  admin_id: string;
  permission_id: string;
  granted_by?: string;
  permission?: AdminPermission;
  created_at: string;
}

export type UserPermission = AdminUserPermission;

export interface AdminRoleDefinition {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  permissions: any[]; // JSONB array
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  admin_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
  position?: string;
  permissions: any; // JSONB object
  is_active: boolean;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminWorkflowAssignment {
  id: string;
  admin_profile_id?: string;
  workflow_type: string;
  resource_id?: string;
  resource_type?: string;
  priority: number;
  status: string;
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  performance_rating?: number;
}

export interface AdminPerformanceMetric {
  id: string;
  admin_id: string;
  metric_type: string;
  target_value: number;
  achieved_percentage: number;
  created_at: string;
}

export interface AdminDepartment {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface AdminAuthResponse {
  success: boolean;
  data: {
    admin: AdminUser;
    token: string;
    refreshToken: string;
  };
  message: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: AdminRole;
  permissions?: string[];
}

export interface UpdateAdminUserDto {
  firstName?: string;
  lastName?: string;
  role?: AdminRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface JwtPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  permissions?: AdminPermission[];
} 