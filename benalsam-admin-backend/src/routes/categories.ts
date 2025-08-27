import { Router, IRouter } from 'express';
import { categoriesController } from '../controllers/categoriesController';
import { authMiddleware } from '../middleware/auth';
import apiCacheService from '../services/apiCacheService';
import { supabase } from '../config/database';
import logger from '../config/logger';
import { Request, Response } from 'express';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    permissions?: string[];
  };
}

const router: IRouter = Router();

// Get all categories - PUBLIC (no auth required)
router.get('/', categoriesController.getCategories);

// Admin endpoint for category management (requires auth)
router.get('/admin', authMiddleware({ requiredPermissions: ['categories:read'] }), categoriesController.getCategories);

/**
 * @route GET /api/v1/categories/version
 * @desc Get current categories version for cache invalidation
 * @access Public
 */
router.get('/version', async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Categories version check requested');

    const { data, error } = await supabase
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'categories_version')
      .single();
    
    if (error) {
      logger.error('Error fetching categories version:', error);
      return res.status(500).json({ 
        success: false,
        version: 0,
        message: 'Failed to fetch version'
      });
    }
    
    const version = parseInt(data.value) || 0;
    
    logger.info(`✅ Categories version returned: ${version}`);
    
    return res.json({ 
      success: true,
      version,
      updatedAt: data.updated_at
    });
  } catch (error: any) {
    logger.error('❌ Error in categories version endpoint:', error);
    return res.status(500).json({ 
      success: false,
      version: 0,
      message: 'Version service error'
    });
  }
});

/**
 * @route POST /api/v1/categories/version/increment
 * @desc Manually increment categories version (for testing)
 * @access Admin only
 */
router.post('/version/increment', authMiddleware({ requiredPermissions: ['categories:write'] }), async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Manual categories version increment requested');

    // Önce mevcut version'ı al
    const { data: currentData, error: fetchError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'categories_version')
      .single();
    
    if (fetchError) {
      logger.error('Error fetching current version:', fetchError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to fetch current version'
      });
    }

    const currentVersion = parseInt(currentData.value) || 0;
    const newVersion = currentVersion + 1;

    // Version'ı güncelle
    const { data: updateData, error: updateError } = await supabase
      .from('system_settings')
      .update({
        value: newVersion.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('key', 'categories_version')
      .select('value, updated_at')
      .single();
    
    if (updateError) {
      logger.error('Error incrementing categories version:', updateError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to increment version'
      });
    }
    
    logger.info(`✅ Categories version incremented to: ${newVersion}`);
    
    return res.json({ 
      success: true,
      version: newVersion,
      updatedAt: updateData.updated_at,
      message: 'Version incremented successfully'
    });
  } catch (error: any) {
    logger.error('❌ Error in categories version increment:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Version increment error'
    });
  }
});

// Get ALL categories (main + subcategories)
router.get('/all', authMiddleware({ requiredPermissions: ['categories:read'] }), categoriesController.getAllCategories);

// Get single category by ID
router.get('/:id', authMiddleware({ requiredPermissions: ['categories:read'] }), categoriesController.getCategory);

/**
 * @route GET /api/v1/categories/:id/ai-suggestions
 * @desc Get AI suggestions for a specific category
 * @access Admin
 */
router.get('/:id/ai-suggestions', authMiddleware({ requiredPermissions: ['categories:read'] }), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    logger.info(`🤖 Category AI suggestions request for category: ${categoryId}`);

    // Get AI suggestions from database
    const { data: suggestions, error } = await supabase
      .from('category_ai_suggestions')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_approved', true)
      .order('confidence_score', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Error fetching category AI suggestions:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message
      });
    }

    // Transform suggestions to match frontend interface
    const transformedSuggestions = suggestions.map(suggestion => ({
      id: suggestion.id,
      categoryId: suggestion.category_id,
      suggestionType: suggestion.suggestion_type,
      suggestionData: suggestion.suggestion_data,
      confidenceScore: suggestion.confidence_score,
      isApproved: suggestion.is_approved,
      createdAt: suggestion.created_at,
      updatedAt: suggestion.updated_at
    }));

    return res.json({
      success: true,
      data: {
        categoryId,
        suggestions: transformedSuggestions,
        total: transformedSuggestions.length
      }
    });

  } catch (error: any) {
    logger.error('❌ Error in category AI suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Category AI suggestions service error',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route POST /api/v1/categories/:id/ai-suggestions
 * @desc Create AI suggestion for a specific category
 * @access Admin only
 */
router.post('/:id/ai-suggestions', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const { suggestionType, suggestionData, confidenceScore, isApproved } = req.body;

    // Validate required fields
    if (!suggestionType || !suggestionData) {
      return res.status(400).json({
        success: false,
        message: 'Suggestion type and data are required'
      });
    }

    logger.info(`🤖 Creating AI suggestion for category: ${categoryId}`);

    // Insert new suggestion
    const { data: newSuggestion, error } = await supabase
      .from('category_ai_suggestions')
      .insert({
        category_id: categoryId,
        suggestion_type: suggestionType,
        suggestion_data: suggestionData,
        confidence_score: confidenceScore || 0.8,
        is_approved: isApproved !== undefined ? isApproved : true
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating AI suggestion:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: newSuggestion.id,
        categoryId: newSuggestion.category_id,
        suggestionType: newSuggestion.suggestion_type,
        suggestionData: newSuggestion.suggestion_data,
        confidenceScore: newSuggestion.confidence_score,
        isApproved: newSuggestion.is_approved,
        createdAt: newSuggestion.created_at,
        updatedAt: newSuggestion.updated_at
      }
    });

  } catch (error: any) {
    logger.error('❌ Error creating AI suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'AI suggestion creation error',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/v1/categories/ai-suggestions/:id
 * @desc Update AI suggestion
 * @access Admin only
 */
router.put('/ai-suggestions/:id', async (req, res) => {
  try {
    const suggestionId = parseInt(req.params.id);
    
    if (isNaN(suggestionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid suggestion ID'
      });
    }

    const updates = req.body;
    logger.info(`🤖 Updating AI suggestion: ${suggestionId}`);

    // Update suggestion
    const { data: updatedSuggestion, error } = await supabase
      .from('category_ai_suggestions')
      .update({
        suggestion_type: updates.suggestionType,
        suggestion_data: updates.suggestionData,
        confidence_score: updates.confidenceScore,
        is_approved: updates.isApproved,
        updated_at: new Date().toISOString()
      })
      .eq('id', suggestionId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating AI suggestion:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message
      });
    }

    if (!updatedSuggestion) {
      return res.status(404).json({
        success: false,
        message: 'AI suggestion not found'
      });
    }

    return res.json({
      success: true,
      data: {
        id: updatedSuggestion.id,
        categoryId: updatedSuggestion.category_id,
        suggestionType: updatedSuggestion.suggestion_type,
        suggestionData: updatedSuggestion.suggestion_data,
        confidenceScore: updatedSuggestion.confidence_score,
        isApproved: updatedSuggestion.is_approved,
        createdAt: updatedSuggestion.created_at,
        updatedAt: updatedSuggestion.updated_at
      }
    });

  } catch (error: any) {
    logger.error('❌ Error updating AI suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'AI suggestion update error',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * @route DELETE /api/v1/categories/ai-suggestions/:id
 * @desc Delete AI suggestion
 * @access Admin only
 */
router.delete('/ai-suggestions/:id', async (req, res) => {
  try {
    const suggestionId = parseInt(req.params.id);
    
    if (isNaN(suggestionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid suggestion ID'
      });
    }

    logger.info(`🤖 Deleting AI suggestion: ${suggestionId}`);

    // Delete suggestion
    const { error } = await supabase
      .from('category_ai_suggestions')
      .delete()
      .eq('id', suggestionId);

    if (error) {
      logger.error('Error deleting AI suggestion:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'AI suggestion deleted successfully'
    });

  } catch (error: any) {
    logger.error('❌ Error deleting AI suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'AI suggestion deletion error',
      error: error.message || 'Unknown error'
    });
  }
});

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

// Category Order System Endpoints
router.get('/ordered', authMiddleware({ requiredPermissions: ['categories:read'] }), async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order', { ascending: false })
      .order('display_priority', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      logger.error('❌ Error fetching ordered categories:', error);
      return res.status(500).json({ error: 'Failed to fetch ordered categories' });
    }

    return res.json(categories);
  } catch (error) {
    logger.error('❌ Error in /ordered endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/order', authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sort_order, display_priority, is_featured } = req.body;
    const userId = req.user?.id;

    console.log('🔄 [BACKEND] PUT /:id/order called with:', { id, sort_order, display_priority, is_featured, userId });

    const { data, error } = await supabase
      .from('categories')
      .update({
        sort_order: sort_order || 1000,
        display_priority: display_priority || 0,
        is_featured: is_featured || false,
        order_updated_at: new Date().toISOString(),
        order_updated_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log('❌ [BACKEND] Database error:', error);
      logger.error('❌ Error updating category order:', error);
      return res.status(500).json({ error: 'Failed to update category order' });
    }

    console.log('✅ [BACKEND] Database update successful:', data);
    logger.info(`✅ Category order updated: ${data.name} (ID: ${id})`);
    
    // Clear categories cache after order update
    try {
      // Clear both cache keys
      await apiCacheService.invalidateAPICache('categories');
      
      // Also clear the specific cache key used by categoryService
      const cacheManager = require('../services/cacheManager').default;
      await cacheManager.delete('categories_tree');
      
      console.log('🗑️ [BACKEND] Categories cache cleared (both keys)');
      logger.info('🗑️ Categories cache cleared after order update');
    } catch (cacheError) {
      console.log('⚠️ [BACKEND] Failed to clear cache:', cacheError);
      logger.warn('⚠️ Failed to clear categories cache:', cacheError);
    }
    
    return res.json(data);
  } catch (error) {
    console.log('❌ [BACKEND] Unexpected error:', error);
    logger.error('❌ Error in /:id/order endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reorder', authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { categories } = req.body; // Array of {id, sort_order, display_priority, is_featured}
    const userId = req.user?.id;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories must be an array' });
    }

    const updates = categories.map(cat => ({
      id: cat.id,
      sort_order: cat.sort_order || 1000,
      display_priority: cat.display_priority || 0,
      is_featured: cat.is_featured || false,
      order_updated_at: new Date().toISOString(),
      order_updated_by: userId
    }));

    const { data, error } = await supabase
      .from('categories')
      .upsert(updates, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('❌ Error reordering categories:', error);
      return res.status(500).json({ error: 'Failed to reorder categories' });
    }

    logger.info(`✅ Categories reordered: ${data.length} categories updated`);
    return res.json(data);
  } catch (error) {
    logger.error('❌ Error in /reorder endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/order-history', authMiddleware({ requiredPermissions: ['categories:read'] }), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { data: history, error } = await supabase
      .from('category_order_history')
      .select(`
        *,
        categories!inner(name)
      `)
      .order('changed_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      logger.error('❌ Error fetching order history:', error);
      return res.status(500).json({ error: 'Failed to fetch order history' });
    }

    return res.json(history);
  } catch (error) {
    logger.error('❌ Error in /order-history endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// Test endpoint to check category order
router.get('/test/order', async (req: Request, res: Response) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, sort_order')
      .is('parent_id', null)
      .order('sort_order', { ascending: false });

    if (error) {
      logger.error('❌ Error fetching category order:', error);
      return res.status(500).json({ error: 'Failed to fetch category order' });
    }

    return res.json(categories);
  } catch (error) {
    logger.error('❌ Error in test/order endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to clear cache and get fresh data
router.get('/test/clear-cache', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Cache temizleniyor...');
    
    // Import cache manager
    const cacheManager = require('../services/cacheManager').default;
    
    // Clear cache
    await cacheManager.delete('categories_tree');
    
    console.log('✅ Cache temizlendi');
    
    // Get fresh data
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, sort_order')
      .is('parent_id', null)
      .order('sort_order', { ascending: false });

    if (error) {
      logger.error('❌ Error fetching category order:', error);
      return res.status(500).json({ error: 'Failed to fetch category order' });
    }

    return res.json({
      message: 'Cache cleared and fresh data fetched',
      data: categories
    });
  } catch (error) {
    logger.error('❌ Error in test/clear-cache endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/toggle-featured', authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get current featured status
    const { data: current, error: fetchError } = await supabase
      .from('categories')
      .select('is_featured')
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error('❌ Error fetching current category:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch category' });
    }

    // Toggle featured status
    const { data, error } = await supabase
      .from('categories')
      .update({
        is_featured: !current.is_featured,
        order_updated_at: new Date().toISOString(),
        order_updated_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Error toggling featured status:', error);
      return res.status(500).json({ error: 'Failed to toggle featured status' });
    }

    logger.info(`✅ Category featured status toggled: ${data.name} (ID: ${id}) - Featured: ${data.is_featured}`);
    return res.json(data);
  } catch (error) {
    logger.error('❌ Error in /:id/toggle-featured endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as categoriesRouter }; 