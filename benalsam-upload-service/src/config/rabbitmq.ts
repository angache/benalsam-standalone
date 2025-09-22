import * as amqp from 'amqplib';
import { logger } from './logger';

class RabbitMQConfig {
  private static instance: RabbitMQConfig;
  private connection: any = null;
  private channel: any = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): RabbitMQConfig {
    if (!RabbitMQConfig.instance) {
      RabbitMQConfig.instance = new RabbitMQConfig();
    }
    return RabbitMQConfig.instance;
  }

  public async getConnection(): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }
    return this.connection!;
  }

  public async getChannel(): Promise<any> {
    if (!this.channel) {
      const connection = await this.getConnection();
      this.channel = await connection.createChannel();
      
      // Channel error handling
      this.channel!.on('error', (err: Error) => {
        logger.error('❌ RabbitMQ channel error:', err);
        this.channel = null;
      });

      this.channel!.on('close', () => {
        logger.warn('⚠️ RabbitMQ channel closed');
        this.channel = null;
      });
    }
    return this.channel!;
  }

  private async connect(): Promise<void> {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(url);
      
      logger.info('✅ Connected to RabbitMQ');

      // Connection error handling
      this.connection!.on('error', (err: Error) => {
        logger.error('❌ RabbitMQ connection error:', err);
        this.reconnect();
      });

      this.connection!.on('close', () => {
        logger.warn('⚠️ RabbitMQ connection closed');
        this.reconnect();
      });

      // Clear reconnect timeout if it exists
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', error);
      this.reconnect();
      throw error;
    }
  }

  private reconnect(): void {
    // Reset connection and channel
    this.connection = null;
    this.channel = null;

    // Schedule reconnection
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(async () => {
        logger.info('🔄 Attempting to reconnect to RabbitMQ...');
        try {
          await this.connect();
        } catch (error) {
          logger.error('❌ Reconnection failed:', error);
        }
      }, this.reconnectInterval);
    }
  }

  public async setupQueue(): Promise<void> {
    try {
      const channel = await this.getChannel();
      const queue = process.env.RABBITMQ_QUEUE || 'upload.events';
      const exchange = process.env.RABBITMQ_EXCHANGE || 'benalsam.jobs';
      const dlx = process.env.RABBITMQ_DLX || 'benalsam.uploads.dlx';

      // Dead Letter Exchange
      await channel.assertExchange(dlx, 'topic', { durable: true });
      await channel.assertQueue(`${queue}.dlq`, { durable: true });
      await channel.bindQueue(`${queue}.dlq`, dlx, '#');

      // Main Exchange and Queue
      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': dlx,
          'x-dead-letter-routing-key': 'dead.letter',
          'x-message-ttl': 1000 * 60 * 60 * 24, // 24 hours
          'x-max-retries': 3
        }
      });

      // Bind queue to exchange
      await channel.bindQueue(queue, exchange, 'upload.*');

      logger.info('✅ RabbitMQ queues and exchanges configured');
    } catch (error) {
      logger.error('❌ Failed to setup RabbitMQ queues:', error);
      throw error;
    }
  }

  public async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      logger.info('✅ RabbitMQ connection closed');
    } catch (error) {
      logger.error('❌ Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  public async checkConnection(): Promise<boolean> {
    try {
      await this.getChannel();
      return true;
    } catch (error) {
      logger.error('❌ RabbitMQ health check failed:', error);
      return false;
    }
  }

  public async publishEvent(routingKey: string, message: any): Promise<void> {
    try {
      const channel = await this.getChannel();
      const exchange = process.env.RABBITMQ_EXCHANGE || 'benalsam.jobs';
      
      await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      });

      logger.info(`📤 Event published: ${routingKey}`, { messageId: message.messageId });

    } catch (error) {
      logger.error('Failed to publish event:', error);
      throw error;
    }
  }
}

export const rabbitmqConfig = RabbitMQConfig.getInstance();

// Legacy exports for compatibility
export const connectRabbitMQ = async (): Promise<void> => {
  await rabbitmqConfig.setupQueue();
};

export const getChannel = (): any => {
  return rabbitmqConfig.getChannel();
};

export const publishEvent = async (routingKey: string, message: any): Promise<void> => {
  await rabbitmqConfig.publishEvent(routingKey, message);
};

export const disconnectRabbitMQ = async (): Promise<void> => {
  await rabbitmqConfig.closeConnection();
};