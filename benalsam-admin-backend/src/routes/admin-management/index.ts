import { Router, IRouter } from 'express';
import { AdminManagementController } from '../../controllers/adminManagementController';
import { authMiddleware, requirePermission } from '../../middleware/auth';
import { AdminRole } from '../../types/admin-types';

const router: IRouter = Router();

// Admin Users Management Routes
// All routes require admin management permissions
const adminAuth = authMiddleware({ requiredPermissions: ['admins:view'] });

// Get all admin users (with pagination and filters)
router.get('/users', adminAuth, AdminManagementController.getAdminUsers);

// Get single admin user
router.get('/users/:id', adminAuth, AdminManagementController.getAdminUser);

// Create new admin user (requires create permission)
router.post('/users', 
  authMiddleware({ requiredPermissions: ['admins:create'] }), 
  AdminManagementController.createAdminUser
);

// Update admin user (requires edit permission)
router.put('/users/:id', 
  authMiddleware({ requiredPermissions: ['admins:edit'] }), 
  AdminManagementController.updateAdminUser
);

// Delete admin user (requires delete permission)
router.delete('/users/:id', 
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

export default router; 