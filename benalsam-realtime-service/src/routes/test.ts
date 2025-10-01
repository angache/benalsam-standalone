import { Router } from 'express';
import rabbitmqService from '../services/rabbitmqService';
import logger from '../config/logger';

const router = Router();

/**
 * @route   POST /test/firebase-event
 * @desc    Test Firebase event mesajı gönder
 */
router.post('/firebase-event', async (_req, res) => {
  try {
    const testMessage = {
      id: `job_test_${Date.now()}`,
      type: 'status_change',
      action: 'update',
      timestamp: new Date().toISOString(),
      source: 'firebase_realtime',
      recordId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        listingId: '550e8400-e29b-41d4-a716-446655440000',
        jobId: `job_test_${Date.now()}`,
        change: {
          field: 'status',
          newValue: 'active',
          oldValue: 'pending',
          changedAt: new Date().toISOString()
        },
        source: {
          database: 'supabase',
          table: 'listings',
          id: '550e8400-e29b-41d4-a716-446655440000'
        }
      }
    };

    // RabbitMQ'ya gönder
    await rabbitmqService.sendMessage('elasticsearch.sync', testMessage);

    logger.info('✅ Test Firebase event sent:', {
      messageId: testMessage.id,
      type: testMessage.type,
      recordId: testMessage.recordId
    });

    res.json({
      success: true,
      message: 'Test Firebase event sent successfully',
      data: {
        messageId: testMessage.id,
        type: testMessage.type,
        recordId: testMessage.recordId,
        timestamp: testMessage.timestamp
      }
    });

  } catch (error) {
    logger.error('❌ Failed to send test Firebase event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test Firebase event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /test/edge-function-status-change
 * @desc    Test Edge Function listing status change mesajı gönder
 */
router.post('/edge-function-status-change', async (req, res) => {
  try {
    const { listingId, oldStatus, newStatus, userId } = req.body;

    if (!listingId || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: listingId, newStatus'
      });
    }

    const testMessage = {
      id: `job_test_${Date.now()}`,
      type: 'status_change',
      action: 'update',
      timestamp: new Date().toISOString(),
      source: 'firebase_edge_function',
      recordId: listingId,
      data: {
        listingId: listingId,
        jobId: `job_test_${Date.now()}`,
        change: {
          field: 'status',
          newValue: newStatus,
          oldValue: oldStatus,
          changedAt: new Date().toISOString()
        },
        source: {
          database: 'supabase',
          table: 'listings',
          id: listingId
        },
        metadata: {
          userId: userId,
          ip: req.ip,
          userAgent: req.get('user-agent') || 'unknown'
        }
      }
    };

    // RabbitMQ'ya gönder
    await rabbitmqService.sendMessage('elasticsearch.sync', testMessage);

    logger.info('✅ Test Edge Function status change sent:', {
      messageId: testMessage.id,
      type: testMessage.type,
      recordId: testMessage.recordId,
      oldStatus,
      newStatus
    });

    return res.json({
      success: true,
      message: 'Test Edge Function status change sent successfully',
      data: {
        messageId: testMessage.id,
        type: testMessage.type,
        recordId: testMessage.recordId,
        oldStatus,
        newStatus,
        timestamp: testMessage.timestamp
      }
    });

  } catch (error) {
    logger.error('❌ Failed to send test Edge Function status change:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test Edge Function status change',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /test/listing-change
 * @desc    Test listing change mesajı gönder
 */
router.post('/listing-change', async (_req, res) => {
  try {
    const testMessage = {
      id: `job_test_${Date.now()}`,
      type: 'listing_change',
      action: 'update',
      timestamp: new Date().toISOString(),
      source: 'firebase_realtime',
      recordId: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        listingId: '550e8400-e29b-41d4-a716-446655440000',
        jobId: `job_test_${Date.now()}`,
        change: {
          field: 'title',
          newValue: 'Test Listing Title Updated',
          oldValue: 'Test Listing Title',
          changedAt: new Date().toISOString()
        },
        source: {
          database: 'supabase',
          table: 'listings',
          id: '550e8400-e29b-41d4-a716-446655440000'
        }
      }
    };

    // RabbitMQ'ya gönder
    await rabbitmqService.sendMessage('elasticsearch.sync', testMessage);

    logger.info('✅ Test listing change sent:', {
      messageId: testMessage.id,
      type: testMessage.type,
      recordId: testMessage.recordId
    });

    res.json({
      success: true,
      message: 'Test listing change sent successfully',
      data: {
        messageId: testMessage.id,
        type: testMessage.type,
        recordId: testMessage.recordId,
        timestamp: testMessage.timestamp
      }
    });

  } catch (error) {
    logger.error('❌ Failed to send test listing change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test listing change',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as testRoutes };
