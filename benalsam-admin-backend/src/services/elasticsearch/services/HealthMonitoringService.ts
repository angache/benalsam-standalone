// ===========================
// HEALTH MONITORING SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import logger from '../../config/logger';
import { HealthStatus, IndexStats } from '../types';

class HealthMonitoringService {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      logger.info('🏥 Performing Elasticsearch health check');

      const response = await this.client.cluster.health();
      const health = response.body;

      logger.info(`✅ Cluster health: ${health.status} (${health.number_of_nodes} nodes)`);
      return health;

    } catch (error) {
      logger.error('❌ Error in health check:', error);
      throw error;
    }
  }

  async getIndexStats(indexName?: string): Promise<IndexStats> {
    try {
      logger.info(`📊 Getting index stats${indexName ? ` for ${indexName}` : ''}`);

      const response = await this.client.indices.stats({
        index: indexName
      });

      return response.body;

    } catch (error) {
      logger.error('❌ Error getting index stats:', error);
      throw error;
    }
  }

  async getAllIndicesStats(): Promise<any> {
    try {
      logger.info('📊 Getting all indices stats');

      const response = await this.client.indices.stats();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting all indices stats:', error);
      throw error;
    }
  }

  async getClusterInfo(): Promise<any> {
    try {
      logger.info('ℹ️ Getting cluster info');

      const response = await this.client.info();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting cluster info:', error);
      throw error;
    }
  }

  async getClusterSettings(): Promise<any> {
    try {
      logger.info('⚙️ Getting cluster settings');

      const response = await this.client.cluster.getSettings();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting cluster settings:', error);
      throw error;
    }
  }

  async getNodeStats(): Promise<any> {
    try {
      logger.info('📈 Getting node stats');

      const response = await this.client.nodes.stats();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting node stats:', error);
      throw error;
    }
  }

  async getPendingTasks(): Promise<any> {
    try {
      logger.info('⏳ Getting pending tasks');

      const response = await this.client.cluster.pendingTasks();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting pending tasks:', error);
      throw error;
    }
  }

  async getClusterState(): Promise<any> {
    try {
      logger.info('🏛️ Getting cluster state');

      const response = await this.client.cluster.state();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting cluster state:', error);
      throw error;
    }
  }

  async getIndexHealth(indexName: string): Promise<any> {
    try {
      logger.info(`🏥 Getting index health for: ${indexName}`);

      const response = await this.client.cluster.health({
        index: indexName
      });

      return response.body;

    } catch (error) {
      logger.error(`❌ Error getting index health for ${indexName}:`, error);
      throw error;
    }
  }

  async getShardStats(): Promise<any> {
    try {
      logger.info('📊 Getting shard stats');

      const response = await this.client.cat.shards({
        format: 'json',
        v: true
      });

      return response.body;

    } catch (error) {
      logger.error('❌ Error getting shard stats:', error);
      throw error;
    }
  }

  async getAliases(): Promise<any> {
    try {
      logger.info('🏷️ Getting aliases');

      const response = await this.client.cat.aliases({
        format: 'json',
        v: true
      });

      return response.body;

    } catch (error) {
      logger.error('❌ Error getting aliases:', error);
      throw error;
    }
  }

  async getTemplates(): Promise<any> {
    try {
      logger.info('📋 Getting index templates');

      const response = await this.client.indices.getTemplate();
      return response.body;

    } catch (error) {
      logger.error('❌ Error getting templates:', error);
      throw error;
    }
  }

  async getMapping(indexName: string): Promise<any> {
    try {
      logger.info(`🗺️ Getting mapping for: ${indexName}`);

      const response = await this.client.indices.getMapping({
        index: indexName
      });

      return response.body;

    } catch (error) {
      logger.error(`❌ Error getting mapping for ${indexName}:`, error);
      throw error;
    }
  }

  async getSettings(indexName: string): Promise<any> {
    try {
      logger.info(`⚙️ Getting settings for: ${indexName}`);

      const response = await this.client.indices.getSettings({
        index: indexName
      });

      return response.body;

    } catch (error) {
      logger.error(`❌ Error getting settings for ${indexName}:`, error);
      throw error;
    }
  }

  async getDetailedHealthReport(): Promise<any> {
    try {
      logger.info('📋 Generating detailed health report');

      const [
        health,
        clusterInfo,
        nodeStats,
        pendingTasks,
        indicesStats
      ] = await Promise.all([
        this.healthCheck(),
        this.getClusterInfo(),
        this.getNodeStats(),
        this.getPendingTasks(),
        this.getAllIndicesStats()
      ]);

      return {
        timestamp: new Date().toISOString(),
        health,
        clusterInfo,
        nodeStats,
        pendingTasks,
        indicesStats,
        summary: {
          status: health.status,
          nodes: health.number_of_nodes,
          indices: Object.keys(indicesStats.indices || {}).length,
          totalDocs: Object.values(indicesStats.indices || {}).reduce((total: number, index: any) => {
            return total + (index.total?.docs?.count || 0);
          }, 0),
          totalSize: Object.values(indicesStats.indices || {}).reduce((total: number, index: any) => {
            return total + (index.total?.store?.size_in_bytes || 0);
          }, 0)
        }
      };

    } catch (error) {
      logger.error('❌ Error generating detailed health report:', error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'green' || health.status === 'yellow';
    } catch (error) {
      logger.error('❌ Error checking if cluster is healthy:', error);
      return false;
    }
  }

  async getPerformanceMetrics(): Promise<any> {
    try {
      logger.info('📈 Getting performance metrics');

      const [nodeStats, indicesStats] = await Promise.all([
        this.getNodeStats(),
        this.getAllIndicesStats()
      ]);

      return {
        timestamp: new Date().toISOString(),
        nodes: nodeStats.nodes,
        indices: indicesStats.indices,
        performance: {
          indexing: this.calculateIndexingMetrics(indicesStats),
          search: this.calculateSearchMetrics(indicesStats),
          memory: this.calculateMemoryMetrics(nodeStats),
          disk: this.calculateDiskMetrics(nodeStats)
        }
      };

    } catch (error) {
      logger.error('❌ Error getting performance metrics:', error);
      throw error;
    }
  }

  private calculateIndexingMetrics(indicesStats: any): any {
    const totalIndexing = Object.values(indicesStats.indices || {}).reduce((total: any, index: any) => {
      const stats = index.total?.indexing || {};
      return {
        total: (total.total || 0) + (stats.index_total || 0),
        time: (total.time || 0) + (stats.index_time_in_millis || 0)
      };
    }, {});

    return {
      totalOperations: totalIndexing.total,
      totalTimeMs: totalIndexing.time,
      averageTimeMs: totalIndexing.total > 0 ? totalIndexing.time / totalIndexing.total : 0
    };
  }

  private calculateSearchMetrics(indicesStats: any): any {
    const totalSearch = Object.values(indicesStats.indices || {}).reduce((total: any, index: any) => {
      const stats = index.total?.search || {};
      return {
        total: (total.total || 0) + (stats.query_total || 0),
        time: (total.time || 0) + (stats.query_time_in_millis || 0)
      };
    }, {});

    return {
      totalQueries: totalSearch.total,
      totalTimeMs: totalSearch.time,
      averageTimeMs: totalSearch.total > 0 ? totalSearch.time / totalSearch.total : 0
    };
  }

  private calculateMemoryMetrics(nodeStats: any): any {
    const nodes = Object.values(nodeStats.nodes || {});
    const totalMemory = nodes.reduce((total: number, node: any) => {
      return total + (node.jvm?.mem?.heap_used_in_bytes || 0);
    }, 0);

    return {
      totalHeapUsed: totalMemory,
      averageHeapUsed: nodes.length > 0 ? totalMemory / nodes.length : 0,
      nodeCount: nodes.length
    };
  }

  private calculateDiskMetrics(nodeStats: any): any {
    const nodes = Object.values(nodeStats.nodes || {});
    const totalDisk = nodes.reduce((total: number, node: any) => {
      return total + (node.fs?.total?.total_in_bytes || 0);
    }, 0);

    return {
      totalDiskSpace: totalDisk,
      averageDiskSpace: nodes.length > 0 ? totalDisk / nodes.length : 0,
      nodeCount: nodes.length
    };
  }
}

export default HealthMonitoringService;
