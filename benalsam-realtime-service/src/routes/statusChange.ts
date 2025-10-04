import { Router } from 'express';
import { FirebaseService } from '../services/firebaseService';
import logger from '../config/logger';
import { EnterpriseJobData } from '../types/job';

const router = Router();
const firebaseService = new FirebaseService();

/**
 * @route   POST /api/v1/status-change
 * @desc    Edge Function'dan gelen listing status change'i işle
 */
router.post('/', async (req, res) => {
  try {
    const { listingId, oldStatus, newStatus, userId, timestamp, source, metadata } = req.body;

    // Validation
    if (!listingId || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: listingId, newStatus'
      });
    }

    // Job ID oluştur
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enterprise job verisi oluştur
    const now = new Date().toISOString();
    const jobData: EnterpriseJobData = {
      id: jobId,
      listingId: listingId,
      listingStatus: newStatus,
      type: 'status_change',
      source: source || 'edge_function',
      status: 'pending',
      timestamp: timestamp || now,
      queuedAt: now,
      maxRetries: 3,
      retryCount: 0,
      
      // Enterprise fields
      serviceName: 'realtime-service',
      version: process.env['SERVICE_VERSION'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      
      // Compliance & Audit
      userId: userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      requestId: req.headers['x-request-id'] as string || `req_${Date.now()}`,
      correlationId: req.headers['x-correlation-id'] as string || `corr_${Date.now()}`,
      
      // Metadata
      metadata: {
        oldStatus: oldStatus,
        newStatus: newStatus,
        ...metadata
      }
    };

    // Firebase'e job oluştur
    await firebaseService.createJob(jobData);

    logger.info('✅ Status change job created:', {
      jobId,
      listingId,
      oldStatus,
      newStatus,
      source
    });

    return res.json({
      success: true,
      message: 'Status change job created successfully',
      data: {
        jobId,
        listingId,
        oldStatus,
        newStatus,
        timestamp: jobData.timestamp
      }
    });

  } catch (error) {
    logger.error('❌ Failed to create status change job:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create status change job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as statusChangeRoutes };
