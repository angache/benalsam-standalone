import { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import logger from '../config/logger';
import { categoryService } from '../services/categoryService';

// Kategori tipleri
export interface CategoryAttribute {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  options?: string[];
}

export interface Category {
  name: string;
  icon: string;
  color: string;
  subcategories?: Category[];
  attributes?: CategoryAttribute[];
}

export const categoriesController = {
  // Tüm kategorileri getir - Auth gerektirmeyen versiyon
  async getCategories(req: any, res: Response): Promise<Response | void> {
    try {
      logger.info('Fetching categories from Supabase');

      const categories = await categoryService.getCategories();

      logger.info(`Fetched ${categories.length} main categories`);

      res.json({
        success: true,
        data: categories,
        message: 'Kategoriler başarıyla getirildi',
      });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriler getirilirken bir hata oluştu',
      });
    }
  },

  // TÜM kategorileri getir (ana + alt kategoriler) - Auth gerektirmeyen versiyon
  async getAllCategories(req: any, res: Response): Promise<Response | void> {
    try {
      logger.info('Fetching ALL categories from Supabase');

      const categories = await categoryService.getAllCategories();

      logger.info(`Fetched ${categories.length} total categories`);

      res.json({
        success: true,
        data: categories,
        message: 'Tüm kategoriler başarıyla getirildi',
      });
    } catch (error) {
      logger.error('Error fetching all categories:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriler getirilirken bir hata oluştu',
      });
    }
  },

  // Kategori attribute'larını getir - Auth gerektirmeyen versiyon
  async getCategoryAttributes(req: any, res: Response): Promise<Response | void> {
    try {
      const { path } = req.query;
      
      if (!path) {
        return res.status(400).json({
          success: false,
          message: 'Kategori path parametresi gerekli',
        });
      }
      
      logger.info(`Fetching attributes for category path: ${path}`);

      const attributes = await categoryService.getCategoryAttributes(decodeURIComponent(path));

      logger.info(`Fetched ${attributes.length} attributes for category: ${path}`);

      res.json({
        success: true,
        data: attributes,
        message: 'Kategori özellikleri başarıyla getirildi',
      });
    } catch (error) {
      logger.error('Error fetching category attributes:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori özellikleri getirilirken bir hata oluştu',
      });
    }
  },

  // Tek kategori getir - Auth gerektirmeyen versiyon
  async getCategory(req: any, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      logger.info(`Fetching category with ID/Path: ${id}`);

      // Önce path ile dene
      let category = await categoryService.getCategoryByPath(decodeURIComponent(id));

      // Path ile bulunamazsa ID ile dene
      if (!category) {
        category = await categoryService.getCategory(id);
      }

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Kategori bulunamadı',
        });
        return;
      }

      res.json({
        success: true,
        data: category,
        message: 'Kategori başarıyla getirildi',
      });
    } catch (error) {
      logger.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori getirilirken bir hata oluştu',
      });
    }
  },

  // Kategori oluştur
  async createCategory(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const createData = req.body;
      const admin = req.admin;

      logger.info('Creating new category:', { admin: admin?.email, data: createData });

      const category = await categoryService.createCategory(createData);

      // Invalidate category cache
      await categoryService.invalidateAllCategoryCaches();

      // Admin aktivite logunu kaydet
      await categoriesController.logCategoryActivity(admin, 'CREATE_CATEGORY', category.path, createData);

      res.json({
        success: true,
        data: category,
        message: 'Kategori başarıyla oluşturuldu',
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori oluşturulurken bir hata oluştu',
      });
    }
  },

  // Kategori güncelle
  async updateCategory(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const admin = req.admin;

      logger.info(`Updating category ${id}`, { admin: admin?.email });

      const category = await categoryService.updateCategory(id, updateData);

      // Invalidate category cache
      await categoryService.invalidateAllCategoryCaches();

      // Admin aktivite logunu kaydet
      await categoriesController.logCategoryActivity(admin, 'UPDATE_CATEGORY', category.path, updateData);

      res.json({
        success: true,
        data: category,
        message: 'Kategori başarıyla güncellendi',
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori güncellenirken bir hata oluştu',
      });
    }
  },

  // Kategori sil
  async deleteCategory(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const admin = req.admin;

      logger.info(`Deleting category ${id}`, { admin: admin?.email });

      // Get category path before deletion for logging
      const category = await categoryService.getCategory(id);
      const categoryPath = category?.path || id;

      await categoryService.deleteCategory(id);

      // Invalidate category cache
      await categoryService.invalidateAllCategoryCaches();

      // Admin aktivite logunu kaydet
      await categoriesController.logCategoryActivity(admin, 'DELETE_CATEGORY', categoryPath);

      res.json({
        success: true,
        message: 'Kategori başarıyla silindi',
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori silinirken bir hata oluştu',
      });
    }
  },

  // Attribute oluştur
  async createAttribute(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { categoryId } = req.params;
      const createData = req.body;
      const admin = req.admin;

      logger.info(`Creating attribute for category ${categoryId}`, { admin: admin?.email });

      const attribute = await categoryService.createAttribute(categoryId, createData);

      // Admin aktivite logunu kaydet
      await categoriesController.logCategoryActivity(admin, 'CREATE_ATTRIBUTE', categoryId, createData);

      res.json({
        success: true,
        data: attribute,
        message: 'Attribute başarıyla oluşturuldu',
      });
    } catch (error) {
      logger.error('Error creating attribute:', error);
      res.status(500).json({
        success: false,
        message: 'Attribute oluşturulurken bir hata oluştu',
      });
    }
  },

  // Attribute güncelle
  async updateAttribute(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const admin = req.admin;

      logger.info(`Updating attribute ${id}`, { admin: admin?.email });

      const attribute = await categoryService.updateAttribute(id, updateData);

      // Admin aktivite logunu kaydet
      await categoriesController.logCategoryActivity(admin, 'UPDATE_ATTRIBUTE', id, updateData);

      res.json({
        success: true,
        data: attribute,
        message: 'Attribute başarıyla güncellendi',
      });
    } catch (error) {
      logger.error('Error updating attribute:', error);
      res.status(500).json({
        success: false,
        message: 'Attribute güncellenirken bir hata oluştu',
      });
    }
  },

  // Attribute sil
  async deleteAttribute(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const admin = req.admin;

      logger.info(`Deleting attribute ${id}`, { admin: admin?.email });

      await categoryService.deleteAttribute(id);

      // Admin aktivite logunu kaydet
      await categoriesController.logCategoryActivity(admin, 'DELETE_ATTRIBUTE', id);

      res.json({
        success: true,
        message: 'Attribute başarıyla silindi',
      });
    } catch (error) {
      logger.error('Error deleting attribute:', error);
      res.status(500).json({
        success: false,
        message: 'Attribute silinirken bir hata oluştu',
      });
    }
  },

  // Admin aktivite logunu kaydet
  async logCategoryActivity(admin: any, action: string, categoryPath: string, details?: any): Promise<void> {
    try {
      // Bu fonksiyon admin aktivite loglarını kaydetmek için kullanılabilir
      logger.info('Category activity logged', {
        admin: admin?.email,
        action,
        categoryPath,
        details
      });
    } catch (error) {
      logger.error('Error logging category activity:', error);
    }
  }
}; 