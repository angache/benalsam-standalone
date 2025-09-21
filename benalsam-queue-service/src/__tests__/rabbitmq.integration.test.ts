import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { RabbitMQService } from '../services/rabbitmqService';
import { metricsService } from '../services/MetricsService';
import logger from '../config/logger';

/**
 * RabbitMQ Integration Tests with Testcontainers
 * Tests real RabbitMQ functionality with ephemeral containers
 */
describe('RabbitMQ Integration Tests', () => {
  let rabbitmqContainer: StartedTestContainer;
  let rabbitmqService: RabbitMQService;
  let containerHost: string;
  let containerPort: number;

  // Test configuration
  const TEST_QUEUE = 'test.queue';
  const TEST_DLQ = 'test.dlq';
  const TEST_MESSAGE = { id: 'test-123', data: 'Hello RabbitMQ!' };

  beforeAll(async () => {
    // Start RabbitMQ container
    rabbitmqContainer = await new GenericContainer('rabbitmq:3.12-management')
      .withExposedPorts(5672, 15672)
      .withEnvironment({
        RABBITMQ_DEFAULT_USER: 'testuser',
        RABBITMQ_DEFAULT_PASS: 'testpass',
        RABBITMQ_DEFAULT_VHOST: '/'
      })
      .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
      .start();

    containerHost = rabbitmqContainer.getHost();
    containerPort = rabbitmqContainer.getMappedPort(5672);

    // Setup environment variables for test
    process.env['RABBITMQ_HOST'] = containerHost;
    process.env['RABBITMQ_PORT'] = containerPort.toString();
    process.env['RABBITMQ_USERNAME'] = 'testuser';
    process.env['RABBITMQ_PASSWORD'] = 'testpass';
    process.env['RABBITMQ_VHOST'] = '/';

    // Initialize RabbitMQ service
    rabbitmqService = new RabbitMQService();

    logger.info('🐰 RabbitMQ test container started', {
      host: containerHost,
      port: containerPort,
      managementPort: rabbitmqContainer.getMappedPort(15672)
    });
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    // Cleanup
    if (rabbitmqService) {
      await rabbitmqService.disconnect();
    }
    
    if (rabbitmqContainer) {
      await rabbitmqContainer.stop();
    }

    // Reset environment variables
    delete process.env['RABBITMQ_HOST'];
    delete process.env['RABBITMQ_PORT'];
    delete process.env['RABBITMQ_USERNAME'];
    delete process.env['RABBITMQ_PASSWORD'];
    delete process.env['RABBITMQ_VHOST'];

    logger.info('🧹 RabbitMQ test container stopped');
  }, 30000);

  beforeEach(async () => {
    // Connect to RabbitMQ before each test
    await rabbitmqService.connect();
  });

  afterEach(async () => {
    // Disconnect after each test
    await rabbitmqService.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to RabbitMQ successfully', async () => {
      expect(rabbitmqService.isConnected()).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
      // Test with invalid credentials
      const originalHost = process.env['RABBITMQ_HOST'];
      process.env['RABBITMQ_HOST'] = 'invalid-host';

      const invalidService = new RabbitMQService();
      
      try {
        await invalidService.connect();
        fail('Should have thrown connection error');
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        process.env['RABBITMQ_HOST'] = originalHost;
      }
    });

    it('should perform health check', async () => {
      const health = await rabbitmqService.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.responseTime).toBeLessThan(1000);
    });
  });

  describe('Message Publishing', () => {
    it('should publish message to queue successfully', async () => {
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);
      
      // Verify metrics were recorded
      const metrics = await metricsService.getMetrics();
      expect(metrics).toContain('benalsam_queue_messages_total');
    });

    it('should handle publishing errors', async () => {
      // Disconnect service to simulate error
      await rabbitmqService.disconnect();
      
      try {
        await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Message Consuming', () => {
    it('should consume messages with proper ACK', async () => {
      const consumedMessages: any[] = [];
      
      // Start consumer
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (message) => {
        consumedMessages.push(message);
      });

      // Publish test message
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(consumedMessages).toHaveLength(1);
      expect(consumedMessages[0]).toEqual(TEST_MESSAGE);
    });

    it('should handle message processing errors with NACK', async () => {
      const errorMessages: any[] = [];
      
      // Start consumer that throws error
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (message) => {
        errorMessages.push(message);
        throw new Error('Processing failed');
      });

      // Publish test message
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);

      // Wait for message processing and retry
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Message should be processed (and failed) multiple times due to retries
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should send messages to DLQ after max retries', async () => {
      const dlqMessages: any[] = [];
      
      // Start DLQ consumer
      await rabbitmqService.consumeMessages(TEST_DLQ, async (message) => {
        dlqMessages.push(message);
      });

      // Start main queue consumer that always fails
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (_message) => {
        throw new Error('Persistent processing failure');
      });

      // Publish test message
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);

      // Wait for retries and DLQ processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Message should eventually end up in DLQ
      expect(dlqMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Dead Letter Queue (DLQ)', () => {
    it('should create DLQ automatically', async () => {
      // DLQ should be created when we start consuming
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (_message) => {
        // Do nothing
      });

      // Verify DLQ exists by trying to consume from it
      let dlqExists = false;
      try {
        await rabbitmqService.consumeMessages(TEST_DLQ, async (_message) => {
          dlqExists = true;
        });
        dlqExists = true; // If no error, DLQ exists
      } catch (error) {
        dlqExists = false;
      }

      expect(dlqExists).toBe(true);
    });
  });

  describe('Metrics Integration', () => {
    it('should record message processing metrics', async () => {
      const initialMetrics = await metricsService.getMetrics();
      
      // Publish and consume message
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (_message) => {
        // Process message
      });
      
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalMetrics = await metricsService.getMetrics();
      
      // Metrics should have changed
      expect(finalMetrics).not.toEqual(initialMetrics);
    });

    it('should track connection status metrics', async () => {
      const healthMetrics = await metricsService.getHealthMetrics();
      
      expect(healthMetrics.connectionStatus).toBe(1); // Connected
      expect(healthMetrics.totalMessagesProcessed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle graceful shutdown', async () => {
      // Start consumer
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (_message) => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Publish message
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);

      // Start shutdown process
      const shutdownPromise = rabbitmqService.disconnect();
      
      // Shutdown should complete without hanging
      await expect(shutdownPromise).resolves.not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple messages efficiently', async () => {
      const messageCount = 10;
      const consumedMessages: any[] = [];
      
      // Start consumer
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (message) => {
        consumedMessages.push(message);
      });

      // Publish multiple messages
      const startTime = Date.now();
      
      for (let i = 0; i < messageCount; i++) {
        await rabbitmqService.publishMessage(TEST_QUEUE, {
          id: `test-${i}`,
          data: `Message ${i}`
        });
      }

      // Wait for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(consumedMessages).toHaveLength(messageCount);
      expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed messages', async () => {
      const errorMessages: any[] = [];
      
      // Start consumer
      await rabbitmqService.consumeMessages(TEST_QUEUE, async (message) => {
        try {
          // Try to access non-existent property
          // Try to access non-existent property to trigger error
          (message as any).nonExistentProperty.someMethod();
        } catch (error) {
          errorMessages.push({ message, error: (error as Error).message });
        }
      });

      // Publish valid message
      await rabbitmqService.publishMessage(TEST_QUEUE, TEST_MESSAGE);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should handle network interruptions', async () => {
      // This test would require more complex setup to simulate network issues
      // For now, we'll test reconnection logic
      expect(rabbitmqService.isConnected()).toBe(true);
      
      // Simulate disconnection
      await rabbitmqService.disconnect();
      expect(rabbitmqService.isConnected()).toBe(false);
      
      // Reconnect
      await rabbitmqService.connect();
      expect(rabbitmqService.isConnected()).toBe(true);
    });
  });
});
