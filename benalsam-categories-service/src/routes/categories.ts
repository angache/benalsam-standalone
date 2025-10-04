import { Router } from 'express';
import categoryController from '../controllers/categoryController';

const router = Router();

// Rate limiting is now handled by the main security middleware in index.ts
// No need for additional rate limiting here

/**
 * @route GET /api/v1/categories
 * @desc Get all categories with tree structure
 * @access Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route GET /api/v1/categories/all
 * @desc Get all categories (flat list) with filters and pagination
 * @access Public
 * @query {boolean} is_active - Filter by active status
 * @query {number} parent_id - Filter by parent category
 * @query {number} level - Filter by category level
 * @query {string} search - Search in category names
 * @query {number} page - Page number for pagination
 * @query {number} limit - Items per page
 * @query {string} sortBy - Sort field
 * @query {string} sortOrder - Sort order (asc/desc)
 */
router.get('/all', categoryController.getAllCategories);

/**
 * @route GET /api/v1/categories/stats
 * @desc Get category statistics
 * @access Public
 */
router.get('/stats', categoryController.getCategoryStats);

/**
 * @route GET /api/v1/categories/counts
 * @desc Get category listing counts
 * @access Public
 */
router.get('/counts', categoryController.getCategoryCounts);

/**
 * @route GET /api/v1/categories/popular
 * @desc Get popular categories
 * @access Public
 */
router.get('/popular', categoryController.getPopularCategories);

/**
 * @route GET /api/v1/categories/path/:path
 * @desc Get category by path
 * @access Public
 * @param {string} path - Category path (e.g., "electronics/mobile-phones")
 */
router.get('/path/:path', categoryController.getCategoryByPath);

/**
 * @route GET /api/v1/categories/:id
 * @desc Get single category by ID
 * @access Public
 * @param {number} id - Category ID
 */
router.get('/:id', categoryController.getCategory);

/**
 * @route POST /api/v1/categories
 * @desc Create new category
 * @access Public (should be protected in production)
 * @body {string} name - Category name (required)
 * @body {string} icon - Category icon
 * @body {string} color - Category color
 * @body {number} parent_id - Parent category ID
 * @body {number} sort_order - Sort order
 * @body {boolean} is_active - Active status
 */
router.post('/', categoryController.createCategory);

/**
 * @route PUT /api/v1/categories/:id
 * @desc Update category
 * @access Public (should be protected in production)
 * @param {number} id - Category ID
 * @body {string} name - Category name
 * @body {string} icon - Category icon
 * @body {string} color - Category color
 * @body {number} parent_id - Parent category ID
 * @body {number} sort_order - Sort order
 * @body {boolean} is_active - Active status
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete category
 * @access Public (should be protected in production)
 * @param {number} id - Category ID
 */
router.delete('/:id', categoryController.deleteCategory);

/**
 * @route GET /api/v1/categories/:id/attributes
 * @desc Get category attributes
 * @access Public
 * @param {number} id - Category ID
 */
router.get('/:id/attributes', categoryController.getCategoryAttributes);

/**
 * @route POST /api/v1/categories/:id/attributes
 * @desc Create category attribute
 * @access Public (should be protected in production)
 * @param {number} id - Category ID
 * @body {string} key - Attribute key (required)
 * @body {string} label - Attribute label (required)
 * @body {string} type - Attribute type (required)
 * @body {boolean} required - Required status
 * @body {string[]} options - Attribute options
 * @body {number} sort_order - Sort order
 */
router.post('/:id/attributes', categoryController.createCategoryAttribute);

/**
 * @route PUT /api/v1/categories/:id/attributes/:attributeId
 * @desc Update category attribute
 * @access Public (should be protected in production)
 * @param {number} id - Category ID
 * @param {number} attributeId - Attribute ID
 * @body {string} key - Attribute key
 * @body {string} label - Attribute label
 * @body {string} type - Attribute type
 * @body {boolean} required - Required status
 * @body {string[]} options - Attribute options
 * @body {number} sort_order - Sort order
 */
router.put('/:id/attributes/:attributeId', categoryController.updateCategoryAttribute);

/**
 * @route DELETE /api/v1/categories/:id/attributes/:attributeId
 * @desc Delete category attribute
 * @access Public (should be protected in production)
 * @param {number} id - Category ID
 * @param {number} attributeId - Attribute ID
 */
router.delete('/:id/attributes/:attributeId', categoryController.deleteCategoryAttribute);

export default router;
