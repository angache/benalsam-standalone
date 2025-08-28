// ===========================
// CONNECTION MANAGER UTILITY
// ===========================

import { Client } from '@elastic/elasticsearch';
import logger from '../../../config/logger';
import { ElasticsearchConfig, ConnectionStatus } from '../types';

export class ConnectionManager {
  private client: Client;
  private config: ElasticsearchConfig;
  private connectionStatus: ConnectionStatus;

  constructor(config: ElasticsearchConfig) {
    this.config = config;
    this.connectionStatus = {
      isConnected: false,
      lastCheck: new Date(),
      error: undefined,
      latency: undefined
    };

    this.client = new Client({
      node: config.node,
      auth: config.username && config.password ? { 
        username: config.username, 
        password: config.password 
      } : undefined,
      tls: config.tls
    });
  }

  async connect(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Test connection with ping
      await this.client.ping();
      
      const latency = Date.now() - startTime;
      
      this.connectionStatus = {
        isConnected: true,
        lastCheck: new Date(),
        error: undefined,
        latency
      };

      logger.info(`✅ Elasticsearch connected successfully (${latency}ms)`);
      return true;

    } catch (error: any) {
      this.connectionStatus = {
        isConnected: false,
        lastCheck: new Date(),
        error: error.message,
        latency: undefined
      };

      logger.error('❌ Elasticsearch connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      this.connectionStatus.isConnected = false;
      logger.info('🔌 Elasticsearch disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Elasticsearch:', error);
    }
  }

  async checkConnection(): Promise<ConnectionStatus> {
    try {
      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;

      this.connectionStatus = {
        isConnected: true,
        lastCheck: new Date(),
        error: undefined,
        latency
      };

      return this.connectionStatus;

    } catch (error: any) {
      this.connectionStatus = {
        isConnected: false,
        lastCheck: new Date(),
        error: error.message,
        latency: undefined
      };

      return this.connectionStatus;
    }
  }

  isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  getClient(): Client {
    return this.client;
  }

  getConfig(): ElasticsearchConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    try {
      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;

      return {
        success: true,
        latency
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getClusterInfo(): Promise<any> {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Error getting cluster info:', error);
      throw error;
    }
  }

  async getClusterHealth(): Promise<any> {
    try {
      const health = await this.client.cluster.health();
      return health;
    } catch (error) {
      logger.error('Error getting cluster health:', error);
      throw error;
    }
  }
}
