import { 
  IUploadService, 
  ICloudinaryService, 
  IQuotaService, 
  IJobProcessorService, 
  IRabbitMQService, 
  ILogger,
  UploadRequest,
  UploadResult,
  JobType,
  JobStatus,
  JobPriority
} from '../interfaces/IUploadService';

/**
 * Refactored Upload Service
 * Dependency Injection ile test edilebilir
 */
export class UploadServiceRefactored implements IUploadService {
  constructor(
    private cloudinaryService: ICloudinaryService,
    private quotaService: IQuotaService,
    private jobProcessorService: IJobProcessorService,
    private rabbitmqService: IRabbitMQService,
    private logger: ILogger
  ) {}

  async uploadFiles(request: UploadRequest): Promise<UploadResult> {
    try {
      this.logger.info('Starting file upload', { 
        userId: request.userId, 
        fileCount: request.files.length 
      });

      // Validate files
      this.validateFiles(request.files);

      // Check quota
      const totalSize = request.files.reduce((sum, file) => sum + file.size, 0);
      const quotaCheck = await this.quotaService.checkQuota(request.userId, totalSize);
      
      if (!quotaCheck.allowed) {
        return {
          success: false,
          error: 'Quota exceeded',
          quotaInfo: quotaCheck.quota
        };
      }

      // Create upload job
      const job = await this.jobProcessorService.createJob({
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.PENDING,
        priority: JobPriority.NORMAL,
        data: {
          userId: request.userId,
          listingId: request.listingId,
          inventoryId: request.inventoryId,
          files: request.files.map(file => ({
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          })),
          metadata: request.metadata
        }
      });

      // Process files
      const uploadedFiles = await this.processFiles(request);

      // Update quota
      await this.quotaService.updateQuota(request.userId, totalSize);

      // Update job status
      await this.jobProcessorService.processJob(job.id);

      this.logger.info('File upload completed successfully', { 
        userId: request.userId, 
        uploadedCount: uploadedFiles.length 
      });

      return {
        success: true,
        data: {
          uploadedFiles,
          totalSize,
          totalFiles: uploadedFiles.length
        },
        quotaInfo: quotaCheck.quota
      };

    } catch (error) {
      this.logger.error('File upload failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      this.logger.info('Getting job status', { jobId });
      
      const job = await this.jobProcessorService.getJob(jobId);
      
      if (!job) {
        return null;
      }

      return {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: job.result,
        error: job.error
      };
    } catch (error) {
      this.logger.error('Get job status failed:', error);
      throw error;
    }
  }

  async getJobMetrics(): Promise<any> {
    try {
      this.logger.info('Getting job metrics');
      
      const metrics = await this.jobProcessorService.getJobMetrics();
      
      return {
        jobs: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Get job metrics failed:', error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      this.logger.info('Cancelling job', { jobId });
      
      const job = await this.jobProcessorService.getJob(jobId);
      
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
        throw new Error(`Cannot cancel job in ${job.status} status`);
      }

      // Update job status to cancelled
      await this.jobProcessorService.createJob({
        id: jobId,
        status: JobStatus.CANCELLED,
        data: job.data
      });

      this.logger.info('Job cancelled successfully', { jobId });
    } catch (error) {
      this.logger.error('Cancel job failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: string;
    cloudinary: { status: string; responseTime: number };
    quota: { status: string; responseTime: number };
    jobProcessor: { status: string; responseTime: number };
    rabbitmq: { status: string; responseTime: number };
  }> {
    try {
      const [cloudinaryHealth, quotaHealth, jobProcessorHealth, rabbitmqHealth] = await Promise.all([
        this.cloudinaryService.healthCheck(),
        this.quotaService.healthCheck(),
        this.jobProcessorService.healthCheck(),
        this.rabbitmqService.healthCheck()
      ]);

      const overallStatus = 
        cloudinaryHealth.status === 'healthy' && 
        quotaHealth.status === 'healthy' && 
        jobProcessorHealth.status === 'healthy' &&
        rabbitmqHealth.status === 'healthy'
          ? 'healthy'
          : 'degraded';

      return {
        status: overallStatus,
        cloudinary: cloudinaryHealth,
        quota: quotaHealth,
        jobProcessor: jobProcessorHealth,
        rabbitmq: rabbitmqHealth
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        cloudinary: { status: 'unhealthy', responseTime: 0 },
        quota: { status: 'unhealthy', responseTime: 0 },
        jobProcessor: { status: 'unhealthy', responseTime: 0 },
        rabbitmq: { status: 'unhealthy', responseTime: 0 }
      };
    }
  }

  private validateFiles(files: Express.Multer.File[]): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (files.length === 0) {
      throw new Error('No files provided');
    }

    if (files.length > maxFiles) {
      throw new Error(`Too many files. Maximum allowed: ${maxFiles}`);
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      if (file.size > maxFileSize) {
        throw new Error(`File too large: ${file.originalname}. Maximum size: ${maxFileSize} bytes`);
      }
    }
  }

  private async processFiles(request: UploadRequest): Promise<any[]> {
    const uploadedFiles = [];

    for (const file of request.files) {
      try {
        // Determine folder based on request type
        let folder = 'uploads';
        if (request.listingId) {
          folder = `listings/${request.userId}/${request.listingId}`;
        } else if (request.inventoryId) {
          folder = `inventory/${request.userId}/${request.inventoryId}`;
        } else {
          folder = `single/${request.userId}`;
        }

        // Upload to Cloudinary
        const uploadedFile = await this.cloudinaryService.uploadImage(file, folder);
        uploadedFiles.push(uploadedFile);

        this.logger.info('File uploaded successfully', { 
          originalName: file.originalname,
          publicId: uploadedFile.publicId,
          url: uploadedFile.url
        });

      } catch (error) {
        this.logger.error('File upload failed:', { 
          originalName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }

    return uploadedFiles;
  }
}
