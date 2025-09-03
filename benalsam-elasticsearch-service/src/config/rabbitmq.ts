import * as amqp from 'amqplib';
import logger from './logger';

class RabbitMQConfig {
  private static instance: RabbitMQConfig;
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): RabbitMQConfig {
    if (!RabbitMQConfig.instance) {
      RabbitMQConfig.instance = new RabbitMQConfig();
    }
    return RabbitMQConfig.instance;
  }

  public async getConnection(): Promise<amqp.Connection> {
    if (!this.connection) {
      await this.connect();
    }
    return this.connection!;
  }

  public async getChannel(): Promise<amqp.Channel> {
    if (!this.channel) {
      const connection = await this.getConnection();
      this.channel = await connection.createChannel();
      
      // Channel error handling
      this.channel.on('error', (err) => {
        logger.error('❌ RabbitMQ channel error:', err);
        this.channel = null;
      });

      this.channel.on('close', () => {
        logger.warn('⚠️ RabbitMQ channel closed');
        this.channel = null;
      });
    }
    return this.channel;
  }

  private async connect(): Promise<void> {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://benalsam:benalsam123@localhost:5672';
      this.connection = await amqp.connect(url);
      
      logger.info('✅ Connected to RabbitMQ');

      // Connection error handling
      this.connection.on('error', (err) => {
        logger.error('❌ RabbitMQ connection error:', err);
        this.reconnect();
      });

      this.connection.on('close', () => {
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
      const queue = process.env.RABBITMQ_QUEUE || 'elasticsearch.sync';
      const exchange = process.env.RABBITMQ_EXCHANGE || 'benalsam.listings';
      const dlx = process.env.RABBITMQ_DLX || 'benalsam.listings.dlx';

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
      await channel.bindQueue(queue, exchange, 'listing.#');

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
}

export const rabbitmqConfig = RabbitMQConfig.getInstance();
export default rabbitmqConfig;
