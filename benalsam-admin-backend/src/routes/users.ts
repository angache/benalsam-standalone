import { Router, IRouter } from 'express';
import { usersController } from '../controllers/usersController';
import { authMiddleware } from '../middleware/auth';
import { readThroughCache, cachePresets } from '../middleware/readThroughCache';
import { cacheInvalidation, invalidationPresets } from '../middleware/cacheInvalidation';

const router: IRouter = Router();

// Get all users - requires users:view permission - Cache for 5 minutes
router.get('/', 
  readThroughCache({
    ...cachePresets.mediumTerm,
    namespace: 'users'
  }),
  ...authMiddleware({ requiredPermissions: ['users:view'] }), 
  usersController.getUsers
);

// Get single user - requires users:view permission - Cache for 10 minutes
router.get('/:id', 
  readThroughCache({
    ttl: 600,
    namespace: 'users'
  }),
  ...authMiddleware({ requiredPermissions: ['users:view'] }), 
  usersController.getUser
);

// Update user - requires users:manage permission - Invalidate cache
router.put('/:id', 
  cacheInvalidation(invalidationPresets.users),
  ...authMiddleware({ requiredPermissions: ['users:manage'] }), 
  usersController.updateUser
);

// Ban user - requires users:ban permission - Invalidate cache
router.post('/:id/ban', 
  cacheInvalidation(invalidationPresets.users),
  ...authMiddleware({ requiredPermissions: ['users:ban'] }), 
  usersController.banUser
);

// Unban user - requires users:ban permission - Invalidate cache
router.post('/:id/unban', 
  cacheInvalidation(invalidationPresets.users),
  ...authMiddleware({ requiredPermissions: ['users:ban'] }), 
  usersController.unbanUser
);

// Delete user - requires users:delete permission - Invalidate cache
router.delete('/:id', 
  cacheInvalidation(invalidationPresets.users),
  ...authMiddleware({ requiredPermissions: ['users:delete'] }), 
  usersController.deleteUser
);

export { router as usersRouter }; 