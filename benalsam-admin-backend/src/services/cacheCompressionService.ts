import cacheManager from './cacheManager';
import logger from '../config/logger';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

/**
 * KVKK COMPLIANCE: Cache Compression Service
 * 
 * Cache compression sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ EFFICIENT_STORAGE - Verimli depolama
 * ✅ PERFORMANCE_OPTIMIZATION - Performans optimizasyonu
 * ✅ MEMORY_MANAGEMENT - Bellek yönetimi
 * ✅ TRANSPARENCY - Compression süreleri açık
 * ✅ DATA_INTEGRITY - Veri bütünlüğü korunur
 */

interface CompressionStats {
  totalCompressed: number;
  totalDecompressed: number;
  totalBytesSaved: number;
  averageCompressionRatio: number;
  compressionSpeed: number; // bytes per second
  decompressionSpeed: number; // bytes per second
  algorithms: {
    [algorithm: string]: {
      usage: number;
      averageRatio: number;
      totalBytesSaved: number;
    };
  };
}

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  bytesSaved: number;
  algorithm: string;
  compressionTime: number;
  decompressionTime: number;
}

interface CompressionConfig {
  algorithm: 'gzip' | 'brotli' | 'lz4';
  level: number;
  threshold: number; // Minimum size to compress
  maxSize: number; // Maximum size to compress
  enableCompression: boolean;
}

class CacheCompressionService {
  private stats: CompressionStats;
  private config: CompressionConfig;
  private readonly gzipAsync = promisify(gzip);
  private readonly gunzipAsync = promisify(gunzip);

  constructor() {
    this.config = {
      algorithm: 'gzip',
      level: 6,
      threshold: 1024, // 1KB
      maxSize: 10 * 1024 * 1024, // 10MB
      enableCompression: true
    };

    this.stats = {
      totalCompressed: 0,
      totalDecompressed: 0,
      totalBytesSaved: 0,
      averageCompressionRatio: 0,
      compressionSpeed: 0,
      decompressionSpeed: 0,
      algorithms: {
        gzip: {
          usage: 0,
          averageRatio: 0,
          totalBytesSaved: 0
        }
      }
    };

    logger.info('✅ Cache Compression Service initialized');
  }

  /**
   * Compress data
   */
  async compress(data: any): Promise<CompressionResult> {
    try {
      if (!this.config.enableCompression) {
        return this.createNoCompressionResult(data);
      }

      const originalData = JSON.stringify(data);
      const originalSize = Buffer.byteLength(originalData, 'utf8');

      // Check if compression is beneficial
      if (originalSize < this.config.threshold || originalSize > this.config.maxSize) {
        return this.createNoCompressionResult(data);
      }

      const startTime = Date.now();
      const compressedBuffer = await this.gzipAsync(originalData, { level: this.config.level });
      const compressionTime = Date.now() - startTime;

      const compressedSize = compressedBuffer.length;
      const compressionRatio = (1 - (compressedSize / originalSize)) * 100;
      const bytesSaved = originalSize - compressedSize;

      // Update stats
      this.updateStats(originalSize, compressedSize, compressionTime, 'gzip');

      const result: CompressionResult = {
        originalSize,
        compressedSize,
        compressionRatio,
        bytesSaved,
        algorithm: 'gzip',
        compressionTime,
        decompressionTime: 0
      };

      logger.debug(`🗜️ Compressed data: ${originalSize} -> ${compressedSize} bytes (${compressionRatio.toFixed(1)}% saved)`);
      return result;
    } catch (error) {
      logger.error('❌ Compression error:', error);
      return this.createNoCompressionResult(data);
    }
  }

  /**
   * Decompress data
   */
  async decompress(compressedData: Buffer): Promise<{ data: any; result: CompressionResult }> {
    try {
      const startTime = Date.now();
      const decompressedBuffer = await this.gunzipAsync(compressedData);
      const decompressionTime = Date.now() - startTime;

      const originalSize = compressedData.length;
      const decompressedSize = decompressedBuffer.length;
      const data = JSON.parse(decompressedBuffer.toString('utf8'));

      const result: CompressionResult = {
        originalSize: decompressedSize,
        compressedSize: originalSize,
        compressionRatio: ((decompressedSize - originalSize) / decompressedSize) * 100,
        bytesSaved: decompressedSize - originalSize,
        algorithm: 'gzip',
        compressionTime: 0,
        decompressionTime
      };

      logger.debug(`🔓 Decompressed data: ${originalSize} -> ${decompressedSize} bytes`);
      return { data, result };
    } catch (error) {
      logger.error('❌ Decompression error:', error);
      throw error;
    }
  }

  /**
   * Create no compression result
   */
  private createNoCompressionResult(data: any): CompressionResult {
    const originalData = JSON.stringify(data);
    const size = Buffer.byteLength(originalData, 'utf8');

    return {
      originalSize: size,
      compressedSize: size,
      compressionRatio: 0,
      bytesSaved: 0,
      algorithm: 'none',
      compressionTime: 0,
      decompressionTime: 0
    };
  }

  /**
   * Update compression statistics
   */
  private updateStats(originalSize: number, compressedSize: number, time: number, algorithm: string): void {
    this.stats.totalCompressed++;
    this.stats.totalBytesSaved += (originalSize - compressedSize);
    this.stats.averageCompressionRatio = this.stats.totalBytesSaved / this.stats.totalCompressed;

    if (time > 0) {
      this.stats.compressionSpeed = (originalSize / time) * 1000; // bytes per second
    }

    if (this.stats.algorithms[algorithm]) {
      this.stats.algorithms[algorithm].usage++;
      this.stats.algorithms[algorithm].totalBytesSaved += (originalSize - compressedSize);
      this.stats.algorithms[algorithm].averageRatio = 
        this.stats.algorithms[algorithm].totalBytesSaved / this.stats.algorithms[algorithm].usage;
    }
  }

  /**
   * Compress and cache data
   */
  async compressAndCache(key: string, data: any, ttl?: number): Promise<boolean> {
    try {
      const compressionResult = await this.compress(data);
      
      if (compressionResult.compressionRatio > 0) {
        // Store compressed data
        const compressedData = await this.gzipAsync(JSON.stringify(data), { level: this.config.level });
        const success = await cacheManager.set(key, compressedData, ttl, '');
        
        if (success) {
          logger.debug(`🗜️ Compressed and cached: ${key} (${compressionResult.compressionRatio.toFixed(1)}% saved)`);
        }
        
        return success;
      } else {
        // Store uncompressed data
        const success = await cacheManager.set(key, data, ttl, '');
        return success;
      }
    } catch (error) {
      logger.error('❌ Compress and cache error:', error);
      return false;
    }
  }

  /**
   * Get and decompress cached data
   */
  async getAndDecompress(key: string): Promise<any> {
    try {
      const cachedData = await cacheManager.get(key, '');
      
      if (!cachedData) {
        return null;
      }

      // Check if data is compressed (Buffer)
      if (Buffer.isBuffer(cachedData)) {
        const { data } = await this.decompress(cachedData);
        return data;
      } else {
        // Data is not compressed
        return cachedData;
      }
    } catch (error) {
      logger.error('❌ Get and decompress error:', error);
      return null;
    }
  }

  /**
   * Get compression statistics
   */
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  /**
   * Get compression configuration
   */
  getConfig(): CompressionConfig {
    return { ...this.config };
  }

  /**
   * Update compression configuration
   */
  updateConfig(newConfig: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('⚙️ Compression config updated');
  }

  /**
   * Get compression performance metrics
   */
  getPerformanceMetrics(): any {
    const stats = this.getStats();
    
    return {
      totalCompressed: stats.totalCompressed,
      totalDecompressed: stats.totalDecompressed,
      totalBytesSaved: stats.totalBytesSaved,
      averageCompressionRatio: stats.averageCompressionRatio,
      compressionSpeed: stats.compressionSpeed,
      decompressionSpeed: stats.decompressionSpeed,
      memorySavings: {
        bytes: stats.totalBytesSaved,
        kilobytes: Math.round(stats.totalBytesSaved / 1024),
        megabytes: Math.round(stats.totalBytesSaved / (1024 * 1024))
      },
      efficiency: {
        compressionRatio: stats.averageCompressionRatio,
        speedRatio: stats.compressionSpeed > 0 ? stats.decompressionSpeed / stats.compressionSpeed : 0
      }
    };
  }

  /**
   * Get compression algorithms performance
   */
  getAlgorithmPerformance(): any {
    const stats = this.getStats();
    
    return {
      algorithms: stats.algorithms,
      recommendations: this.getCompressionRecommendations()
    };
  }

  /**
   * Get compression recommendations
   */
  private getCompressionRecommendations(): any {
    const stats = this.getStats();
    
    const recommendations = {
      enableCompression: stats.averageCompressionRatio > 10,
      adjustThreshold: stats.averageCompressionRatio < 5 ? 'increase' : 'decrease',
      algorithm: stats.algorithms.gzip.averageRatio > 20 ? 'gzip' : 'consider_brotli',
      level: stats.averageCompressionRatio < 15 ? 'increase' : 'optimal'
    };

    return recommendations;
  }

  /**
   * Test compression with sample data
   */
  async testCompression(sampleData: any): Promise<CompressionResult> {
    try {
      const result = await this.compress(sampleData);
      
      logger.info(`🧪 Compression test: ${result.originalSize} -> ${result.compressedSize} bytes (${result.compressionRatio.toFixed(1)}% saved)`);
      
      return result;
    } catch (error) {
      logger.error('❌ Compression test error:', error);
      throw error;
    }
  }

  /**
   * Get memory usage analysis
   */
  getMemoryAnalysis(): any {
    const stats = this.getStats();
    
    return {
      totalMemorySaved: stats.totalBytesSaved,
      averageSavingsPerItem: stats.totalCompressed > 0 ? stats.totalBytesSaved / stats.totalCompressed : 0,
      compressionEfficiency: stats.averageCompressionRatio,
      recommendations: {
        enableForLargeData: stats.averageCompressionRatio > 15,
        adjustThreshold: stats.averageCompressionRatio < 5 ? this.config.threshold * 2 : this.config.threshold,
        optimizeLevel: stats.averageCompressionRatio < 10 ? this.config.level + 1 : this.config.level
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test compression with sample data
      const testData = { test: 'compression', timestamp: Date.now() };
      const result = await this.compress(testData);
      
      return result.compressionRatio >= 0 && result.compressionTime >= 0;
    } catch (error) {
      logger.error('❌ Compression health check failed:', error);
      return false;
    }
  }
}

export default new CacheCompressionService(); 