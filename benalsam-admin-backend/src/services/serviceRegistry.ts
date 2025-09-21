import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

/**
 * Service Registry - Microservices arası iletişim için merkezi yönetim
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceConfig> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Servisleri başlat
   */
  private initializeServices(): void {
    // Cache Service
    this.registerService('cache', {
      url: process.env.CACHE_SERVICE_URL || 'http://localhost:3014',
      healthEndpoint: '/api/v1/health',
      timeout: 10000,
      retries: 3
    });

    // Categories Service
    this.registerService('categories', {
      url: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3015',
      healthEndpoint: '/api/v1/health',
      timeout: 10000,
      retries: 3
    });

    // Search Service
    this.registerService('search', {
      url: process.env.SEARCH_SERVICE_URL || 'http://localhost:3016',
      healthEndpoint: '/api/v1/health',
      timeout: 15000,
      retries: 3
    });

    // Queue Service
    this.registerService('queue', {
      url: process.env.QUEUE_SERVICE_URL || 'http://localhost:3012',
      healthEndpoint: '/api/v1/health',
      timeout: 10000,
      retries: 3
    });

    // Backup Service
    this.registerService('backup', {
      url: process.env.BACKUP_SERVICE_URL || 'http://localhost:3013',
      healthEndpoint: '/api/v1/health',
      timeout: 30000,
      retries: 2
    });

    // Upload Service
    this.registerService('upload', {
      url: process.env.UPLOAD_SERVICE_URL || 'http://localhost:3007',
      healthEndpoint: '/api/v1/health',
      timeout: 30000,
      retries: 3
    });

    logger.info('🔧 Service Registry initialized', {
      services: Array.from(this.services.keys()),
      service: 'admin-backend'
    });
  }

  /**
   * Servis kaydet
   */
  public registerService(name: string, config: ServiceConfig): void {
    this.services.set(name, config);
    
    // Axios client oluştur
    const client = axios.create({
      baseURL: config.url,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'benalsam-admin-backend/1.0.0'
      }
    });

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        logger.debug(`📡 Service request: ${name}`, {
          url: config.url,
          method: config.method,
          service: 'admin-backend'
        });
        return config;
      },
      (error) => {
        logger.error(`❌ Service request error: ${name}`, {
          error: error.message,
          service: 'admin-backend'
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        logger.debug(`✅ Service response: ${name}`, {
          status: response.status,
          url: response.config.url,
          service: 'admin-backend'
        });
        return response;
      },
      (error) => {
        logger.error(`❌ Service response error: ${name}`, {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          service: 'admin-backend'
        });
        return Promise.reject(error);
      }
    );

    this.clients.set(name, client);
  }

  /**
   * Servis client'ı al
   */
  public getClient(serviceName: string): AxiosInstance | null {
    return this.clients.get(serviceName) || null;
  }

  /**
   * Servis config'i al
   */
  public getServiceConfig(serviceName: string): ServiceConfig | null {
    return this.services.get(serviceName) || null;
  }

  /**
   * Servis sağlık kontrolü
   */
  public async healthCheck(serviceName: string): Promise<ServiceHealth> {
    const config = this.getServiceConfig(serviceName);
    if (!config) {
      return {
        name: serviceName,
        healthy: false,
        error: 'Service not found',
        responseTime: 0
      };
    }

    const startTime = Date.now();
    try {
      const client = this.getClient(serviceName);
      if (!client) {
        throw new Error('Client not found');
      }

      const response = await client.get(config.healthEndpoint);
      const responseTime = Date.now() - startTime;

      return {
        name: serviceName,
        healthy: response.status === 200,
        responseTime,
        data: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log detailed error for debugging
      logger.error(`❌ Service health check failed: ${serviceName}`, {
        serviceName: serviceName,
        url: config.url,
        endpoint: config.healthEndpoint,
        error: errorMessage,
        responseTime,
        service: 'admin-backend'
      });
      
      return {
        name: serviceName,
        healthy: false,
        error: errorMessage,
        responseTime
      };
    }
  }

  /**
   * Tüm servislerin sağlık kontrolü
   */
  public async healthCheckAll(): Promise<ServiceHealth[]> {
    const healthChecks = Array.from(this.services.keys()).map(serviceName =>
      this.healthCheck(serviceName)
    );

    return Promise.all(healthChecks);
  }

  /**
   * Servis isteği gönder
   */
  public async request<T = any>(
    serviceName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const client = this.getClient(serviceName);
    if (!client) {
      throw new Error(`Service client not found: ${serviceName}`);
    }

    const config = this.getServiceConfig(serviceName);
    if (!config) {
      throw new Error(`Service config not found: ${serviceName}`);
    }

    let retries = options?.retries || config.retries;
    let lastError: Error | null = null;

    while (retries >= 0) {
      try {
        const response = await client.request({
          method,
          url: endpoint,
          data,
          ...options
        });

        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (retries > 0) {
          logger.warn(`🔄 Service request retry: ${serviceName}`, {
            endpoint,
            retriesLeft: retries,
            error: lastError.message,
            service: 'admin-backend'
          });
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * (config.retries - retries + 1)));
          retries--;
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Servis listesi
   */
  public getServices(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Servis konfigürasyonu
 */
export interface ServiceConfig {
  url: string;
  healthEndpoint: string;
  timeout: number;
  retries: number;
}

/**
 * Servis sağlık durumu
 */
export interface ServiceHealth {
  name: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

/**
 * İstek seçenekleri
 */
export interface RequestOptions {
  retries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

// Singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();
