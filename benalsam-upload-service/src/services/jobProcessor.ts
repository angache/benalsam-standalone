/**
 * Job Processor Service
 * 
 * @fileoverview Enterprise job processing system with priority, retry, and monitoring
 * @author Benalsam Team
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { ConsumeMessage } from 'amqplib';
import { logger } from '../config/logger';
import { rabbitmqConfig } from '../config/rabbitmq';
import { cloudinaryService } from './cloudinaryService';
import { quotaService } from './quotaService';
import {
  Job,
  JobType,
  JobStatus,
  JobPriority,
  UploadJob,
  ProcessingJob,
  DatabaseJob,
  NotificationJob,
  CleanupJob,
  JobResult,
  UploadResult,
  ProcessingResult,
  JobError,
  JobTimeoutError,
  JobValidationError,
  JobProcessingError,
  QUEUE_CONFIGS,
  JobMetrics,
  QueueMetrics,
  JobProgress
} from '../types/jobs';

export class JobProcessorService {
  private isProcessing = false;
  private activeJobs = new Map<string, Job>();
  private jobMetrics: JobMetrics = {
    totalJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    retryingJobs: 0,
    averageProcessingTime: 0,
    successRate: 0,
    errorRate: 0
  };

  /**
   * Start the job processor
   */
  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Job Processor Service...');
      
      // Setup queues
      await this.setupQueues();
      
      // Start processing
      await this.startProcessing();
      
      this.isProcessing = true;
      logger.info('✅ Job Processor Service started');
      
    } catch (error) {
      logger.error('❌ Failed to start Job Processor Service:', error);
      throw error;
    }
  }

  /**
   * Stop the job processor
   */
  async stop(): Promise<void> {
    try {
      logger.info('🛑 Stopping Job Processor Service...');
      this.isProcessing = false;
      
      // Wait for active jobs to complete
      await this.waitForActiveJobs();
      
      logger.info('✅ Job Processor Service stopped');
      
    } catch (error) {
      logger.error('❌ Error stopping Job Processor Service:', error);
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData: Partial<Job>): Promise<string> {
    try {
      const jobId = uuidv4();
      const traceId = uuidv4();
      
      const job: Job = {
        id: jobId,
        type: jobData.type!,
        status: 'pending',
        priority: jobData.priority || 'normal',
        userId: jobData.userId!,
        retryCount: 0,
        maxRetries: this.getMaxRetries(jobData.priority || 'normal'),
        createdAt: new Date(),
        updatedAt: new Date(),
        traceId,
        correlationId: jobData.correlationId,
        ...jobData
      } as Job;

      // Validate job
      this.validateJob(job);

      // Store job
      this.activeJobs.set(jobId, job);

      // Publish to appropriate queue
      await this.publishJob(job);

      // Update metrics
      this.updateMetrics('created', job);

      logger.info(`📝 Job created: ${jobId} (${job.type})`, {
        jobId,
        type: job.type,
        priority: job.priority,
        userId: job.userId,
        traceId
      });

      return jobId;

    } catch (error) {
      logger.error('❌ Failed to create job:', error);
      throw error;
    }
  }

  /**
   * Process a job
   */
  async processJob(job: Job): Promise<JobResult> {
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

      // Process based on job type
      let result: any;
      switch (job.type) {
        case 'IMAGE_UPLOAD_REQUESTED':
          result = await this.processImageUpload(job as UploadJob);
          break;
        case 'IMAGE_UPLOAD_PROCESSING':
          result = await this.processImageUploadProcessing(job as UploadJob);
          break;
        case 'IMAGE_RESIZE':
          result = await this.processImageResize(job as ProcessingJob);
          break;
        case 'THUMBNAIL_GENERATE':
          result = await this.processThumbnailGenerate(job as ProcessingJob);
          break;
        case 'METADATA_EXTRACT':
          result = await this.processMetadataExtract(job as ProcessingJob);
          break;
        case 'VIRUS_SCAN':
          result = await this.processVirusScan(job as ProcessingJob);
          break;
        case 'DATABASE_UPDATE':
          result = await this.processDatabaseUpdate(job as DatabaseJob);
          break;
        case 'NOTIFICATION_SEND':
          result = await this.processNotification(job as NotificationJob);
          break;
        case 'CLEANUP_TEMP_FILES':
          result = await this.processCleanup(job as CleanupJob);
          break;
        default:
          throw new JobProcessingError(job.id, job.type, `Unknown job type: ${job.type}`);
      }

      // Mark job as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      this.activeJobs.set(job.id, job);

      const duration = Date.now() - startTime;
      this.updateMetrics('completed', job, duration);

      logger.info(`✅ Job completed: ${job.id} (${job.type})`, {
        jobId: job.id,
        type: job.type,
        duration,
        traceId: job.traceId
      });

      return {
        success: true,
        jobId: job.id,
        result,
        duration,
        timestamp: new Date()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle retry logic
      if (job.retryCount < job.maxRetries && this.isRetryableError(error)) {
        await this.retryJob(job, error);
      } else {
        // Mark job as failed
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.updatedAt = new Date();
        this.activeJobs.set(job.id, job);
        
        this.updateMetrics('failed', job, duration);
        
        logger.error(`❌ Job failed: ${job.id} (${job.type})`, {
          jobId: job.id,
          type: job.type,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          duration,
          traceId: job.traceId
        });
      }

      return {
        success: false,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get job metrics
   */
  getMetrics(): JobMetrics {
    return { ...this.jobMetrics };
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<QueueMetrics[]> {
    // Implementation for queue metrics
    return [];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async setupQueues(): Promise<void> {
    try {
      const channel = await rabbitmqConfig.getChannel();
      
      // Create exchanges
      await channel.assertExchange('upload.jobs', 'topic', { durable: true });
      await channel.assertExchange('processing.jobs', 'topic', { durable: true });
      await channel.assertExchange('notifications.jobs', 'topic', { durable: true });
      
      // Create dead letter exchanges
      await channel.assertExchange('upload.dlx', 'topic', { durable: true });
      await channel.assertExchange('processing.dlx', 'topic', { durable: true });
      await channel.assertExchange('notifications.dlx', 'topic', { durable: true });
      
      // Create queues
      for (const [queueName, config] of Object.entries(QUEUE_CONFIGS)) {
        await channel.assertQueue(queueName, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': config.deadLetterExchange,
            'x-dead-letter-routing-key': 'dead.letter',
            'x-message-ttl': config.messageTtl,
            'x-max-retries': config.maxRetries,
            'x-queue-type': 'classic'
          }
        });
        
        // Bind to appropriate exchange
        if (queueName.startsWith('upload.')) {
          await channel.bindQueue(queueName, 'upload.jobs', queueName);
        } else if (queueName.startsWith('processing.')) {
          await channel.bindQueue(queueName, 'processing.jobs', queueName);
        } else if (queueName.startsWith('notifications')) {
          await channel.bindQueue(queueName, 'notifications.jobs', queueName);
        }
      }
      
      logger.info('✅ Job queues setup completed');
      
    } catch (error) {
      logger.error('❌ Failed to setup job queues:', error);
      throw error;
    }
  }

  private async startProcessing(): Promise<void> {
    try {
      const channel = await rabbitmqConfig.getChannel();
      
      // Start consuming from each queue
      for (const queueName of Object.keys(QUEUE_CONFIGS)) {
        await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
          if (msg) {
            try {
              const job = JSON.parse(msg.content.toString()) as Job;
              await this.processJob(job);
              channel.ack(msg);
            } catch (error) {
              logger.error('❌ Error processing job message:', error);
              channel.nack(msg, false, false);
            }
          }
        }, { noAck: false });
      }
      
      logger.info('✅ Job processing started');
      
    } catch (error) {
      logger.error('❌ Failed to start job processing:', error);
      throw error;
    }
  }

  private async publishJob(job: Job): Promise<void> {
    try {
      const channel = await rabbitmqConfig.getChannel();
      const queueName = this.getQueueName(job.priority);
      
      await channel.publish(
        this.getExchangeName(job.type),
        queueName,
        Buffer.from(JSON.stringify(job)),
        {
          messageId: job.id,
          correlationId: job.correlationId,
          priority: this.getPriorityNumber(job.priority),
          timestamp: Date.now()
        }
      );
      
    } catch (error) {
      logger.error('❌ Failed to publish job:', error);
      throw error;
    }
  }

  private getQueueName(priority: JobPriority): string {
    switch (priority) {
      case 'critical':
        return 'upload.high-priority';
      case 'high':
        return 'upload.normal';
      case 'normal':
        return 'upload.batch';
      case 'low':
        return 'upload.batch';
      default:
        return 'upload.normal';
    }
  }

  private getExchangeName(jobType: JobType): string {
    if (jobType.includes('UPLOAD')) {
      return 'upload.jobs';
    } else if (jobType.includes('RESIZE') || jobType.includes('THUMBNAIL') || jobType.includes('METADATA') || jobType.includes('VIRUS')) {
      return 'processing.jobs';
    } else if (jobType.includes('NOTIFICATION')) {
      return 'notifications.jobs';
    }
    return 'upload.jobs';
  }

  private getPriorityNumber(priority: JobPriority): number {
    switch (priority) {
      case 'critical': return 10;
      case 'high': return 7;
      case 'normal': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

  private getMaxRetries(priority: JobPriority): number {
    switch (priority) {
      case 'critical': return 5;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private validateJob(job: Job): void {
    if (!job.id || !job.type || !job.userId) {
      throw new JobValidationError(job.id, job.type, ['Missing required fields']);
    }
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof JobError) {
      return error.retryable;
    }
    return true; // Default to retryable
  }

  private async retryJob(job: Job, error: any): Promise<void> {
    job.retryCount++;
    job.status = 'retrying';
    job.updatedAt = new Date();
    this.activeJobs.set(job.id, job);
    
    // Wait before retry (exponential backoff)
    const delay = Math.pow(2, job.retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Republish job
    await this.publishJob(job);
    
    this.updateMetrics('retrying', job);
    
    logger.info(`🔄 Job retrying: ${job.id} (${job.type})`, {
      jobId: job.id,
      type: job.type,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      delay
    });
  }

  private updateMetrics(action: string, job: Job, duration?: number): void {
    switch (action) {
      case 'created':
        this.jobMetrics.totalJobs++;
        this.jobMetrics.pendingJobs++;
        break;
      case 'completed':
        this.jobMetrics.pendingJobs--;
        this.jobMetrics.processingJobs--;
        this.jobMetrics.completedJobs++;
        if (duration) {
          this.jobMetrics.averageProcessingTime = 
            (this.jobMetrics.averageProcessingTime + duration) / 2;
        }
        break;
      case 'failed':
        this.jobMetrics.pendingJobs--;
        this.jobMetrics.processingJobs--;
        this.jobMetrics.failedJobs++;
        break;
      case 'retrying':
        this.jobMetrics.retryingJobs++;
        break;
    }
    
    // Calculate rates
    this.jobMetrics.successRate = 
      this.jobMetrics.completedJobs / this.jobMetrics.totalJobs * 100;
    this.jobMetrics.errorRate = 
      this.jobMetrics.failedJobs / this.jobMetrics.totalJobs * 100;
  }

  private async waitForActiveJobs(): Promise<void> {
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // ============================================================================
  // JOB PROCESSING METHODS
  // ============================================================================

  private async processImageUpload(job: UploadJob): Promise<UploadResult> {
    // Implementation for image upload processing
    throw new Error('Not implemented yet');
  }

  private async processImageUploadProcessing(job: UploadJob): Promise<UploadResult> {
    // Implementation for image upload processing
    throw new Error('Not implemented yet');
  }

  private async processImageResize(job: ProcessingJob): Promise<ProcessingResult> {
    // Implementation for image resize processing
    throw new Error('Not implemented yet');
  }

  private async processThumbnailGenerate(job: ProcessingJob): Promise<ProcessingResult> {
    // Implementation for thumbnail generation
    throw new Error('Not implemented yet');
  }

  private async processMetadataExtract(job: ProcessingJob): Promise<any> {
    // Implementation for metadata extraction
    throw new Error('Not implemented yet');
  }

  private async processVirusScan(job: ProcessingJob): Promise<any> {
    // Implementation for virus scanning
    throw new Error('Not implemented yet');
  }

  private async processDatabaseUpdate(job: DatabaseJob): Promise<any> {
    // Implementation for database updates
    throw new Error('Not implemented yet');
  }

  private async processNotification(job: NotificationJob): Promise<any> {
    // Implementation for notifications
    throw new Error('Not implemented yet');
  }

  private async processCleanup(job: CleanupJob): Promise<any> {
    // Implementation for cleanup
    throw new Error('Not implemented yet');
  }
}

export const jobProcessorService = new JobProcessorService();
