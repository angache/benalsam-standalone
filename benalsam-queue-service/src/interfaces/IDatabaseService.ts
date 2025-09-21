/**
 * Database Service Interface
 * Test edilebilirlik için abstraction layer
 */
export interface IDatabaseService {
  /**
   * Database bağlantısını test et
   */
  healthCheck(): Promise<{ status: string; responseTime: number }>;
  
  /**
   * Pending job'ları getir
   */
  getPendingJobs(limit?: number): Promise<any[]>;
  
  /**
   * Job status'unu güncelle
   */
  updateJobStatus(jobId: number, status: string, traceId?: string, errorMessage?: string): Promise<void>;
  
  /**
   * Job'ı işleniyor olarak işaretle
   */
  markJobAsProcessing(jobId: number, traceId: string): Promise<void>;
  
  /**
   * Job'ı tamamlandı olarak işaretle
   */
  markJobAsCompleted(jobId: number, traceId: string): Promise<void>;
  
  /**
   * Job'ı başarısız olarak işaretle
   */
  markJobAsFailed(jobId: number, traceId: string, errorMessage: string): Promise<void>;
}

/**
 * RabbitMQ Service Interface
 */
export interface IRabbitMQService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publishMessage(queueName: string, message: any): Promise<void>;
  publishToExchange(exchange: string, routingKey: string, message: any, options?: any): Promise<boolean>;
  consumeMessages(queueName: string, handler: (message: any) => Promise<void>): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<{ status: string; responseTime: number }>;
}

/**
 * Logger Interface
 */
export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
