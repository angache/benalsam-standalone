import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import cloudinaryService from '../services/cloudinaryService';
import logger from '../config/logger';
import { ApiResponseUtil } from '../utils/response';

// Request tipini extend et
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class InventoryController {
  /**
   * Get user's inventory items
   */
  async getInventoryItems(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponseUtil.unauthorized(res, 'User authentication required');
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching inventory items:', error);
        return ApiResponseUtil.error(res, 'Failed to fetch inventory items', 500);
      }

      return ApiResponseUtil.success(res, data || [], 'Inventory items fetched successfully');
    } catch (error) {
      logger.error('Unexpected error in getInventoryItems:', error);
      return ApiResponseUtil.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Add new inventory item
   */
  async addInventoryItem(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponseUtil.unauthorized(res, 'User authentication required');
      }

      const { name, category, description, main_image_url, additional_image_urls } = req.body;

      // Validation
      if (!name || !category) {
        return ApiResponseUtil.badRequest(res, 'Name and category are required');
      }

      const itemToInsert = {
        user_id: userId,
        name,
        category,
        description: description || '',
        main_image_url: main_image_url || null,
        additional_image_urls: additional_image_urls || null,
        image_url: main_image_url || null, // Legacy field
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([itemToInsert])
        .select()
        .single();

      if (error) {
        logger.error('Error adding inventory item:', error);
        return ApiResponseUtil.error(res, 'Failed to add inventory item', 500);
      }

      return ApiResponseUtil.success(res, data, 'Inventory item added successfully');
    } catch (error) {
      logger.error('Unexpected error in addInventoryItem:', error);
      return ApiResponseUtil.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      const itemId = req.params.id;

      if (!userId) {
        return ApiResponseUtil.unauthorized(res, 'User authentication required');
      }

      if (!itemId) {
        return ApiResponseUtil.badRequest(res, 'Item ID is required');
      }

      logger.info(`🔄 Updating inventory item: ${itemId} for user: ${userId}`);
      logger.info(`📝 Raw request body:`, req.body);
      logger.info(`📝 Request headers:`, req.headers);
      
      const { name, category, description, main_image_url, additional_image_urls } = req.body;
      
      logger.info(`📝 Parsed data:`, { name, category, description, main_image_url, additional_image_urls });

      // Check if item belongs to user
      const { data: existingItem, error: checkError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (checkError || !existingItem) {
        return ApiResponseUtil.notFound(res, 'Inventory item not found or access denied');
      }

      const itemToUpdate = {
        name,
        category,
        description: description || '',
        main_image_url: main_image_url || null,
        additional_image_urls: additional_image_urls || null,
        image_url: main_image_url || null, // Legacy field
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .update(itemToUpdate)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error updating inventory item:', error);
        return ApiResponseUtil.error(res, 'Failed to update inventory item', 500);
      }

      logger.info(`✅ Inventory item updated successfully: ${itemId}`);
      logger.info(`📊 Updated data:`, data);
      return ApiResponseUtil.success(res, data, 'Inventory item updated successfully');
    } catch (error) {
      logger.error('Unexpected error in updateInventoryItem:', error);
      return ApiResponseUtil.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      const itemId = req.params.id;

      if (!userId) {
        return ApiResponseUtil.unauthorized(res, 'User authentication required');
      }

      if (!itemId) {
        return ApiResponseUtil.badRequest(res, 'Item ID is required');
      }

      // Check if item belongs to user
      const { data: existingItem, error: checkError } = await supabase
        .from('inventory_items')
        .select('id, main_image_url, additional_image_urls')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (checkError || !existingItem) {
        return ApiResponseUtil.notFound(res, 'Inventory item not found or access denied');
      }

      // Delete entire folder from Cloudinary (includes all images and transformations)
      try {
        logger.info(`🗑️ Deleting inventory folder from Cloudinary for user: ${userId}, item: ${itemId}`);
        const folderDeleted = await cloudinaryService.deleteInventoryItemFolder(userId, itemId);
        
        if (folderDeleted) {
          logger.info(`✅ Successfully deleted inventory folder from Cloudinary: ${userId}/${itemId}`);
        } else {
          logger.warn(`⚠️ Failed to delete inventory folder from Cloudinary: ${userId}/${itemId}`);
        }
      } catch (cloudinaryError) {
        logger.warn('Failed to delete inventory folder from Cloudinary:', cloudinaryError);
        // Continue with item deletion even if Cloudinary deletion fails
      }

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting inventory item:', error);
        return ApiResponseUtil.error(res, 'Failed to delete inventory item', 500);
      }

      return ApiResponseUtil.success(res, null, 'Inventory item deleted successfully');
    } catch (error) {
      logger.error('Unexpected error in deleteInventoryItem:', error);
      return ApiResponseUtil.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Upload inventory images to Cloudinary - same as listing upload
   */
  async uploadInventoryImages(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get itemId from request body or query params
      const itemId = req.body.itemId || req.query.itemId as string;

      const files = req.files as Express.Multer.File[];
      const results = await cloudinaryService.uploadInventoryImages(files, userId, itemId);

      return res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: results.map(result => ({
            publicId: result.publicId,
            url: result.secureUrl,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.size
          })),
          count: results.length
        }
      });

    } catch (error) {
      logger.error('❌ Inventory image upload failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Image upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      const itemId = req.params.id;

      if (!userId) {
        return ApiResponseUtil.unauthorized(res, 'User authentication required');
      }

      if (!itemId) {
        return ApiResponseUtil.badRequest(res, 'Item ID is required');
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return ApiResponseUtil.notFound(res, 'Inventory item not found or access denied');
      }

      return ApiResponseUtil.success(res, data, 'Inventory item fetched successfully');
    } catch (error) {
      logger.error('Unexpected error in getInventoryItemById:', error);
      return ApiResponseUtil.error(res, 'Internal server error', 500);
    }
  }
}

export default new InventoryController();
