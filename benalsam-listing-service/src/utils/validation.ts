/**
 * Validation Utilities
 * 
 * @fileoverview Validation functions for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { AuthenticatedRequest } from '../types/listing';
import { logger } from '../config/logger';

/**
 * Validates user authentication from request headers
 */
export function validateUserAuthentication(req: AuthenticatedRequest): string {
  const userId = req.headers['x-user-id'] as string || req.user?.id;
  if (!userId) {
    logger.warn('User authentication failed: Missing userId');
    throw new Error('User authentication required');
  }
  return userId;
}

/**
 * Validates listing data
 */
export function validateListingData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
  }

  if (!data.budget || typeof data.budget !== 'number' || data.budget <= 0) {
    errors.push('Budget is required and must be a positive number');
  }

  if (data.location && typeof data.location !== 'string') {
    errors.push('Location must be a string');
  }

  if (data.urgency && !['low', 'medium', 'high'].includes(data.urgency)) {
    errors.push('Urgency must be one of: low, medium, high');
  }

  if (data.contactPreference && !['email', 'phone', 'both'].includes(data.contactPreference)) {
    errors.push('Contact preference must be one of: email, phone, both');
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push('Images must be an array');
  }

  if (data.condition && !Array.isArray(data.condition)) {
    errors.push('Condition must be an array');
  }

  if (data.attributes && typeof data.attributes !== 'object') {
    errors.push('Attributes must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates listing update data
 */
export function validateListingUpdateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length === 0)) {
    errors.push('Title must be a non-empty string');
  }

  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim().length === 0)) {
    errors.push('Description must be a non-empty string');
  }

  if (data.category !== undefined && (typeof data.category !== 'string' || data.category.trim().length === 0)) {
    errors.push('Category must be a non-empty string');
  }

  if (data.budget !== undefined && (typeof data.budget !== 'number' || data.budget <= 0)) {
    errors.push('Budget must be a positive number');
  }

  if (data.location !== undefined && typeof data.location !== 'string') {
    errors.push('Location must be a string');
  }

  if (data.urgency !== undefined && !['low', 'medium', 'high'].includes(data.urgency)) {
    errors.push('Urgency must be one of: low, medium, high');
  }

  if (data.contactPreference !== undefined && !['email', 'phone', 'both'].includes(data.contactPreference)) {
    errors.push('Contact preference must be one of: email, phone, both');
  }

  if (data.images !== undefined && !Array.isArray(data.images)) {
    errors.push('Images must be an array');
  }

  if (data.condition !== undefined && !Array.isArray(data.condition)) {
    errors.push('Condition must be an array');
  }

  if (data.attributes !== undefined && typeof data.attributes !== 'object') {
    errors.push('Attributes must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates moderation action
 */
export function validateModerationAction(action: string): { isValid: boolean; error?: string } {
  const validActions = ['approve', 'reject', 're-evaluate'];
  
  if (!validActions.includes(action)) {
    return {
      isValid: false,
      error: `Invalid action. Must be one of: ${validActions.join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page: any, limit: any): { page: number; limit: number; errors: string[] } {
  const errors: string[] = [];
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Page must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be a positive integer between 1 and 100');
  }
  
  return {
    page: isNaN(pageNum) ? 1 : pageNum,
    limit: isNaN(limitNum) ? 10 : Math.min(limitNum, 100),
    errors
  };
}
