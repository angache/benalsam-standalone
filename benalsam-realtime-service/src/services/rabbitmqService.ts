import amqp from 'amqplib';
import logger from '../config/logger';

export class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env['RABBITMQ_URL'] || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      logger.info('✅ RabbitMQ connected successfully');

      // Connection error handling
      this.connection.on('error', (error: any) => {
        logger.error('❌ RabbitMQ connection error:', error);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async sendMessage(queueName: string, message: any): Promise<void> {
    try {
      if (!this.channel || !this.isConnected) {
        await this.connect();
      }

      // Mevcut queue'yu kontrol et, declare etme
      try {
        await this.channel!.checkQueue(queueName);
        logger.info(`✅ Queue exists: ${queueName}`);
      } catch (error) {
        // Queue yoksa oluştur
        if (queueName === 'elasticsearch.sync') {
          // ES Service ile aynı parametrelerle oluştur
          await this.channel!.assertQueue(queueName, {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'benalsam.listings.dlx',
              'x-dead-letter-routing-key': 'dead.letter',
              'x-message-ttl': 1000 * 60 * 60 * 24, // 24 hours
              'x-max-retries': 3,
              'x-queue-type': 'classic'
            }
          });
        } else {
          await this.channel!.assertQueue(queueName, { durable: true });
        }
        logger.info(`✅ Queue created: ${queueName}`);
      }

      // Mesajı gönder
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel!.sendToQueue(queueName, messageBuffer, {
        persistent: true,
        messageId: message.id || `msg_${Date.now()}`,
        timestamp: Date.now()
      });

      logger.info(`✅ Message sent to RabbitMQ: ${queueName}`, {
        messageId: message.id,
        queue: queueName
      });

    } catch (error) {
      logger.error('❌ Failed to send message to RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('✅ RabbitMQ disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting from RabbitMQ:', error);
    }
  }

  isConnectedToRabbitMQ(): boolean {
    return this.isConnected;
  }
}

export default new RabbitMQService();
