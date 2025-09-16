/**
 * RabbitMQ Configuration
 * 
 * @fileoverview RabbitMQ connection configuration for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import amqp from 'amqplib';
import { logger } from './logger';

const rabbitmqUrl = process.env['RABBITMQ_URL'] || 'amqp://localhost:5672';

// Connection and channel instances
let connection: any = null;
let channel: amqp.Channel | null = null;

/**
 * Connect to RabbitMQ
 */
export async function connectRabbitMQ(): Promise<void> {
  try {
    logger.info('🔌 Connecting to RabbitMQ...');
    
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    
    // Handle connection events
    connection.on('error', (error: any) => {
      logger.error('❌ RabbitMQ connection error:', error);
    });
    
    connection.on('close', () => {
      logger.warn('⚠️ RabbitMQ connection closed');
    });
    
    // Setup exchanges and queues
    await setupExchanges();
    await setupQueues();
    
    logger.info('✅ RabbitMQ connected successfully');
    
  } catch (error) {
    logger.error('❌ Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

/**
 * Setup exchanges
 */
async function setupExchanges(): Promise<void> {
  if (!channel) throw new Error('RabbitMQ channel not available');
  
  try {
    // Main listings exchange
    await channel.assertExchange('benalsam.listings', 'topic', {
      durable: true,
      autoDelete: false
    });
    
    // Job processing exchange
    await channel.assertExchange('benalsam.jobs', 'topic', {
      durable: true,
      autoDelete: false
    });
    
    // Dead letter exchange
    await channel.assertExchange('benalsam.dlx', 'topic', {
      durable: true,
      autoDelete: false
    });
    
    logger.info('✅ RabbitMQ exchanges created');
    
  } catch (error) {
    logger.error('❌ Failed to setup RabbitMQ exchanges:', error);
    throw error;
  }
}

/**
 * Setup queues
 */
async function setupQueues(): Promise<void> {
  if (!channel) throw new Error('RabbitMQ channel not available');
  
  try {
    // Listing creation queue
    await channel.assertQueue('listing.create', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'benalsam.dlx',
        'x-dead-letter-routing-key': 'listing.create.failed',
        'x-message-ttl': 3600000, // 1 hour
        'x-max-retries': 3
      }
    });
    
    // Listing update queue
    await channel.assertQueue('listing.update', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'benalsam.dlx',
        'x-dead-letter-routing-key': 'listing.update.failed',
        'x-message-ttl': 3600000, // 1 hour
        'x-max-retries': 3
      }
    });
    
    // Job processing queue
    await channel.assertQueue('listing.jobs', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'benalsam.dlx',
        'x-dead-letter-routing-key': 'listing.jobs.failed',
        'x-message-ttl': 7200000, // 2 hours
        'x-max-retries': 5
      }
    });
    
    // Bind queues to exchanges
    await channel.bindQueue('listing.create', 'benalsam.listings', 'listing.create');
    await channel.bindQueue('listing.update', 'benalsam.listings', 'listing.update');
    await channel.bindQueue('listing.jobs', 'benalsam.jobs', 'listing.*');
    
    logger.info('✅ RabbitMQ queues created and bound');
    
  } catch (error) {
    logger.error('❌ Failed to setup RabbitMQ queues:', error);
    throw error;
  }
}

/**
 * Get RabbitMQ channel
 */
export function getChannel(): amqp.Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not available');
  }
  return channel;
}

/**
 * Get RabbitMQ connection status
 */
export function getConnectionStatus(): boolean {
  return connection !== null;
}

/**
 * Health check for RabbitMQ
 */
export async function rabbitmqHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    channelOpen: boolean;
    responseTime: number;
    error?: string;
  };
}> {
  const startTime = Date.now();
  
  try {
    if (!connection || !channel) {
      throw new Error('RabbitMQ not connected');
    }
    
    // Test channel
    await channel.checkExchange('benalsam.listings');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        connected: getConnectionStatus(),
        channelOpen: channel !== null,
        responseTime
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      details: {
        connected: getConnectionStatus(),
        channelOpen: channel !== null,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Disconnect from RabbitMQ
 */
export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    
    if (connection) {
      await connection.close();
      connection = null;
    }
    
    logger.info('✅ RabbitMQ disconnected');
    
  } catch (error) {
    logger.error('❌ Error disconnecting from RabbitMQ:', error);
  }
}