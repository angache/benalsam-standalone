import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { publishEvent } from '../config/rabbitmq';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { Listing, ListingStatusType } from 'benalsam-shared-types';

const router = Router();

// Flexible request interface - web'den gelen tüm field'ları kabul eder
interface CreateListingRequest {
  // Required fields
  title: string;
  description: string;
  category: string;
  budget: number;  // Budget
  location: string;
  
  // Optional fields that web might send
  images?: string[];
  status?: string;
  urgency?: 'low' | 'medium' | 'high';
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  condition?: string[];
  attributes?: Record<string, string[]>;
  category_id?: string | null;
  category_path?: string[];
  contactPreference?: 'email' | 'phone' | 'both';
  acceptTerms?: boolean;
  isFeatured?: boolean;
  isUrgentPremium?: boolean;
  isShowcase?: boolean;
  autoRepublish?: boolean;
  duration?: number;
  
  // Metadata
  metadata?: {
    source?: string;
    userAgent?: string;
    duration?: number;
    mainImageIndex?: number;
  };
}

/**
 * Create new listing via Upload Service
 * POST /api/v1/listings/create
 */
router.post('/create', uploadRateLimiter, asyncHandler(async (req: Request<{}, {}, CreateListingRequest>, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const {
    title,
    description,
    category,
    budget,  // Web'den "budget" geliyor
    location,
    images = [],
    status,
    urgency,
    geolocation,
    condition,
    attributes,
    category_id,
    category_path,
    contactPreference,
    acceptTerms,
    isFeatured,
    isUrgentPremium,
    isShowcase,
    autoRepublish,
    duration,
    metadata = {}
  } = req.body;

  // Validation
  if (!title || !description || !category || !budget) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: title, description, category, budget'
    });
  }

  logger.info('🚀 Creating listing via Upload Service', { 
    userId, 
    title, 
    category,
    category_id,
    category_path,
    imageCount: images.length 
  });

  try {
    // Create job for listing creation (matching Listing Service's expected format)
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'LISTING_CREATE_REQUESTED',
      status: 'pending',
      priority: 'high',
      userId,
      payload: {
        listingData: {
          title,
          description,
          category,
          budget: Number(budget) || 1,  // Numeric budget
          location,
          urgency: urgency || 'medium',  // Default değer
          images,
          mainImageUrl: images[0] || null,
          additionalImageUrls: images.slice(1),
          mainImageIndex: metadata.mainImageIndex || 0,
          autoRepublish: autoRepublish || false,
          contactPreference: contactPreference || 'both',
          acceptTerms: acceptTerms || true,
          isFeatured: isFeatured || false,
          isUrgentPremium: isUrgentPremium || false,
          isShowcase: isShowcase || false,
          geolocation,
          condition: condition || [],
          attributes: attributes || {},
          category_id: category_id || null,
          category_path: category_path || [],
          duration: duration || metadata.duration || 30
        },
        metadata: {
          source: 'upload-service',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          ...metadata
        }
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      traceId: uuidv4()
    };

          // Publish job to RabbitMQ (using the correct exchange and routing key for Listing Service)
          await publishEvent('listing.jobs', job);

    logger.info('✅ Listing creation job published', { 
      userId, 
      title,
      jobId,
      jobType: job.type 
    });

    res.status(202).json({
      success: true,
      message: 'Listing creation job started',
      data: {
        jobId,
        status: 'PENDING',
        estimatedCompletionTime: '2-5 minutes'
      }
    });

  } catch (error) {
    logger.error('❌ Failed to create listing', { 
      userId, 
      title, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Update listing via Upload Service
 * PUT /api/v1/listings/:id
 */
router.put('/:id', uploadRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const listingId = req.params.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User ID is required'
    });
  }

  if (!listingId) {
    return res.status(400).json({
      success: false,
      message: 'Listing ID is required'
    });
  }

  const updates = req.body;

  logger.info('🔄 Updating listing via Upload Service', { 
    userId, 
    listingId,
    updateFields: Object.keys(updates)
  });

  try {
    // Create job for listing update (matching Listing Service's expected format)
    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'LISTING_UPDATE_REQUESTED',
      status: 'pending',
      priority: 'normal',
      userId,
      payload: {
        listingId,
        updates,
        metadata: {
          source: 'upload-service',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      traceId: uuidv4()
    };

    // Publish job to RabbitMQ
    await publishEvent('listing.jobs', job);

    logger.info('✅ Listing update job published', { 
      userId, 
      listingId,
      jobId,
      jobType: job.type 
    });

    res.status(202).json({
      success: true,
      message: 'Listing update job started',
      data: {
        jobId,
        status: 'PENDING',
        estimatedCompletionTime: '1-3 minutes'
      }
    });

  } catch (error) {
    logger.error('❌ Failed to update listing', { 
      userId, 
      listingId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Get job status
 * GET /api/v1/listings/status/:jobId
 */
router.get('/status/:jobId', uploadRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const jobId = req.params.jobId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User ID is required'
    });
  }

  if (!jobId) {
    return res.status(400).json({
      success: false,
      message: 'Job ID is required'
    });
  }

  logger.info('🔍 Checking job status', { 
    userId, 
    jobId
  });

  try {
    // For now, return a mock status since we don't have job tracking yet
    // In a real implementation, this would query the job processor or database
    res.status(200).json({
      success: true,
      data: {
        jobId,
        status: 'completed', // Mock status
        progress: 100,
        result: {
          listingId: '4c9458a4-169f-47be-816c-b823556864fc' // Mock listing ID for testing
        }
      }
    });

  } catch (error) {
    logger.error('❌ Failed to get job status', { 
      userId, 
      jobId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;
