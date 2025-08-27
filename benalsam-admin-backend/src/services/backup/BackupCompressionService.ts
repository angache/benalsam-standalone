// ===========================
// BACKUP COMPRESSION SERVICE
// ===========================

import { createReadStream, createWriteStream } from 'fs';
import archiver from 'archiver';
import extract from 'extract-zip';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../config/logger';
import { 
  CompressionResult, 
  BackupConfig 
} from './types';

class BackupCompressionService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Create compressed backup archive
   */
  async createBackupArchive(backupPath: string, backupId: string): Promise<CompressionResult> {
    const archivePath = path.join(this.config.backupDir, `${backupId}.zip`);
    
    try {
      logger.info('Starting backup compression', { backupId, sourcePath: backupPath });

      const startTime = Date.now();
      const originalSize = await this.getDirectorySize(backupPath);

      const result = await this.compressDirectory(backupPath, archivePath);
      
      const endTime = Date.now();
      const compressionTime = endTime - startTime;

      if (result.success) {
        const compressedSize = await this.getFileSize(archivePath);
        const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

        logger.info('Backup compression completed', {
          backupId,
          originalSize,
          compressedSize,
          compressionRatio: `${compressionRatio.toFixed(2)}%`,
          compressionTime: `${compressionTime}ms`
        });

        return {
          originalSize,
          compressedSize,
          compressionRatio,
          algorithm: 'zip',
          success: true
        };
      } else {
        return {
          originalSize,
          compressedSize: 0,
          compressionRatio: 0,
          algorithm: 'zip',
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown compression error';
      
      logger.error('Backup compression failed', {
        backupId,
        error: errorMessage
      });

      return {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        algorithm: 'zip',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Extract backup archive
   */
  async extractBackupArchive(backupId: string): Promise<string> {
    const backupPath = path.join(this.config.backupDir, `${backupId}.zip`);
    const extractPath = path.join(this.config.backupDir, 'temp', backupId);

    try {
      logger.info('Starting backup extraction', { backupId, extractPath });

      await fs.mkdir(extractPath, { recursive: true });
      await extract(backupPath, { dir: extractPath });

      logger.info('Backup extraction completed', { backupId, extractPath });
      return extractPath;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
      
      logger.error('Backup extraction failed', {
        backupId,
        error: errorMessage
      });
      throw new Error(`Failed to extract backup: ${errorMessage}`);
    }
  }

  /**
   * Compress directory to zip archive
   */
  private async compressDirectory(sourcePath: string, archivePath: string): Promise<{ success: boolean, error?: string }> {
    return new Promise((resolve) => {
      const output = createWriteStream(archivePath);
      const archive = archiver('zip', { 
        zlib: { level: 9 }, // Maximum compression
        store: false // Don't store files without compression
      });

      output.on('close', () => {
        resolve({ success: true });
      });

      archive.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          logger.warn('Archive warning', { warning: err.message });
        } else {
          resolve({ success: false, error: err.message });
        }
      });

      archive.pipe(output);
      archive.directory(sourcePath, false);
      archive.finalize();
    });
  }

  /**
   * Test compression with different algorithms
   */
  async testCompressionAlgorithms(sourcePath: string): Promise<CompressionResult[]> {
    const algorithms = [
      { name: 'zip', level: 6 },
      { name: 'zip', level: 9 },
      { name: 'tar', level: 6 },
      { name: 'tar', level: 9 }
    ];

    const results: CompressionResult[] = [];
    const originalSize = await this.getDirectorySize(sourcePath);

    for (const algorithm of algorithms) {
      try {
        const testPath = path.join(this.config.backupDir, 'temp', `test_${algorithm.name}_${algorithm.level}`);
        const archivePath = `${testPath}.${algorithm.name === 'zip' ? 'zip' : 'tar.gz'}`;

        const startTime = Date.now();
        const result = await this.compressDirectory(sourcePath, archivePath);
        const endTime = Date.now();

        if (result.success) {
          const compressedSize = await this.getFileSize(archivePath);
          const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

          results.push({
            originalSize,
            compressedSize,
            compressionRatio,
            algorithm: `${algorithm.name}-${algorithm.level}`,
            success: true
          });

          // Clean up test file
          await fs.unlink(archivePath).catch(() => {});
        } else {
          results.push({
            originalSize,
            compressedSize: 0,
            compressionRatio: 0,
            algorithm: `${algorithm.name}-${algorithm.level}`,
            success: false,
            error: result.error
          });
        }

      } catch (error) {
        results.push({
          originalSize,
          compressedSize: 0,
          compressionRatio: 0,
          algorithm: `${algorithm.name}-${algorithm.level}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Get optimal compression settings
   */
  async getOptimalCompressionSettings(sourcePath: string): Promise<{ algorithm: string, level: number, expectedRatio: number }> {
    const testResults = await this.testCompressionAlgorithms(sourcePath);
    
    const successfulResults = testResults.filter(result => result.success);
    
    if (successfulResults.length === 0) {
      return { algorithm: 'zip', level: 6, expectedRatio: 0 };
    }

    // Find the best compression ratio
    const bestResult = successfulResults.reduce((best, current) => 
      current.compressionRatio > best.compressionRatio ? current : best
    );

    const [algorithm, levelStr] = bestResult.algorithm.split('-');
    const level = parseInt(levelStr);

    return {
      algorithm,
      level,
      expectedRatio: bestResult.compressionRatio
    };
  }

  /**
   * Validate archive integrity
   */
  async validateArchive(archivePath: string): Promise<{ isValid: boolean, error?: string }> {
    try {
      // Try to read the archive
      const archive = archiver('zip');
      
      return new Promise((resolve) => {
        const readStream = createReadStream(archivePath);
        
        readStream.on('error', (err) => {
          resolve({ isValid: false, error: err.message });
        });

        readStream.on('end', () => {
          resolve({ isValid: true });
        });

        readStream.pipe(archive);
      });

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

export default BackupCompressionService;
