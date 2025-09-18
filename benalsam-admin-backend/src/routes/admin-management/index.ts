import { Router, IRouter } from 'express';
import { AdminManagementController } from '../../controllers/adminManagementController';
import { authMiddleware, requirePermission } from '../../middleware/auth';
import { AdminRole } from '../../types/admin-types';
import { readThroughCache, cachePresets } from '../../middleware/readThroughCache';
import { cacheInvalidation, invalidationPresets } from '../../middleware/cacheInvalidation';

const router: IRouter = Router();

// Admin Users Management Routes
// All routes require admin management permissions
const adminAuth = authMiddleware({ requiredPermissions: ['admins:view'] });

// Get all admin users (with pagination and filters) - Cache for 5 minutes
router.get('/users', 
  readThroughCache({
    ...cachePresets.mediumTerm,
    namespace: 'admin-users'
  }),
  adminAuth, 
  AdminManagementController.getAdminUsers
);

// Get single admin user - Cache for 10 minutes
router.get('/users/:id', 
  readThroughCache({
    ttl: 600,
    namespace: 'admin-users'
  }),
  adminAuth, 
  AdminManagementController.getAdminUser
);

// Create new admin user (requires create permission) - Invalidate cache
router.post('/users', 
  cacheInvalidation(invalidationPresets.adminUsers),
  authMiddleware({ requiredPermissions: ['admins:create'] }), 
  AdminManagementController.createAdminUser
);

// Update admin user (requires edit permission) - Invalidate cache
router.put('/users/:id', 
  cacheInvalidation(invalidationPresets.adminUsers),
  authMiddleware({ requiredPermissions: ['admins:edit'] }), 
  AdminManagementController.updateAdminUser
);

// Delete admin user (requires delete permission) - Invalidate cache
router.delete('/users/:id', 
  cacheInvalidation(invalidationPresets.adminUsers),
  authMiddleware({ requiredPermissions: ['admins:delete'] }), 
  AdminManagementController.deleteAdminUser
);

// Roles Management Routes
// Get all roles
router.get('/roles', adminAuth, AdminManagementController.getRoles);

// Get role details with permissions
router.get('/roles/:role', adminAuth, AdminManagementController.getRoleDetails);

// Update role permissions (requires roles permission)
router.put('/roles/:role/permissions', 
  authMiddleware({ requiredPermissions: ['admins:roles'] }), 
  AdminManagementController.updateRolePermissions
);

// Permissions Management Routes
// Get all permissions
router.get('/permissions', adminAuth, AdminManagementController.getPermissions);

// Get permission matrix
router.get('/permissions/matrix', adminAuth, AdminManagementController.getPermissionMatrix);

// Get current user permissions
router.get('/permissions/current', 
  authMiddleware(), 
  AdminManagementController.getCurrentUserPermissions
);



// Get profile for admin user
router.get('/profile/:adminId', 
  authMiddleware(), 
  AdminManagementController.getProfile
);

// Update profile for admin user
router.put('/profile/:adminId', 
  authMiddleware(), 
  AdminManagementController.updateProfile
);

// Debug: Get profiles table structure
router.get('/debug/profiles-structure', 
  authMiddleware(), 
  AdminManagementController.getProfilesStructure
);

// Debug: Check if admin exists in auth.users
router.get('/debug/check-admin/:adminId', 
  authMiddleware(), 
  AdminManagementController.checkAdminInAuthUsers
);

// Debug: Get admin_users table structure
router.get('/debug/admin-users-structure', 
  authMiddleware(), 
  AdminManagementController.getAdminUsersStructure
);

export default router; 