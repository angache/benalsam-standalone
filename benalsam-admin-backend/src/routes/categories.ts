import { Router, IRouter } from 'express';
import { categoriesController } from '../controllers/categoriesController';
import { authMiddleware } from '../middleware/auth';
import apiCacheService from '../services/apiCacheService';

const router: IRouter = Router();

// Get all categories - temporarily without auth for testing
router.get('/', categoriesController.getCategories);

// Get single category by ID - temporarily without auth for testing
router.get('/:id', categoriesController.getCategory);

// Create category - requires categories:create permission
router.post('/', ...authMiddleware({ requiredPermissions: ['categories:create'] }), categoriesController.createCategory);

// Update category - requires categories:edit permission
router.put('/:id', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), categoriesController.updateCategory);

// Delete category - requires categories:delete permission
router.delete('/:id', ...authMiddleware({ requiredPermissions: ['categories:delete'] }), categoriesController.deleteCategory);

// Attribute routes
// Create attribute - requires categories:edit permission
router.post('/:categoryId/attributes', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), categoriesController.createAttribute);

// Update attribute - requires categories:edit permission
router.put('/attributes/:id', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), categoriesController.updateAttribute);

// Delete attribute - requires categories:edit permission
router.delete('/attributes/:id', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), categoriesController.deleteAttribute);

export { router as categoriesRouter }; 