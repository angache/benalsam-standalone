import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission constants
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Listings
  LISTINGS_VIEW: 'listings:view',
  LISTINGS_MODERATE: 'listings:moderate',
  LISTINGS_DELETE: 'listings:delete',
  LISTINGS_FEATURE: 'listings:feature',
  LISTINGS_APPROVE: 'listings:approve',
  LISTINGS_REJECT: 'listings:reject',
  
  // Categories
  CATEGORIES_VIEW: 'categories:view',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_EDIT: 'categories:edit',
  CATEGORIES_DELETE: 'categories:delete',
  CATEGORIES_ATTRIBUTES: 'categories:attributes',
  
  // Users
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  USERS_BAN: 'users:ban',
  USERS_DELETE: 'users:delete',
  
  // Admin Management
  ADMINS_VIEW: 'admins:view',
  ADMINS_CREATE: 'admins:create',
  ADMINS_EDIT: 'admins:edit',
  ADMINS_DELETE: 'admins:delete',
  ADMINS_ROLES: 'admins:roles',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_RESOLVE: 'reports:resolve',
  REPORTS_DELETE: 'reports:delete',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_REPORTS: 'analytics:reports',
  
  // System Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // Activity Logs
  LOGS_VIEW: 'logs:view',
  LOGS_EXPORT: 'logs:export',
} as const;

// Role hierarchy
export const ROLE_HIERARCHY = {
  SUPPORT: 1,
  MODERATOR: 2,
  CONTENT_MANAGER: 3,
  ANALYTICS_MANAGER: 4,
  CATEGORY_MANAGER: 5,
  USER_MANAGER: 6,
  ADMIN: 7,
  SUPER_ADMIN: 8,
} as const;

// Menu structure based on roles
export const MENU_STRUCTURE = {
  SUPER_ADMIN: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Listings', path: '/listings', icon: 'List', permission: PERMISSIONS.LISTINGS_VIEW },
    { name: 'Categories', path: '/categories', icon: 'Folder', permission: PERMISSIONS.CATEGORIES_VIEW },
    { name: 'Users', path: '/users', icon: 'Users', permission: PERMISSIONS.USERS_VIEW },
    { name: 'Admin Management', path: '/admin-management', icon: 'Shield', permission: PERMISSIONS.ADMINS_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
    { name: 'Analytics', path: '/analytics', icon: 'BarChart', permission: PERMISSIONS.ANALYTICS_VIEW },
    { name: 'Settings', path: '/settings', icon: 'Settings', permission: PERMISSIONS.SETTINGS_VIEW },
  ],
  ADMIN: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Listings', path: '/listings', icon: 'List', permission: PERMISSIONS.LISTINGS_VIEW },
    { name: 'Categories', path: '/categories', icon: 'Folder', permission: PERMISSIONS.CATEGORIES_VIEW },
    { name: 'Users', path: '/users', icon: 'Users', permission: PERMISSIONS.USERS_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
    { name: 'Analytics', path: '/analytics', icon: 'BarChart', permission: PERMISSIONS.ANALYTICS_VIEW },
  ],
  CATEGORY_MANAGER: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Categories', path: '/categories', icon: 'Folder', permission: PERMISSIONS.CATEGORIES_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  MODERATOR: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Listings', path: '/listings', icon: 'List', permission: PERMISSIONS.LISTINGS_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  SUPPORT: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  USER_MANAGER: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Users', path: '/users', icon: 'Users', permission: PERMISSIONS.USERS_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  ANALYTICS_MANAGER: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Analytics', path: '/analytics', icon: 'BarChart', permission: PERMISSIONS.ANALYTICS_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  CONTENT_MANAGER: [
    { name: 'Dashboard', path: '/', icon: 'Home', permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: 'Listings', path: '/listings', icon: 'List', permission: PERMISSIONS.LISTINGS_VIEW },
    { name: 'Categories', path: '/categories', icon: 'Folder', permission: PERMISSIONS.CATEGORIES_VIEW },
    { name: 'Reports', path: '/reports', icon: 'AlertTriangle', permission: PERMISSIONS.REPORTS_VIEW },
  ],
} as const;

export const usePermissions = () => {
  const { user } = useAuthStore();

  const userPermissions = useMemo(() => {
    if (!user?.permissions) return [];
    return user.permissions.map((p: any) => p.name);
  }, [user?.permissions]);

  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!user) return false;
      
      // Super admin has all permissions
      if (user.role === 'SUPER_ADMIN') return true;
      
      return userPermissions.includes(permission);
    };
  }, [user, userPermissions]);

  const hasAnyPermission = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!user) return false;
      
      // Super admin has all permissions
      if (user.role === 'SUPER_ADMIN') return true;
      
      return permissions.some(permission => userPermissions.includes(permission));
    };
  }, [user, userPermissions]);

  const hasAllPermissions = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!user) return false;
      
      // Super admin has all permissions
      if (user.role === 'SUPER_ADMIN') return true;
      
      return permissions.every(permission => userPermissions.includes(permission));
    };
  }, [user, userPermissions]);

  const hasResourcePermission = useMemo(() => {
    return (resource: string, action: string): boolean => {
      const permission = `${resource}:${action}`;
      return hasPermission(permission);
    };
  }, [hasPermission]);

  const canManageUser = useMemo(() => {
    return (targetRole: string): boolean => {
      if (!user) return false;
      
      // Super admin can manage everyone
      if (user.role === 'SUPER_ADMIN') return true;
      
      // Users can't manage themselves
      if (user.role === targetRole) return false;
      
      const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
      const targetLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] || 0;
      
      return userLevel > targetLevel;
    };
  }, [user]);

  const getRoleDisplayName = useMemo(() => {
    return (roleName: string): string => {
      const roleDisplayNames: Record<string, string> = {
        'SUPER_ADMIN': 'Süper Admin',
        'ADMIN': 'Admin',
        'MODERATOR': 'Moderatör',
        'SUPPORT': 'Destek',
        'CATEGORY_MANAGER': 'Kategori Yöneticisi',
        'USER_MANAGER': 'Kullanıcı Yöneticisi',
        'ANALYTICS_MANAGER': 'Analitik Yöneticisi',
        'CONTENT_MANAGER': 'İçerik Yöneticisi',
      };
      
      return roleDisplayNames[roleName] || roleName;
    };
  }, []);

  const getMenuItems = useMemo(() => {
    return () => {
      if (!user) return [];
      
      const roleMenu = MENU_STRUCTURE[user.role as keyof typeof MENU_STRUCTURE];
      if (!roleMenu) return [];
      
      // Filter menu items based on permissions
      return roleMenu.filter(item => hasPermission(item.permission));
    };
  }, [user, hasPermission]);



  const getRoleLevel = useMemo(() => {
    return (role: string): number => {
      return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
    };
  }, []);

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourcePermission,
    canManageUser,
    getMenuItems,
    getRoleDisplayName,
    getRoleLevel,
    PERMISSIONS,
    ROLE_HIERARCHY,
    MENU_STRUCTURE,
  };
};

// Hook for checking specific permissions
export const usePermission = (permission: string) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

// Hook for checking resource permissions
export const useResourcePermission = (resource: string, action: string) => {
  const { hasResourcePermission } = usePermissions();
  return hasResourcePermission(resource, action);
};

// Hook for checking multiple permissions
export const useAnyPermission = (permissions: string[]) => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
};

// Hook for checking all permissions
export const useAllPermissions = (permissions: string[]) => {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions);
}; 