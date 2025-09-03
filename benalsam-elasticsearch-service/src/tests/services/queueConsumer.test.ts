import { queueConsumer } from '../../services/queueConsumer';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { supabaseConfig } from '../../config/supabase';
import { elasticsearchConfig } from '../../config/elasticsearch';
import { mockQueueMessage, mockJob } from '../mocks';
import { Channel, ConsumeMessage } from 'amqplib';

// Mock dependencies
jest.mock('../../config/rabbitmq');
jest.mock('../../config/supabase');
jest.mock('../../config/elasticsearch');

describe('QueueConsumer', () => {
  let mockChannel: jest.Mocked<Channel>;
  let mockConsumeMessage: jest.Mocked<ConsumeMessage>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Channel
    mockChannel = {
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      reject: jest.fn(),
      prefetch: jest.fn(),
      close: jest.fn()
    } as unknown as jest.Mocked<Channel>;

    // Mock ConsumeMessage
    mockConsumeMessage = {
      content: Buffer.from(JSON.stringify(mockQueueMessage)),
      fields: {},
      properties: {}
    } as unknown as jest.Mocked<ConsumeMessage>;

    // Mock rabbitmqConfig
    (rabbitmqConfig.getChannel as jest.Mock).mockResolvedValue(mockChannel);
    (rabbitmqConfig.setupQueue as jest.Mock).mockResolvedValue(undefined);

    // Mock supabaseConfig
    (supabaseConfig.getClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockJob })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })
    });

    // Mock elasticsearchConfig
    (elasticsearchConfig.getClient as jest.Mock).mockResolvedValue({
      index: jest.fn().mockResolvedValue({ result: 'created' }),
      update: jest.fn().mockResolvedValue({ result: 'updated' }),
      delete: jest.fn().mockResolvedValue({ result: 'deleted' })
    });
  });

  describe('start', () => {
    it('should start consuming messages successfully', async () => {
      await queueConsumer.start();

      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
      expect(mockChannel.consume).toHaveBeenCalled();
      expect(rabbitmqConfig.setupQueue).toHaveBeenCalled();
    });

    it('should handle startup errors', async () => {
      const error = new Error('Failed to start');
      (rabbitmqConfig.getChannel as jest.Mock).mockRejectedValueOnce(error);

      await expect(queueConsumer.start()).rejects.toThrow('Failed to start');
    });
  });

  describe('handleMessage', () => {
    it('should process valid message successfully', async () => {
      await queueConsumer.start();
      
      // Trigger message handling
      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(mockConsumeMessage);

      // Verify job status updates
      expect(supabaseConfig.getClient().from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed'
        })
      );

      // Verify message acknowledgment
      expect(mockChannel.ack).toHaveBeenCalledWith(mockConsumeMessage);
    });

    it('should handle invalid message format', async () => {
      const invalidMessage = {
        ...mockConsumeMessage,
        content: Buffer.from('invalid json')
      };

      await queueConsumer.start();
      
      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(invalidMessage);

      expect(mockChannel.reject).toHaveBeenCalledWith(invalidMessage, false);
    });

    it('should retry on temporary failures', async () => {
      // Mock temporary failure
      (elasticsearchConfig.getClient as jest.Mock).mockRejectedValueOnce(new Error('Temporary error'));

      await queueConsumer.start();
      
      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(mockConsumeMessage);

      // Verify retry attempt
      expect(supabaseConfig.getClient().from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          retry_count: 1
        })
      );

      expect(mockChannel.nack).toHaveBeenCalledWith(mockConsumeMessage, false, true);
    });

    it('should handle max retries exceeded', async () => {
      // Mock job with max retries
      const maxRetriesJob = { ...mockJob, retry_count: 3 };
      (supabaseConfig.getClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: maxRetriesJob })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      // Mock failure
      (elasticsearchConfig.getClient as jest.Mock).mockRejectedValueOnce(new Error('Persistent error'));

      await queueConsumer.start();
      
      const consumeCallback = (mockChannel.consume as jest.Mock).mock.calls[0][1];
      await consumeCallback(mockConsumeMessage);

      // Verify failed status
      expect(supabaseConfig.getClient().from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed'
        })
      );

      expect(mockChannel.nack).toHaveBeenCalledWith(mockConsumeMessage, false, false);
    });
  });

  describe('stop', () => {
    it('should stop consuming messages gracefully', async () => {
      await queueConsumer.start();
      await queueConsumer.stop();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(queueConsumer.isRunning()).toBe(false);
    });
  });
});
