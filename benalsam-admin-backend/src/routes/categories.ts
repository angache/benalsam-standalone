import { Router, IRouter } from 'express';
import { categoriesController } from '../controllers/categoriesController';
import { authMiddleware } from '../middleware/auth';
import apiCacheService from '../services/apiCacheService';
import { supabase } from '../config/database';
import logger from '../config/logger';

const router: IRouter = Router();

// Get all categories - temporarily without auth for testing
router.get('/', categoriesController.getCategories);

// Get ALL categories (main + subcategories) - temporarily without auth for testing
router.get('/all', categoriesController.getAllCategories);

// Get single category by ID - temporarily without auth for testing
router.get('/:id', categoriesController.getCategory);

/**
 * @route GET /api/v1/categories/:id/ai-suggestions
 * @desc Get AI suggestions for a specific category
 * @access Public
 */
router.get('/:id/ai-suggestions', async (req, res) => {
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

export { router as categoriesRouter }; 