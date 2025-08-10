import { Router, IRouter } from 'express';
import { usersController } from '../controllers/usersController';
import { authMiddleware } from '../middleware/auth';

const router: IRouter = Router();

// Get all users - requires users:view permission
router.get('/', ...authMiddleware({ requiredPermissions: ['users:view'] }), usersController.getUsers);

// Get single user - requires users:view permission
router.get('/:id', ...authMiddleware({ requiredPermissions: ['users:view'] }), usersController.getUser);

// Update user - requires users:manage permission
router.put('/:id', ...authMiddleware({ requiredPermissions: ['users:manage'] }), usersController.updateUser);

// Ban user - requires users:ban permission
router.post('/:id/ban', ...authMiddleware({ requiredPermissions: ['users:ban'] }), usersController.banUser);

// Unban user - requires users:ban permission
router.post('/:id/unban', ...authMiddleware({ requiredPermissions: ['users:ban'] }), usersController.unbanUser);

// Delete user - requires users:delete permission
router.delete('/:id', ...authMiddleware({ requiredPermissions: ['users:delete'] }), usersController.deleteUser);

export { router as usersRouter }; 