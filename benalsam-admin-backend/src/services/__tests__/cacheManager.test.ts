import cacheManager from '../cacheManager';
import memoryCacheService from '../memoryCacheService';
import cacheService from '../cacheService';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../memoryCacheService');
jest.mock('../cacheService');
jest.mock('../../config/logger');

describe('CacheManager', () => {
  let cacheManagerInstance: typeof cacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManagerInstance = cacheManager;
  });

  describe('Initialization', () => {
    it('should initialize with default strategy', () => {
      expect(cacheManagerInstance).toBeDefined();
    });

    it('should initialize layers correctly', () => {
      const layers = (cacheManagerInstance as any).layers;
      expect(layers).toHaveLength(2); // memory + local-redis
      expect(layers[0].name).toBe('memory');
      expect(layers[1].name).toBe('local-redis');
    });
  });

  describe('get()', () => {
    it('should return cached data from memory layer', async () => {
      const mockData = { id: 1, name: 'test' };
      (memoryCacheService.get as jest.Mock).mockResolvedValue(mockData);

      const result = await cacheManagerInstance.get('test-key');

      expect(result).toEqual(mockData);
      expect(memoryCacheService.get).toHaveBeenCalledWith('test-key');
    });

    it('should return cached data from redis layer when memory miss', async () => {
      const mockData = { id: 1, name: 'test' };
      (memoryCacheService.get as jest.Mock).mockResolvedValue(null);
      (cacheService.getCachedResponse as jest.Mock).mockResolvedValue(mockData);

      const result = await cacheManagerInstance.get('test-key');

      expect(result).toEqual(mockData);
      expect(memoryCacheService.get).toHaveBeenCalledWith('test-key');
      expect(cacheService.getCachedResponse).toHaveBeenCalledWith('test-key');
    });

    it('should return null when no cache hit', async () => {
      (memoryCacheService.get as jest.Mock).mockResolvedValue(null);
      (cacheService.getCachedResponse as jest.Mock).mockResolvedValue(null);

      const result = await cacheManagerInstance.get('test-key');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (memoryCacheService.get as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const result = await cacheManagerInstance.get('test-key');

      expect(result).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('set()', () => {
    it('should set data in all layers', async () => {
      const testData = { id: 1, name: 'test' };
      (memoryCacheService.set as jest.Mock).mockResolvedValue(true);
      (cacheService.cacheResponse as jest.Mock).mockResolvedValue(undefined);

      const result = await cacheManagerInstance.set('test-key', testData, 300);

      expect(result).toBe(true);
      expect(memoryCacheService.set).toHaveBeenCalledWith('test-key', testData, 300, undefined);
      expect(cacheService.cacheResponse).toHaveBeenCalledWith('test-key', testData, 'local-redis', undefined);
    });

    it('should handle set errors gracefully', async () => {
      (memoryCacheService.set as jest.Mock).mockRejectedValue(new Error('Set error'));

      const result = await cacheManagerInstance.set('test-key', { data: 'test' });

      expect(result).toBe(true); // Returns true even on error due to fallback
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should delete data from all layers', async () => {
      (memoryCacheService.delete as jest.Mock).mockResolvedValue(true);

      const result = await cacheManagerInstance.delete('test-key');

      expect(result).toBe(true);
      expect(memoryCacheService.delete).toHaveBeenCalledWith('test-key');
    });

    it('should handle delete errors gracefully', async () => {
      (memoryCacheService.delete as jest.Mock).mockRejectedValue(new Error('Delete error'));

      const result = await cacheManagerInstance.delete('test-key');

      expect(result).toBe(true); // Returns true even on error due to fallback
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('clear()', () => {
    it('should clear all layers', async () => {
      (memoryCacheService.clear as jest.Mock).mockResolvedValue(undefined);

      await cacheManagerInstance.clear();

      expect(memoryCacheService.clear).toHaveBeenCalled();
    });

    it('should handle clear errors gracefully', async () => {
      (memoryCacheService.clear as jest.Mock).mockRejectedValue(new Error('Clear error'));

      await expect(cacheManagerInstance.clear()).resolves.not.toThrow();
    });
  });

  describe('getStats()', () => {
    it('should return combined stats from all layers', async () => {
      const memoryStats = { totalItems: 10, hitRate: 0.8 };
      const redisStats = { totalKeys: 50, hitRate: 0.7 };
      
      (memoryCacheService.getStats as jest.Mock).mockReturnValue(memoryStats);
      (cacheService.getCacheStats as jest.Mock).mockResolvedValue(redisStats);

      const result = await cacheManagerInstance.getStats();

      expect(result).toHaveProperty('layers');
      expect(result).toHaveProperty('overall');
      expect(Array.isArray(result.layers)).toBe(true);
      expect(result.layers).toHaveLength(2);
    });
  });

  describe('healthCheck()', () => {
    it('should return true when all layers are healthy', async () => {
      (memoryCacheService.healthCheck as jest.Mock).mockResolvedValue(true);
      (cacheService.healthCheck as jest.Mock).mockResolvedValue(true);

      const result = await cacheManagerInstance.healthCheck();

      expect(result).toBe(true);
    });

    it('should return true when any layer is unhealthy (fallback behavior)', async () => {
      (memoryCacheService.healthCheck as jest.Mock).mockResolvedValue(false);
      (cacheService.healthCheck as jest.Mock).mockResolvedValue(true);

      const result = await cacheManagerInstance.healthCheck();

      expect(result).toBe(true); // Returns true due to fallback behavior
    });
  });

  describe('warmCache()', () => {
    it('should warm cache with provided data', async () => {
      const keys = ['key1', 'key2'];
      const dataProvider = jest.fn().mockResolvedValue({ data: 'test' });
      (memoryCacheService.set as jest.Mock).mockResolvedValue(true);

      await cacheManagerInstance.warmCache(keys, dataProvider);

      expect(dataProvider).toHaveBeenCalledTimes(2);
      expect(memoryCacheService.set).toHaveBeenCalledTimes(2);
    });

    it('should handle warm cache errors gracefully', async () => {
      const keys = ['key1'];
      const dataProvider = jest.fn().mockRejectedValue(new Error('Provider error'));

      await cacheManagerInstance.warmCache(keys, dataProvider);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getLayer()', () => {
    it('should return memory layer', () => {
      const layer = cacheManagerInstance.getLayer('memory');
      expect(layer).toBeDefined();
      expect(layer?.name).toBe('memory');
    });

    it('should return local-redis layer', () => {
      const layer = cacheManagerInstance.getLayer('local-redis');
      expect(layer).toBeDefined();
      expect(layer?.name).toBe('local-redis');
    });

    it('should return undefined for non-existent layer', () => {
      const layer = cacheManagerInstance.getLayer('non-existent');
      expect(layer).toBeUndefined();
    });
  });

  describe('updateStrategy()', () => {
    it('should update cache strategy', () => {
      const newStrategy = {
        type: 'redis-first' as const,
        fallback: false,
        compression: false,
        ttl: {
          memory: 60000,
          local: 3600000,
          distributed: 86400000
        }
      };

      cacheManagerInstance.updateStrategy(newStrategy);

      const currentStrategy = (cacheManagerInstance as any).strategy;
      expect(currentStrategy.type).toBe('redis-first');
      expect(currentStrategy.fallback).toBe(false);
    });
  });
}); 