import { UploadServiceRefactored } from '../services/UploadServiceRefactored';
import { 
  ICloudinaryService, 
  IQuotaService, 
  IJobProcessorService, 
  IRabbitMQService, 
  ILogger,
  UploadRequest,
  UploadedFile,
  Job,
  JobType,
  JobStatus,
  JobPriority,
  JobMetrics
} from '../interfaces/IUploadService';

// Mock implementations
const mockCloudinaryService: jest.Mocked<ICloudinaryService> = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  getImageInfo: jest.fn(),
  healthCheck: jest.fn()
};

const mockQuotaService: jest.Mocked<IQuotaService> = {
  checkQuota: jest.fn(),
  updateQuota: jest.fn(),
  getQuota: jest.fn(),
  healthCheck: jest.fn()
};

const mockJobProcessorService: jest.Mocked<IJobProcessorService> = {
  createJob: jest.fn(),
  processJob: jest.fn(),
  getJob: jest.fn(),
  getJobMetrics: jest.fn(),
  healthCheck: jest.fn()
};

const mockRabbitMQService: jest.Mocked<IRabbitMQService> = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  publishMessage: jest.fn(),
  consumeMessages: jest.fn(),
  isConnected: jest.fn(),
  healthCheck: jest.fn()
};

const mockLogger: jest.Mocked<ILogger> = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('UploadServiceRefactored', () => {
  let uploadService: UploadServiceRefactored;
  let mockFile: Express.Multer.File;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockCloudinaryService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 100 
    });
    mockQuotaService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 50 
    });
    mockJobProcessorService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 75 
    });
    mockRabbitMQService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 25 
    });
    
    // Create mock file
    mockFile = {
      fieldname: 'images',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024000, // 1MB
      buffer: Buffer.from('fake-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any
    };
    
    // Create new instance
    uploadService = new UploadServiceRefactored(
      mockCloudinaryService,
      mockQuotaService,
      mockJobProcessorService,
      mockRabbitMQService,
      mockLogger
    );
  });

  describe('uploadFiles', () => {
    it('should upload files successfully', async () => {
      // Arrange
      const request: UploadRequest = {
        files: [mockFile],
        userId: 'user-123',
        listingId: 'listing-456'
      };

      const mockUploadedFile: UploadedFile = {
        id: 'cloudinary-id',
        originalName: 'test-image.jpg',
        filename: 'test-image.jpg',
        url: 'https://cloudinary.com/test-image.jpg',
        size: 1024000,
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
        format: 'jpg',
        publicId: 'cloudinary-id',
        folder: 'listings/user-123/listing-456',
        uploadedAt: new Date().toISOString()
      };

      const mockJob: Job = {
        id: 'job-123',
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.PENDING,
        priority: JobPriority.NORMAL,
        data: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockQuotaService.checkQuota.mockResolvedValue({
        allowed: true,
        quota: {
          usedStorage: 0,
          storageLimit: 100000000,
          usedFiles: 0,
          fileLimit: 50,
          remainingStorage: 100000000,
          remainingFiles: 50
        }
      });

      mockJobProcessorService.createJob.mockResolvedValue(mockJob);
      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadedFile);
      mockJobProcessorService.processJob.mockResolvedValue();

      // Act
      const result = await uploadService.uploadFiles(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.uploadedFiles).toHaveLength(1);
      expect(result.data?.totalSize).toBe(1024000);
      expect(result.data?.totalFiles).toBe(1);
      expect(mockQuotaService.checkQuota).toHaveBeenCalledWith('user-123', 1024000);
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockFile, 
        'listings/user-123/listing-456'
      );
      expect(mockQuotaService.updateQuota).toHaveBeenCalledWith('user-123', 1024000);
    });

    it('should reject upload when quota exceeded', async () => {
      // Arrange
      const request: UploadRequest = {
        files: [mockFile],
        userId: 'user-123'
      };

      mockQuotaService.checkQuota.mockResolvedValue({
        allowed: false,
        quota: {
          usedStorage: 95000000,
          storageLimit: 100000000,
          usedFiles: 45,
          fileLimit: 50,
          remainingStorage: 5000000,
          remainingFiles: 5
        }
      });

      // Act
      const result = await uploadService.uploadFiles(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Quota exceeded');
      expect(result.quotaInfo).toBeDefined();
      expect(mockCloudinaryService.uploadImage).not.toHaveBeenCalled();
    });

    it('should validate file types', async () => {
      // Arrange
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };
      const request: UploadRequest = {
        files: [invalidFile],
        userId: 'user-123'
      };

      // Act
      const result = await uploadService.uploadFiles(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should validate file size', async () => {
      // Arrange
      const largeFile = { ...mockFile, size: 20 * 1024 * 1024 }; // 20MB
      const request: UploadRequest = {
        files: [largeFile],
        userId: 'user-123'
      };

      // Act
      const result = await uploadService.uploadFiles(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should validate number of files', async () => {
      // Arrange
      const files = Array(15).fill(null).map(() => ({ ...mockFile }));
      const request: UploadRequest = {
        files,
        userId: 'user-123'
      };

      // Act
      const result = await uploadService.uploadFiles(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many files');
    });

    it('should handle upload errors', async () => {
      // Arrange
      const request: UploadRequest = {
        files: [mockFile],
        userId: 'user-123'
      };

      mockQuotaService.checkQuota.mockResolvedValue({
        allowed: true,
        quota: { usedStorage: 0, storageLimit: 100000000, usedFiles: 0, fileLimit: 50, remainingStorage: 100000000, remainingFiles: 50 }
      });

      mockJobProcessorService.createJob.mockResolvedValue({
        id: 'job-123',
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.PENDING,
        priority: JobPriority.NORMAL,
        data: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      mockCloudinaryService.uploadImage.mockRejectedValue(new Error('Cloudinary upload failed'));

      // Act
      const result = await uploadService.uploadFiles(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cloudinary upload failed');
    });
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      // Arrange
      const mockJob: Job = {
        id: 'job-123',
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.PROCESSING,
        priority: JobPriority.NORMAL,
        data: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: new Date().toISOString()
      };

      mockJobProcessorService.getJob.mockResolvedValue(mockJob);

      // Act
      const result = await uploadService.getJobStatus('job-123');

      // Assert
      expect(result).toEqual({
        id: 'job-123',
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.PROCESSING,
        progress: undefined,
        createdAt: mockJob.createdAt,
        updatedAt: mockJob.updatedAt,
        startedAt: mockJob.startedAt,
        completedAt: undefined,
        result: undefined,
        error: undefined
      });
    });

    it('should return null when job does not exist', async () => {
      // Arrange
      mockJobProcessorService.getJob.mockResolvedValue(null);

      // Act
      const result = await uploadService.getJobStatus('non-existent-job');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getJobMetrics', () => {
    it('should return job metrics', async () => {
      // Arrange
      const mockMetrics: JobMetrics = {
        totalJobs: 100,
        pendingJobs: 10,
        processingJobs: 5,
        completedJobs: 80,
        failedJobs: 5,
        retryingJobs: 0,
        averageProcessingTime: 1500,
        successRate: 80,
        errorRate: 5
      };

      mockJobProcessorService.getJobMetrics.mockResolvedValue(mockMetrics);

      // Act
      const result = await uploadService.getJobMetrics();

      // Assert
      expect(result.jobs).toEqual(mockMetrics);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('cancelJob', () => {
    it('should cancel job successfully', async () => {
      // Arrange
      const mockJob: Job = {
        id: 'job-123',
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.PENDING,
        priority: JobPriority.NORMAL,
        data: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockJobProcessorService.getJob.mockResolvedValue(mockJob);
      mockJobProcessorService.createJob.mockResolvedValue({
        ...mockJob,
        status: JobStatus.CANCELLED
      });

      // Act
      await uploadService.cancelJob('job-123');

      // Assert
      expect(mockJobProcessorService.getJob).toHaveBeenCalledWith('job-123');
      expect(mockJobProcessorService.createJob).toHaveBeenCalledWith({
        id: 'job-123',
        status: JobStatus.CANCELLED,
        data: mockJob.data
      });
    });

    it('should throw error when job not found', async () => {
      // Arrange
      mockJobProcessorService.getJob.mockResolvedValue(null);

      // Act & Assert
      await expect(uploadService.cancelJob('non-existent-job')).rejects.toThrow('Job non-existent-job not found');
    });

    it('should throw error when trying to cancel completed job', async () => {
      // Arrange
      const mockJob: Job = {
        id: 'job-123',
        type: JobType.IMAGE_UPLOAD_REQUESTED,
        status: JobStatus.COMPLETED,
        priority: JobPriority.NORMAL,
        data: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockJobProcessorService.getJob.mockResolvedValue(mockJob);

      // Act & Assert
      await expect(uploadService.cancelJob('job-123')).rejects.toThrow('Cannot cancel job in completed status');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are healthy', async () => {
      // Act
      const health = await uploadService.healthCheck();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.cloudinary.status).toBe('healthy');
      expect(health.quota.status).toBe('healthy');
      expect(health.jobProcessor.status).toBe('healthy');
      expect(health.rabbitmq.status).toBe('healthy');
    });

    it('should return degraded status when one service is unhealthy', async () => {
      // Arrange
      mockCloudinaryService.healthCheck.mockResolvedValue({ 
        status: 'unhealthy', 
        responseTime: 0 
      });

      // Act
      const health = await uploadService.healthCheck();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.cloudinary.status).toBe('unhealthy');
    });

    it('should handle health check failure', async () => {
      // Arrange
      mockCloudinaryService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      // Act
      const health = await uploadService.healthCheck();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Health check failed:', 
        expect.any(Error)
      );
    });
  });
});
