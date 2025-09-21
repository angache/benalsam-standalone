import * as amqp from 'amqplib';
import { IRabbitMQService } from '../interfaces/IDatabaseService';
import logger from '../config/logger';

/**
 * Real RabbitMQ Service Implementation
 * Production-ready message queuing with proper error handling
 */
export class RabbitMQService implements IRabbitMQService {
  private isConnectedFlag: boolean = false;
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private isShuttingDown: boolean = false;
  private inFlightMessages: Set<string> = new Set();

  async connect(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down');
    }

    try {
      logger.info('🔌 Connecting to RabbitMQ...', {
        host: process.env['RABBITMQ_HOST'] || 'localhost',
        port: process.env['RABBITMQ_PORT'] || '5672',
        username: process.env['RABBITMQ_USERNAME'] || 'guest'
      });

      // Create connection with proper configuration
      this.connection = await amqp.connect({
        hostname: process.env['RABBITMQ_HOST'] || 'localhost',
        port: parseInt(process.env['RABBITMQ_PORT'] || '5672'),
        username: process.env['RABBITMQ_USERNAME'] || 'guest',
        password: process.env['RABBITMQ_PASSWORD'] || 'guest',
        heartbeat: 60, // 60 seconds heartbeat
        vhost: process.env['RABBITMQ_VHOST'] || '/'
      }) as any;

      // Create channel
      this.channel = await (this.connection as any).createChannel();
      
      // Set channel prefetch to prevent overwhelming
      await (this.channel as any).prefetch(10);

      // Setup connection event handlers
      (this.connection as any).on('error', this.handleConnectionError.bind(this));
      (this.connection as any).on('close', this.handleConnectionClose.bind(this));
      
      this.isConnectedFlag = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      logger.info('✅ Real RabbitMQ connection established', {
        host: process.env['RABBITMQ_HOST'] || 'localhost',
        port: process.env['RABBITMQ_PORT'] || '5672'
      });

    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        attempt: this.reconnectAttempts + 1
      });
      
      this.isConnectedFlag = false;
      await this.handleReconnection();
    }
  }

  async disconnect(): Promise<void> {
    this.isShuttingDown = true;
    
    try {
      logger.info('🛑 Disconnecting from RabbitMQ...');
      
      // Wait for in-flight messages to complete (max 30 seconds)
      const shutdownTimeout = setTimeout(() => {
        logger.warn('⚠️ Shutdown timeout exceeded, forcing disconnect');
      }, 30000);

      // Wait for all in-flight messages
      while (this.inFlightMessages.size > 0) {
        logger.info(`⏳ Waiting for ${this.inFlightMessages.size} in-flight messages to complete...`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      clearTimeout(shutdownTimeout);

      // Close channel
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
        logger.info('✅ RabbitMQ channel closed');
      }
      
      // Close connection
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
        logger.info('✅ RabbitMQ connection closed');
      }
      
      this.isConnectedFlag = false;
      logger.info('✅ RabbitMQ disconnection completed');
      
    } catch (error) {
      logger.error('❌ Error closing RabbitMQ connection:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async publishMessage(queueName: string, message: any): Promise<void> {
    if (!this.isConnectedFlag || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      // Ensure queue exists
      await this.channel.assertQueue(queueName, { 
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': 'benalsam.dlq',
          'x-max-retries': 3
        }
      });

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true,
        messageId: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        headers: {
          retryCount: 0,
          originalQueue: queueName
        }
      });

      if (!published) {
        throw new Error('Failed to publish message - queue might be full');
      }

      logger.debug(`✅ Message published to queue ${queueName}`, {
        messageId: message.id,
        queue: queueName,
        size: messageBuffer.length
      });

    } catch (error) {
      logger.error(`❌ Failed to publish message to queue ${queueName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        queue: queueName,
        message: message
      });
      throw error;
    }
  }

  async publishToExchange(exchange: string, routingKey: string, message: any, options?: any): Promise<boolean> {
    if (!this.isConnectedFlag || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      // Ensure exchange exists
      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        messageId: options?.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...options
      });

      if (!published) {
        throw new Error('Failed to publish message to exchange - might be full');
      }

      logger.debug(`✅ Message published to exchange ${exchange}`, {
        routingKey,
        messageId: options?.messageId,
        exchange,
        size: messageBuffer.length
      });

      return true;

    } catch (error) {
      logger.error(`❌ Failed to publish message to exchange ${exchange}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        exchange,
        routingKey,
        message
      });
      return false;
    }
  }

  async consumeMessages(queueName: string, handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.isConnectedFlag || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      // Ensure queue exists with DLQ configuration
      await this.channel.assertQueue(queueName, { 
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': 'benalsam.dlq',
          'x-max-retries': 3
        }
      });

      // Ensure DLQ exists
      await this.channel.assertQueue('benalsam.dlq', { 
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000
        }
      });

      logger.info(`🎧 Starting consumer for queue ${queueName}`);

      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        const messageId = msg.properties.messageId || `msg_${Date.now()}`;
        this.inFlightMessages.add(messageId);

        try {
          const messageContent = JSON.parse(msg.content.toString());
          
          logger.debug(`📥 Processing message from queue ${queueName}`, {
            messageId,
            queue: queueName,
            size: msg.content.length
          });

          // Process message
          await handler(messageContent);

          // Acknowledge successful processing
          this.channel!.ack(msg);
          this.inFlightMessages.delete(messageId);

          logger.debug(`✅ Message processed successfully`, {
            messageId,
            queue: queueName
          });

        } catch (error) {
          logger.error(`❌ Error processing message from queue ${queueName}:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            messageId,
            queue: queueName,
            retryCount: msg.properties.headers?.['retryCount'] || 0
          });

          // Check retry count
          const retryCount = msg.properties.headers?.['retryCount'] || 0;
          
          if (retryCount < 3) {
            // Retry: requeue with incremented retry count
            this.channel!.nack(msg, false, true); // Requeue for retry
            logger.warn(`🔄 Message requeued for retry`, {
              messageId,
              queue: queueName,
              retryCount: retryCount + 1
            });
          } else {
            // Max retries exceeded: send to DLQ
            this.channel!.nack(msg, false, false); // Send to DLQ
            logger.error(`💀 Message sent to DLQ after max retries`, {
              messageId,
              queue: queueName,
              retryCount
            });
          }

          this.inFlightMessages.delete(messageId);
        }
      }, { 
        noAck: false // CRITICAL: Must be false for proper acknowledgment
      });

    } catch (error) {
      logger.error(`❌ Failed to start consumer for queue ${queueName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        queue: queueName
      });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag && this.connection !== null && this.channel !== null;
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      if (!this.isConnected()) {
        return {
          status: 'disconnected',
          responseTime: Date.now() - startTime
        };
      }

      // Test connection by checking if channel is open
      if (this.channel && this.connection) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      };
    }
  }

  // Private helper methods
  private async handleConnectionError(error: Error): Promise<void> {
    logger.error('❌ RabbitMQ connection error:', {
      error: error.message,
      stack: error.stack
    });
    
    this.isConnectedFlag = false;
    
    if (!this.isShuttingDown) {
      await this.handleReconnection();
    }
  }

  private async handleConnectionClose(): Promise<void> {
    logger.warn('⚠️ RabbitMQ connection closed');
    this.isConnectedFlag = false;
    
    if (!this.isShuttingDown) {
      await this.handleReconnection();
    }
  }

  private async handleReconnection(): Promise<void> {
    if (this.isShuttingDown || this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Max reconnection attempts reached or shutting down');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

    logger.warn(`🔄 Attempting to reconnect to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('❌ Reconnection attempt failed:', error);
      }
    }, delay);
  }
}

// Export singleton instance
export const rabbitmqService = new RabbitMQService();