/**
 * Listing Routes
 * 
 * @fileoverview CRUD operations for listings in Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Router, Response } from 'express';
import { listingService } from '../services/listingService';
import { jobProcessorService } from '../services/jobProcessor';
import { logger } from '../config/logger';
import { validateUserAuthentication } from '../utils/validation';
import { AuthenticatedRequest } from '../types/listing';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Get all listings with filters
 * GET /api/v1/listings
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const filters = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    status: status as string,
    category: category as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc'
  };

  logger.info('🔍 Fetching listings', { userId, filters });

  const result = await listingService.getListings(filters);
  
  res.json({
    success: true,
    data: result.listings,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / filters.limit),
      hasMore: result.hasMore
    }
  });
}));

/**
 * Get single listing by ID
 * GET /api/v1/listings/:id
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Listing ID is required'
    });
    return;
  }

  logger.info('🔍 Fetching listing', { userId, listingId: id });

  const listing = await listingService.getListingById(id, userId);
  
  if (!listing) {
    res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
    return;
  }

  res.json({
    success: true,
    data: listing
  });
}));

/**
 * Create new listing
 * POST /api/v1/listings
 */
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  
  const {
    title,
    description,
    category,
    budget,
    location,
    urgency = 'medium',
    images = [],
    mainImageUrl,
    additionalImageUrls = [],
    mainImageIndex = 0,
    autoRepublish = false,
    contactPreference = 'both',
    acceptTerms = true,
    isFeatured = false,
    isUrgentPremium = false,
    isShowcase = false,
    geolocation,
    condition = [],
    attributes = {},
    duration
  } = req.body;

  // Validation
  if (!title || !description || !category || !budget) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: title, description, category, budget'
    });
    return;
  }

  if (!acceptTerms) {
    res.status(400).json({
      success: false,
      message: 'You must accept the terms and conditions'
    });
    return;
  }

  logger.info('🚀 Creating listing', { userId, title, category });

  // Create listing via job system
  const jobId = await jobProcessorService.createJob({
    type: 'LISTING_CREATE_REQUESTED',
    priority: 'high',
    userId,
    payload: {
      listingData: {
        title,
        description,
        category,
        budget: Number(budget),
        location,
        urgency,
        images,
        mainImageUrl,
        additionalImageUrls,
        mainImageIndex,
        autoRepublish,
        contactPreference,
        acceptTerms,
        isFeatured,
        isUrgentPremium,
        isShowcase,
        geolocation,
        condition,
        attributes,
        duration
      },
      metadata: {
        source: 'listing-service',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    }
  });

  logger.info('✅ Listing creation job created', { jobId, userId });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      message: 'Listing creation started',
      status: 'processing'
    }
  });
}));

/**
 * Update existing listing
 * PUT /api/v1/listings/:id
 */
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;
  
  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Listing ID is required'
    });
    return;
  }

  const updateData = req.body;

  logger.info('🔄 Updating listing', { userId, listingId: id, updateFields: Object.keys(updateData) });

  // Check if listing exists and user has permission
  const existingListing = await listingService.getListingById(id, userId);
  if (!existingListing) {
    res.status(404).json({
      success: false,
      message: 'Listing not found or access denied'
    });
    return;
  }

  // Create listing update job
  const jobId = await jobProcessorService.createJob({
    type: 'LISTING_UPDATE_REQUESTED',
    priority: 'normal',
    userId,
    payload: {
      listingId: id,
      updateData,
      metadata: {
        source: 'listing-service',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    }
  });

  logger.info('✅ Listing update job created', { jobId, userId, listingId: id });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      message: 'Listing update started',
      status: 'processing'
    }
  });
}));

/**
 * Delete listing
 * DELETE /api/v1/listings/:id
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Listing ID is required'
    });
    return;
  }

  logger.info('🗑️ Deleting listing', { userId, listingId: id });

  // Check if listing exists and user has permission
  const existingListing = await listingService.getListingById(id, userId);
  if (!existingListing) {
    res.status(404).json({
      success: false,
      message: 'Listing not found or access denied'
    });
    return;
  }

  // Create listing deletion job
  const jobId = await jobProcessorService.createJob({
    type: 'LISTING_DELETE_REQUESTED',
    priority: 'high',
    userId,
    payload: {
      listingId: id,
      metadata: {
        source: 'listing-service',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    }
  });

  logger.info('✅ Listing deletion job created', { jobId, userId, listingId: id });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      message: 'Listing deletion started',
      status: 'processing'
    }
  });
}));

/**
 * Moderate listing (Admin only)
 * POST /api/v1/listings/:id/moderate
 */
router.post('/:id/moderate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Listing ID is required'
    });
    return;
  }

  if (!action || !['approve', 'reject', 're-evaluate'].includes(action)) {
    res.status(400).json({
      success: false,
      message: 'Invalid action. Must be: approve, reject, or re-evaluate'
    });
    return;
  }

  logger.info('⚖️ Moderating listing', { userId, listingId: id, action, reason });

  // Create moderation job
  const jobId = await jobProcessorService.createJob({
    type: 'LISTING_MODERATE_REQUESTED',
    priority: 'high',
    userId,
    payload: {
      listingId: id,
      action,
      reason,
      metadata: {
        source: 'listing-service',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    }
  });

  logger.info('✅ Listing moderation job created', { jobId, userId, listingId: id, action });

  res.status(202).json({
    success: true,
    data: {
      jobId,
      message: 'Listing moderation started',
      status: 'processing'
    }
  });
}));

/**
 * Get listing job status
 * GET /api/v1/listings/jobs/:jobId
 */
router.get('/jobs/:jobId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { jobId } = req.params;

  if (!jobId) {
    res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
    return;
  }

  logger.info('📊 Getting job status', { userId, jobId });

  const job = await jobProcessorService.getJob(jobId);
  
  if (!job) {
    res.status(404).json({
      success: false,
      message: 'Job not found'
    });
    return;
  }

  // Check if user has access to this job
  if (job.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      progress: job.status === 'completed' ? 100 : 
               job.status === 'failed' ? 0 : 
               job.status === 'processing' ? 50 : 0,
      result: job.status === 'completed' ? job.result : null,
      error: job.error || null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt
    }
  });
}));

/**
 * Cancel listing job
 * DELETE /api/v1/listings/jobs/:jobId
 */
router.delete('/jobs/:jobId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = validateUserAuthentication(req);
  const { jobId } = req.params;

  if (!jobId) {
    res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
    return;
  }

  logger.info('❌ Cancelling job', { userId, jobId });

  const job = await jobProcessorService.getJob(jobId);
  
  if (!job) {
    res.status(404).json({
      success: false,
      message: 'Job not found'
    });
    return;
  }

  // Check if user has access to this job
  if (job.userId !== userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied'
    });
    return;
  }

  await jobProcessorService.cancelJob(jobId);

  logger.info('✅ Job cancelled', { jobId, userId });

  res.json({
    success: true,
    data: {
      jobId,
      message: 'Job cancelled successfully'
    }
  });
}));

export default router;
