import { DatabaseTriggerBridgeRefactored } from '../services/DatabaseTriggerBridgeRefactored';
import { IDatabaseService, IRabbitMQService, ILogger } from '../interfaces/IDatabaseService';

// Mock implementations
const mockDatabaseService: jest.Mocked<IDatabaseService> = {
  healthCheck: jest.fn(),
  getPendingJobs: jest.fn(),
  updateJobStatus: jest.fn(),
  markJobAsProcessing: jest.fn(),
  markJobAsCompleted: jest.fn(),
  markJobAsFailed: jest.fn()
};

const mockRabbitMQService: jest.Mocked<IRabbitMQService> = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  publishMessage: jest.fn(),
  isConnected: jest.fn()
};

const mockLogger: jest.Mocked<ILogger> = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('DatabaseTriggerBridgeRefactored', () => {
  let bridge: DatabaseTriggerBridgeRefactored;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockRabbitMQService.isConnected.mockReturnValue(true);
    mockDatabaseService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 100 
    });
    
    // Create new instance
    bridge = new DatabaseTriggerBridgeRefactored(
      mockDatabaseService,
      mockRabbitMQService,
      mockLogger
    );
  });

  afterEach(async () => {
    // Clean up
    await bridge.stopProcessing();
  });

  describe('startProcessing', () => {
    it('should start processing successfully', async () => {
      // Act
      await bridge.startProcessing(1000);

      // Assert
      expect(mockRabbitMQService.connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Starting database trigger bridge...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Database trigger bridge started');
    });

    it('should not start if already processing', async () => {
      // Arrange
      await bridge.startProcessing(1000);

      // Act
      await bridge.startProcessing(1000);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('⚠️ Database trigger bridge already running');
      expect(mockRabbitMQService.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle RabbitMQ connection failure gracefully', async () => {
      // Arrange
      mockRabbitMQService.connect.mockRejectedValue(new Error('Connection failed'));

      // Act
      await bridge.startProcessing(1000);

      // Assert
      expect(mockRabbitMQService.connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to connect to RabbitMQ:', 
        expect.any(Error)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Database trigger bridge started');
    });
  });

  describe('stopProcessing', () => {
    it('should stop processing successfully', async () => {
      // Arrange
      await bridge.startProcessing(1000);

      // Act
      await bridge.stopProcessing();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('🛑 Stopping database trigger bridge...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Database trigger bridge stopped');
    });

    it('should handle stop when not processing', async () => {
      // Act
      await bridge.stopProcessing();

      // Assert
      expect(mockLogger.info).not.toHaveBeenCalledWith('🛑 Stopping database trigger bridge...');
    });
  });

  describe('processPendingJobs', () => {
    it('should process pending jobs successfully', async () => {
      // Arrange
      const mockJobs = [
        { id: 1, record_id: 'record1', operation: 'create' },
        { id: 2, record_id: 'record2', operation: 'update' }
      ];
      
      mockDatabaseService.getPendingJobs.mockResolvedValue(mockJobs);
      await bridge.startProcessing(100);

      // Wait for processing - longer timeout for interval
      await new Promise(resolve => setTimeout(resolve, 200));

      // Assert
      expect(mockDatabaseService.getPendingJobs).toHaveBeenCalledWith(10);
      expect(mockDatabaseService.markJobAsProcessing).toHaveBeenCalledTimes(2);
      expect(mockRabbitMQService.publishMessage).toHaveBeenCalledTimes(2);
      expect(mockDatabaseService.markJobAsCompleted).toHaveBeenCalledTimes(2);
    });

    it('should handle no pending jobs', async () => {
      // Arrange
      mockDatabaseService.getPendingJobs.mockResolvedValue([]);
      await bridge.startProcessing(100);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Assert
      expect(mockDatabaseService.getPendingJobs).toHaveBeenCalledWith(10);
      expect(mockDatabaseService.markJobAsProcessing).not.toHaveBeenCalled();
      expect(mockRabbitMQService.publishMessage).not.toHaveBeenCalled();
    });

    it('should handle job processing failure', async () => {
      // Arrange
      const mockJobs = [{ id: 1, record_id: 'record1', operation: 'create' }];
      mockDatabaseService.getPendingJobs.mockResolvedValue(mockJobs);
      mockRabbitMQService.publishMessage.mockRejectedValue(new Error('Publish failed'));
      
      await bridge.startProcessing(100);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Assert
      expect(mockDatabaseService.markJobAsProcessing).toHaveBeenCalledWith(1, expect.any(String));
      expect(mockDatabaseService.markJobAsFailed).toHaveBeenCalledWith(
        1, 
        expect.any(String), 
        'Publish failed'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are healthy', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockResolvedValue({ 
        status: 'healthy', 
        responseTime: 100 
      });
      mockRabbitMQService.isConnected.mockReturnValue(true);
      await bridge.startProcessing(1000);

      // Act
      const health = await bridge.healthCheck();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.database.status).toBe('healthy');
      expect(health.rabbitmq.connected).toBe(true);
      expect(health.bridge.isProcessing).toBe(true);
    });

    it('should return degraded status when database is unhealthy', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockResolvedValue({ 
        status: 'unhealthy', 
        responseTime: 0 
      });
      mockRabbitMQService.isConnected.mockReturnValue(true);

      // Act
      const health = await bridge.healthCheck();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.database.status).toBe('unhealthy');
    });

    it('should return degraded status when RabbitMQ is disconnected', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockResolvedValue({ 
        status: 'healthy', 
        responseTime: 100 
      });
      mockRabbitMQService.isConnected.mockReturnValue(false);

      // Act
      const health = await bridge.healthCheck();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.rabbitmq.connected).toBe(false);
    });

    it('should handle health check failure', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      // Act
      const health = await bridge.healthCheck();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(health.database.status).toBe('unhealthy');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Health check failed:', 
        expect.any(Error)
      );
    });
  });

  describe('getStatus', () => {
    it('should return current status', async () => {
      // Arrange
      await bridge.startProcessing(1000);

      // Act
      const status = bridge.getStatus();

      // Assert
      expect(status.isProcessing).toBe(true);
      expect(status.processedJobsCount).toBe(0);
      expect(status.errorCount).toBe(0);
    });
  });
});
