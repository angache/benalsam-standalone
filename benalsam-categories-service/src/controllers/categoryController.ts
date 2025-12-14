import { Request, Response } from 'express';
import categoryService from '../services/categoryService';
import logger from '../config/logger';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  CategoryResponse,
  PaginationParams,
  CategoryFilters
} from '../types/category';

/**
 * Categories Controller - Handles HTTP requests for category operations
 */
export class CategoryController {
  /**
   * Get all categories with tree structure
   * GET /api/v1/categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Getting all categories', { service: 'categories-service' });
      
      const categories = await categoryService.getCategories();
      
      const response: CategoryResponse = {
        success: true,
        data: categories,
        message: `Found ${categories.length} main categories`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getCategories:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get all categories (flat list) with filters and pagination
   * GET /api/v1/categories/all
   */
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const filters: CategoryFilters = {
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        parent_id: req.query.parent_id ? parseInt(req.query.parent_id as string) : undefined,
        level: req.query.level ? parseInt(req.query.level as string) : undefined,
        search: req.query.search as string
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      logger.info('Getting all categories with filters', { filters, pagination, service: 'categories-service' });
      
      const categories = await categoryService.getAllCategories(filters, pagination);
      
      const response: CategoryResponse = {
        success: true,
        data: categories,
        message: `Found ${categories.length} categories`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getAllCategories:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get single category by ID
   * GET /api/v1/categories/:id
   */
  async getCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Getting category by ID', { id, service: 'categories-service' });
      
      let category = null;

      // Check if it's a numeric ID
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        // It's a numeric ID, fetch by ID
        category = await categoryService.getCategory(numericId);
      } else {
        // It's a path or slug, try path first
        category = await categoryService.getCategoryByPath(decodeURIComponent(id));
      }
      
      if (!category) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      const response: CategoryResponse = {
        success: true,
        data: category,
        message: `Found category: ${category.name}`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getCategory:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get category by path
   * GET /api/v1/categories/path/:path
   */
  async getCategoryByPath(req: Request, res: Response): Promise<void> {
    try {
      const { path } = req.params;
      
      if (!path) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category path is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Getting category by path', { path, service: 'categories-service' });
      
      const category = await categoryService.getCategoryByPath(path);
      
      if (!category) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      const response: CategoryResponse = {
        success: true,
        data: category,
        message: `Found category: ${category.name}`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getCategoryByPath:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Create new category
   * POST /api/v1/categories
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCategoryRequest = req.body;
      
      if (!data.name) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category name is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Creating new category', { data, service: 'categories-service' });
      
      const category = await categoryService.createCategory(data);
      
      const response: CategoryResponse = {
        success: true,
        data: category,
        message: `Created category: ${category.name}`,
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createCategory:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Update category
   * PUT /api/v1/categories/:id
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCategoryRequest = req.body;
      
      if (!id) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Updating category', { id, data, service: 'categories-service' });
      
      const category = await categoryService.updateCategory(parseInt(id), data);
      
      const response: CategoryResponse = {
        success: true,
        data: category,
        message: `Updated category: ${category.name}`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in updateCategory:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Delete category
   * DELETE /api/v1/categories/:id
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Deleting category', { id, service: 'categories-service' });
      
      const success = await categoryService.deleteCategory(parseInt(id));
      
      const response: CategoryResponse = {
        success,
        message: success ? 'Category deleted successfully' : 'Failed to delete category',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in deleteCategory:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get category attributes
   * GET /api/v1/categories/:id/attributes
   */
  async getCategoryAttributes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Getting category attributes', { categoryId: id, service: 'categories-service' });
      
      const attributes = await categoryService.getCategoryAttributes(parseInt(id));
      
      const response: CategoryResponse = {
        success: true,
        data: attributes,
        message: `Found ${attributes.length} attributes`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getCategoryAttributes:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Create category attribute
   * POST /api/v1/categories/:id/attributes
   */
  async createCategoryAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: CreateAttributeRequest = {
        ...req.body,
        category_id: parseInt(id as string)
      };
      
      if (!id) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      if (!data.key || !data.label || !data.type) {
        const response: CategoryResponse = {
          success: false,
          error: 'Key, label, and type are required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Creating category attribute', { categoryId: id, data, service: 'categories-service' });
      
      const attribute = await categoryService.createCategoryAttribute(data);
      
      const response: CategoryResponse = {
        success: true,
        data: attribute,
        message: `Created attribute: ${attribute.label}`,
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createCategoryAttribute:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Update category attribute
   * PUT /api/v1/categories/:id/attributes/:attributeId
   */
  async updateCategoryAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { id, attributeId } = req.params;
      const data: UpdateAttributeRequest = req.body;
      
      if (!id || !attributeId) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID and Attribute ID are required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Updating category attribute', { categoryId: id, attributeId, data, service: 'categories-service' });
      
      const attribute = await categoryService.updateCategoryAttribute(parseInt(attributeId), data);
      
      const response: CategoryResponse = {
        success: true,
        data: attribute,
        message: `Updated attribute: ${attribute.label}`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in updateCategoryAttribute:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Delete category attribute
   * DELETE /api/v1/categories/:id/attributes/:attributeId
   */
  async deleteCategoryAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { id, attributeId } = req.params;
      
      if (!id || !attributeId) {
        const response: CategoryResponse = {
          success: false,
          error: 'Category ID and Attribute ID are required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Deleting category attribute', { categoryId: id, attributeId, service: 'categories-service' });
      
      const success = await categoryService.deleteCategoryAttribute(parseInt(attributeId));
      
      const response: CategoryResponse = {
        success,
        message: success ? 'Attribute deleted successfully' : 'Failed to delete attribute',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in deleteCategoryAttribute:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get category statistics
   * GET /api/v1/categories/stats
   */
  async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Getting category statistics', { service: 'categories-service' });
      
      const stats = await categoryService.getCategoryStats();
      
      const response: CategoryResponse = {
        success: true,
        data: stats,
        message: 'Category statistics retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getCategoryStats:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get category listing counts
   * GET /api/v1/categories/counts
   */
  async getCategoryCounts(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Getting category listing counts', { service: 'categories-service' });
      
      const counts = await categoryService.getCategoryCounts();
      
      const response: CategoryResponse = {
        success: true,
        data: counts,
        message: 'Category listing counts retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getCategoryCounts:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get categories version for cache validation
   * GET /api/v1/categories/version
   */
  async getVersion(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Getting categories version', { service: 'categories-service' });
      
      // Use timestamp as version (changes when categories are modified)
      const version = Date.now();
      
      const response = {
        success: true,
        version: version,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getVersion:', { error, service: 'categories-service' });
      
      const response = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get popular categories
   * GET /api/v1/categories/popular
   */
  async getPopularCategories(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      logger.info('Getting popular categories', { limit, service: 'categories-service' });
      
      const popularCategories = await categoryService.getPopularCategories(limit);
      
      const response: CategoryResponse = {
        success: true,
        data: popularCategories,
        message: `Found ${popularCategories.length} popular categories`,
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error in getPopularCategories:', { error, service: 'categories-service' });
      
      const response: CategoryResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }
}

export default new CategoryController();
