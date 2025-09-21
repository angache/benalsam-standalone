import * as amqp from 'amqplib';
import logger from '../config/logger';

class RabbitMQService {
  private connection: any = null; // amqp.Connection
  private channel: any = null; // amqp.Channel
  private readonly url: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5 seconds

  constructor() {
    this.url = process.env['RABBITMQ_URL'] || 'amqp://benalsam:benalsam123@localhost:5672';
    this.connect().catch((err: any) => {
      logger.error('Failed to connect to RabbitMQ on startup:', err);
    });
  }

  async connect(): Promise<void> {
    try {
      if (this.connection) {
        return;
      }

      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Exchange'leri oluştur
      await this.setupExchanges();

      logger.info('🐰 Connected to RabbitMQ');

      // Handle connection events
      this.connection.on('error', (err: any) => {
        logger.error('RabbitMQ connection error:', err);
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleDisconnect();
      });

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    this.connection = null;
    this.channel = null;

    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(async () => {
        this.reconnectTimeout = null;
        logger.info('Attempting to reconnect to RabbitMQ...');
        await this.connect();
      }, this.reconnectInterval);
    }
  }

  /**
   * Exchange'leri oluştur
   */
  private async setupExchanges(): Promise<void> {
    try {
      // benalsam.listings exchange'ini oluştur
      await this.channel.assertExchange('benalsam.listings', 'topic', {
        durable: true,
        autoDelete: false
      });

      logger.info('✅ Exchange created: benalsam.listings');
    } catch (error) {
      logger.error('❌ Failed to create exchanges:', error);
      throw error;
    }
  }

  async publishToExchange(
    exchange: string,
    routingKey: string,
    message: any,
    options: amqp.Options.Publish = {}
  ): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        throw new Error('No RabbitMQ channel available');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const defaultOptions: amqp.Options.Publish = {
        persistent: true,
        ...options
      };

      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        defaultOptions
      );

      if (published) {
        logger.info('✉️ Message published to RabbitMQ', {
          exchange,
          routingKey,
          messageId: options.messageId
        });
      } else {
        logger.warn('⚠️ Message could not be published to RabbitMQ', {
          exchange,
          routingKey,
          messageId: options.messageId
        });
      }

      return published;
    } catch (error) {
      logger.error('Error publishing message to RabbitMQ:', error);
      this.handleDisconnect();
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Closed RabbitMQ connection');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}

// Singleton instance
export const rabbitmqService = new RabbitMQService();
