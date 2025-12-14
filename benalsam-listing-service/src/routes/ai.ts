/**
 * AI Routes
 * 
 * @fileoverview AI suggestion endpoints for listing creation
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Router, Response } from 'express';
import { listingAIService } from '../services/listingAIService';
import { logger } from '../config/logger';
import { validateUserAuthentication } from '../utils/validation';
import { AuthenticatedRequest } from '../types/listing';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Suggest title
 * POST /api/v1/listings/ai/suggest-title
 */
router.post('/suggest-title', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { category, categoryId, attributes, currentTitle, userInput } = req.body;

  if (!category) {
    res.status(400).json({
      success: false,
      message: 'Category is required'
    });
    return;
  }

  logger.info('🤖 AI: Title suggestion requested', { userId, category, userInput, currentTitle });

  const suggestions = await listingAIService.suggestTitle({
    category,
    categoryId,
    attributes: attributes || {},
    currentTitle,
    userInput
  });

  res.json({
    success: true,
    data: suggestions
  });
}));

/**
 * Suggest description
 * POST /api/v1/listings/ai/suggest-description
 */
router.post('/suggest-description', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { category, categoryId, attributes, currentDescription, userInput } = req.body;

  if (!category) {
    res.status(400).json({
      success: false,
      message: 'Category is required'
    });
    return;
  }

  logger.info('🤖 AI: Description suggestion requested', { userId, category, userInput });

  const description = await listingAIService.suggestDescription({
    category,
    categoryId,
    attributes: attributes || {},
    currentDescription,
    userInput
  });

  res.json({
    success: true,
    data: description
  });
}));

/**
 * Suggest attributes
 * POST /api/v1/listings/ai/suggest-attributes
 */
router.post('/suggest-attributes', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { category, categoryId, userInput, attributes } = req.body;

  if (!category) {
    res.status(400).json({
      success: false,
      message: 'Category is required'
    });
    return;
  }

  if (!userInput || userInput.length < 2) {
    res.status(400).json({
      success: false,
      message: 'User input is required (minimum 2 characters)'
    });
    return;
  }

  logger.info('🤖 AI: Attribute suggestion requested', { userId, category, userInput });

  const suggestions = await listingAIService.suggestAttributes({
    category,
    categoryId,
    userInput,
    attributes: attributes || {}
  });

  res.json({
    success: true,
    data: suggestions
  });
}));

/**
 * Suggest price
 * POST /api/v1/listings/ai/suggest-price
 */
router.post('/suggest-price', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { category, categoryId, attributes } = req.body;

  if (!category) {
    res.status(400).json({
      success: false,
      message: 'Category is required'
    });
    return;
  }

  logger.info('🤖 AI: Price suggestion requested', { userId, category });

  const priceRange = await listingAIService.suggestPrice({
    category,
    categoryId,
    attributes: attributes || {}
  });

  res.json({
    success: true,
    data: priceRange
  });
}));

/**
 * Get completion suggestions
 * POST /api/v1/listings/ai/suggest-completion
 */
router.post('/suggest-completion', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { category, categoryId, attributes, currentData } = req.body;

  if (!category) {
    res.status(400).json({
      success: false,
      message: 'Category is required'
    });
    return;
  }

  logger.info('🤖 AI: Completion suggestion requested', { userId, category });

  const suggestions = await listingAIService.suggestCompletion({
    category,
    categoryId,
    attributes: attributes || {},
    currentData: currentData || {}
  });

  res.json({
    success: true,
    data: suggestions
  });
}));

export default router;

