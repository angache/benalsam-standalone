import express, { Router } from 'express';
import axios from 'axios';
import logger from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router: Router = express.Router();

/**
 * Cache API Proxy Routes
 * 
 * Bu routes Cache Service'e proxy yapar
 */

const CACHE_SERVICE_URL = process.env['CACHE_SERVICE_URL'] || 'http://localhost:3014';

/**
 * Cache Service'e istek yapmak için helper function
 */
async function makeCacheServiceRequest(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  data?: any,
  req?: any
): Promise<any> {
  try {
    const url = `${CACHE_SERVICE_URL}/api/v1/cache${endpoint}`;
    
    const config = {
      method,
      url,
      ...(data && { data }),
      headers: {
        'Content-Type': 'application/json',
        ...(req?.headers.authorization && { Authorization: req.headers.authorization })
      },
      timeout: 10000
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    logger.error('Cache Service request failed:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Cache get endpoint
router.post('/get', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('POST', '/get', req.body, req);
    return res.json(result);
  } catch (error) {
    logger.error('Cache get proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache verisi alınamadı'
    });
  }
});

// Cache set endpoint
router.post('/set', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('POST', '/set', req.body, req);
    return res.json(result);
  } catch (error) {
    logger.error('Cache set proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache verisi kaydedilemedi'
    });
  }
});

// Cache delete endpoint
router.delete('/delete', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('DELETE', '/delete', req.body, req);
    return res.json(result);
  } catch (error) {
    logger.error('Cache delete proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache verisi silinemedi'
    });
  }
});

// Cache clear endpoint
router.post('/clear', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('POST', '/clear', req.body, req);
    return res.json(result);
  } catch (error) {
    logger.error('Cache clear proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache temizlenemedi'
    });
  }
});

// Cache stats endpoint
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('GET', '/stats', undefined, req);
    return res.json(result);
  } catch (error) {
    logger.error('Cache stats proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache istatistikleri alınamadı'
    });
  }
});

// Cache health check endpoint
router.get('/health', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('GET', '/health', undefined, req);
    return res.json(result);
  } catch (error) {
    logger.error('Cache health proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache sağlık kontrolü yapılamadı'
    });
  }
});

// Memory cache stats endpoint
router.get('/memory/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('GET', '/memory/stats', undefined, req);
    return res.json(result);
  } catch (error) {
    logger.error('Memory cache stats proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Memory cache istatistikleri alınamadı'
    });
  }
});

// Redis cache stats endpoint
router.get('/redis/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await makeCacheServiceRequest('GET', '/redis/stats', undefined, req);
    return res.json(result);
  } catch (error) {
    logger.error('Redis cache stats proxy error:', { error });
    return res.status(500).json({
      success: false,
      error: 'Redis cache istatistikleri alınamadı'
    });
  }
});

export { router as cacheRoutes };