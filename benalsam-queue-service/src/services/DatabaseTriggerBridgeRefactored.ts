import { IDatabaseService, IRabbitMQService, ILogger } from '../interfaces/IDatabaseService';

interface TraceContext {
  traceId: string;
  jobId: number;
  recordId: string;
  operation: string;
}

// interface JobStatus {
//   status: string;
//   processed_at?: string;
//   trace_id?: string;
//   error_message?: string;
// }

/**
 * Refactored Database Trigger Bridge
 * Dependency Injection ile test edilebilir
 */
export class DatabaseTriggerBridgeRefactored {
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private lastProcessedAt: Date | null = null;
  private processedJobsCount: number = 0;
  private errorCount: number = 0;

  constructor(
    private databaseService: IDatabaseService,
    private rabbitmqService: IRabbitMQService,
    private logger: ILogger
  ) {}

  /**
   * Database trigger bridge'i başlat
   */
  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('⚠️ Database trigger bridge already running');
      return;
    }

    this.isProcessing = true;
    this.logger.info('🚀 Starting database trigger bridge...');

    // RabbitMQ bağlantısını kontrol et
    try {
      await this.rabbitmqService.connect();
      this.logger.info('✅ RabbitMQ connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
    }

    this.processingInterval = setInterval(async () => {
      await this.processPendingJobs();
    }, intervalMs);

    this.logger.info('✅ Database trigger bridge started');
  }

  /**
   * Bridge'i durdur
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    this.logger.info('🛑 Stopping database trigger bridge...');
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.logger.info('✅ Database trigger bridge stopped');
  }

  /**
   * Pending job'ları işle
   */
  private async processPendingJobs(): Promise<void> {
    try {
      const pendingJobs = await this.databaseService.getPendingJobs(10);

      if (!pendingJobs || pendingJobs.length === 0) {
        return; // No pending jobs
      }

      this.logger.info(`📥 Processing ${pendingJobs.length} pending jobs`);

      for (const job of pendingJobs) {
        await this.processJob(job);
      }

      this.lastProcessedAt = new Date();
      this.processedJobsCount += pendingJobs.length;

    } catch (error) {
      this.logger.error('❌ Error processing pending jobs:', error);
      this.errorCount++;
    }
  }

  /**
   * Tek bir job'ı işle
   */
  private async processJob(job: any): Promise<void> {
    const traceId = this.generateTraceId();
    const traceContext: TraceContext = {
      traceId,
      jobId: job.id,
      recordId: job.record_id,
      operation: job.operation
    };

    try {
      this.logger.info(`🔄 Processing job ${job.id}`, { traceContext });

      // Job'ı processing olarak işaretle
      await this.databaseService.markJobAsProcessing(job.id, traceId);

      // RabbitMQ'ya mesaj gönder (exchange + routing key ile)
      const opUpper = (job.operation || '').toUpperCase();
      const routingKey = opUpper === 'DELETE' ? 'listing.delete' : 'listing.update';
      const message = {
        type: 'ELASTICSEARCH_SYNC',
        operation: opUpper,
        table: 'listings',
        recordId: job.record_id,
        changeData: job.change_data || { old: null, new: null },
        traceId,
        timestamp: new Date().toISOString(),
      };

      await this.rabbitmqService.publishToExchange(
        process.env['RABBITMQ_EXCHANGE'] || 'benalsam.jobs',
        routingKey,
        message,
        { messageId: `job_${job.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }
      );

      // Job'ı completed olarak işaretle
      await this.databaseService.markJobAsCompleted(job.id, traceId);

      this.logger.info(`✅ Job ${job.id} processed successfully`, { traceContext });

    } catch (error) {
      this.logger.error(`❌ Job ${job.id} processing failed:`, { 
        error, 
        traceContext 
      });

      // Job'ı failed olarak işaretle
      await this.databaseService.markJobAsFailed(
        job.id, 
        traceId, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Trace ID oluştur
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Bridge durumunu getir
   */
  getStatus(): {
    isProcessing: boolean;
    lastProcessedAt: Date | null;
    processedJobsCount: number;
    errorCount: number;
  } {
    return {
      isProcessing: this.isProcessing,
      lastProcessedAt: this.lastProcessedAt,
      processedJobsCount: this.processedJobsCount,
      errorCount: this.errorCount
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    database: { status: string; responseTime: number };
    rabbitmq: { status: string; connected: boolean };
    bridge: {
      isProcessing: boolean;
      processedJobsCount: number;
      errorCount: number;
    };
  }> {
    try {
      const databaseHealth = await this.databaseService.healthCheck();
      const rabbitmqConnected = this.rabbitmqService.isConnected();
      const bridgeStatus = this.getStatus();

      const overallStatus = 
        databaseHealth.status === 'healthy' && 
        rabbitmqConnected && 
        bridgeStatus.isProcessing 
          ? 'healthy' 
          : 'degraded';

      return {
        status: overallStatus,
        database: databaseHealth,
        rabbitmq: {
          status: rabbitmqConnected ? 'connected' : 'disconnected',
          connected: rabbitmqConnected
        },
        bridge: {
          isProcessing: bridgeStatus.isProcessing,
          processedJobsCount: bridgeStatus.processedJobsCount,
          errorCount: bridgeStatus.errorCount
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        database: { status: 'unhealthy', responseTime: 0 },
        rabbitmq: { status: 'disconnected', connected: false },
        bridge: {
          isProcessing: false,
          processedJobsCount: 0,
          errorCount: 1
        }
      };
    }
  }
}
