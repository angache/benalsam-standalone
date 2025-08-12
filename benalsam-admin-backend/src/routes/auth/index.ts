import { Router, IRouter } from 'express';
import { AuthController } from '../../controllers/authController';
import { authMiddleware, requireRole } from '../../middleware/auth';
import { validateLoginInput } from '../../middleware/validation';
import { AdminRole } from '../../types/admin-types';

const router: IRouter = Router();

// Public routes
router.post('/login', validateLoginInput, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.use(authMiddleware()); // Apply authentication to all routes below

router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/logout', AuthController.logout);

// Super Admin only routes
router.post('/create-admin', requireRole(AdminRole.SUPER_ADMIN), AuthController.createAdmin);

export default router; 