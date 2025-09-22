/**
 * Job Processor Service
 * 
 * @fileoverview Job processing system for listing operations
 * @author Benalsam Team
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { ConsumeMessage } from 'amqplib';
import { logger } from '../config/logger';
import { getChannel } from '../config/rabbitmq';
import { listingService } from './listingService';
// import { uploadService } from './uploadService';

export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  userId: string;
  payload: any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  traceId: string;
}

export class JobProcessorService {
  private static instance: JobProcessorService;
  private isProcessing = false;
  private activeJobs = new Map<string, Job>();
  private jobMetrics = {
    totalJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    retryingJobs: 0
  };

  static getInstance(): JobProcessorService {
    if (!JobProcessorService.instance) {
      JobProcessorService.instance = new JobProcessorService();
    }
    return JobProcessorService.instance;
  }

  /**
   * Start job processing
   */
  async start(): Promise<void> {
    try {
      if (this.isProcessing) {
        logger.warn('⚠️ Job processor already running');
        return;
      }

      logger.info('🚀 Starting job processor...');
      this.isProcessing = true;

      // Start consuming jobs from RabbitMQ
      await this.startJobConsumer();

      logger.info('✅ Job processor started');

    } catch (error) {
      logger.error('❌ Failed to start job processor:', error);
      throw error;
    }
  }

  /**
   * Stop job processing
   */
  async stop(): Promise<void> {
    try {
      logger.info('🛑 Stopping job processor...');
      this.isProcessing = false;
      logger.info('✅ Job processor stopped');
    } catch (error) {
      logger.error('❌ Error stopping job processor:', error);
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData: {
    type: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    userId: string;
    payload: any;
  }): Promise<string> {
    try {
      const jobId = uuidv4();
      const traceId = `job_${jobId}_${Date.now()}`;

      const job: Job = {
        id: jobId,
        type: jobData.type,
        status: 'pending',
        priority: jobData.priority,
        userId: jobData.userId,
        payload: jobData.payload,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        traceId
      };

      // Store job in memory
      this.activeJobs.set(jobId, job);
      this.updateMetrics('pending');

      // Publish job to RabbitMQ
      await this.publishJob(job);

      logger.info('✅ Job created', { jobId, type: job.type, userId: job.userId });
      return jobId;

    } catch (error) {
      logger.error('❌ Error creating job:', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) {
        return false;
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return false;
      }

      job.status = 'cancelled';
      job.updatedAt = new Date();
      this.activeJobs.set(jobId, job);

      logger.info('✅ Job cancelled', { jobId });
      return true;

    } catch (error) {
      logger.error('❌ Error cancelling job:', error);
      return false;
    }
  }

  /**
   * Get job metrics
   */
  getMetrics() {
    return { ...this.jobMetrics };
  }

  /**
   * Start job consumer
   */
  private async startJobConsumer(): Promise<void> {
    try {
      const channel = getChannel();
      
      // Consume from listing jobs queue
      await channel.consume('listing.jobs', async (msg: ConsumeMessage | null) => {
        if (!msg) {
          logger.warn('⚠️ Received null message from queue');
          return;
        }

        logger.info('📨 Received job message from queue', {
          routingKey: msg.fields.routingKey,
          exchange: msg.fields.exchange,
          messageSize: msg.content.length
        });

        try {
          const job = JSON.parse(msg.content.toString()) as Job;
          logger.info('🔄 Processing job', { jobId: job.id, type: job.type });
          await this.processJob(job);
          channel.ack(msg);
        } catch (error) {
          logger.error('❌ Error processing job message:', error);
          channel.nack(msg, false, false);
        }
      }, { noAck: false });

      logger.info('✅ Job consumer started');

    } catch (error) {
      logger.error('❌ Error starting job consumer:', error);
      throw error;
    }
  }

  /**
   * Publish job to RabbitMQ
   */
  private async publishJob(job: Job): Promise<void> {
    try {
      const channel = getChannel();
      
      await channel.publish(
        'benalsam.jobs',
        'listing.jobs',
        Buffer.from(JSON.stringify(job)),
        {
          messageId: job.id,
          persistent: true,
          priority: this.getPriorityValue(job.priority)
        }
      );

      logger.info('📤 Job published to RabbitMQ', { jobId: job.id, type: job.type });

    } catch (error) {
      logger.error('❌ Error publishing job:', error);
      throw error;
    }
  }

  /**
   * Process a job
   */
  private async processJob(job: Job): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`🔄 Processing job: ${job.id} (${job.type})`, {
        jobId: job.id,
        type: job.type,
        priority: job.priority,
        userId: job.userId,
        traceId: job.traceId
      });

      // Update job status
      job.status = 'processing';
      job.updatedAt = new Date();
      this.activeJobs.set(job.id, job);
      this.updateMetrics('processing');

      // Process based on job type
      let result: any;
      switch (job.type) {
        case 'LISTING_CREATE_REQUESTED':
          result = await this.processListingCreate(job);
          break;
        case 'LISTING_UPDATE_REQUESTED':
          result = await this.processListingUpdate(job);
          break;
        case 'LISTING_DELETE_REQUESTED':
          result = await this.processListingDelete(job);
          break;
        case 'LISTING_MODERATE_REQUESTED':
          result = await this.processListingModerate(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      this.activeJobs.set(job.id, job);
      this.updateMetrics('completed');

      const processingTime = Date.now() - startTime;
      logger.info(`✅ Job completed successfully in ${processingTime}ms`, {
        jobId: job.id,
        type: job.type,
        processingTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Handle retry logic
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';
        job.updatedAt = new Date();
        this.activeJobs.set(job.id, job);
        this.updateMetrics('retrying');

        logger.warn(`⚠️ Job failed, retrying (${job.retryCount}/${job.maxRetries})`, {
          jobId: job.id,
          type: job.type,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        });

        // Retry after delay
        setTimeout(() => {
          this.publishJob(job);
        }, Math.pow(2, job.retryCount) * 1000); // Exponential backoff

      } else {
        // Max retries exceeded
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.updatedAt = new Date();
        this.activeJobs.set(job.id, job);
        this.updateMetrics('failed');

        logger.error(`❌ Job failed after ${job.maxRetries} retries`, {
          jobId: job.id,
          type: job.type,
          error: job.error,
          processingTime
        });
      }
    }
  }

  /**
   * Process listing creation
   */
  private async processListingCreate(job: Job): Promise<any> {
    const { listingData } = job.payload;
    
    logger.info('🚀 Processing listing creation', {
      jobId: job.id,
      title: listingData.title,
      userId: job.userId
    });

    // Create listing in database
    const listing = await listingService.createListing({
      ...listingData,
      user_id: job.userId
    });

    // TODO: Upload images if provided
    // TODO: Send notifications
    // TODO: Update Elasticsearch

    logger.info('✅ Listing created successfully', {
      jobId: job.id,
      listingId: listing.id,
      title: listing.title
    });

    return {
      listingId: listing.id,
      listing,
      status: 'completed'
    };
  }

  /**
   * Process listing update
   */
  private async processListingUpdate(job: Job): Promise<any> {
    const { listingId, updateData } = job.payload;
    
    logger.info('🔄 Processing listing update', {
      jobId: job.id,
      listingId,
      userId: job.userId
    });

    // Update listing in database
    const listing = await listingService.updateListing(listingId, updateData, job.userId);

    // TODO: Update images if provided
    // TODO: Send notifications
    // TODO: Update Elasticsearch

    logger.info('✅ Listing updated successfully', {
      jobId: job.id,
      listingId: listing.id,
      title: listing.title
    });

    return {
      listingId: listing.id,
      listing,
      status: 'completed'
    };
  }

  /**
   * Process listing deletion
   */
  private async processListingDelete(job: Job): Promise<any> {
    const { listingId } = job.payload;
    
    logger.info('🗑️ Processing listing deletion', {
      jobId: job.id,
      listingId,
      userId: job.userId
    });

    // Delete listing from database
    await listingService.deleteListing(listingId, job.userId);

    // TODO: Delete images
    // TODO: Send notifications
    // TODO: Remove from Elasticsearch

    logger.info('✅ Listing deleted successfully', {
      jobId: job.id,
      listingId
    });

    return {
      listingId,
      status: 'completed'
    };
  }

  /**
   * Process listing moderation
   */
  private async processListingModerate(job: Job): Promise<any> {
    const { listingId, action, reason } = job.payload;
    
    logger.info('⚖️ Processing listing moderation', {
      jobId: job.id,
      listingId,
      action,
      userId: job.userId
    });

    // Moderate listing
    const listing = await listingService.moderateListing(listingId, action, reason, job.userId);

    // TODO: Send notifications
    // TODO: Update Elasticsearch

    logger.info('✅ Listing moderated successfully', {
      jobId: job.id,
      listingId: listing.id,
      action,
      status: listing.status
    });

    return {
      listingId: listing.id,
      listing,
      action,
      status: 'completed'
    };
  }

  /**
   * Update job metrics
   */
  private updateMetrics(status: string): void {
    this.jobMetrics.totalJobs++;
    
    switch (status) {
      case 'pending':
        this.jobMetrics.pendingJobs++;
        break;
      case 'processing':
        this.jobMetrics.processingJobs++;
        break;
      case 'completed':
        this.jobMetrics.completedJobs++;
        break;
      case 'failed':
        this.jobMetrics.failedJobs++;
        break;
      case 'retrying':
        this.jobMetrics.retryingJobs++;
        break;
    }
  }

  /**
   * Get priority value for RabbitMQ
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 10;
      case 'high': return 7;
      case 'normal': return 5;
      case 'low': return 3;
      default: return 5;
    }
  }
}

export const jobProcessorService = JobProcessorService.getInstance();
