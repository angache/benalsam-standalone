import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../config/logger';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const CATEGORIES_SERVICE_URL = process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3015';

/**
 * Categories Service'e proxy yapan route'lar
 * Admin Backend'ten Categories Service'e yönlendirme
 */

/**
 * Categories Service'e istek yapmak için helper function
 */
async function makeCategoriesServiceRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  params?: any
): Promise<any> {
  try {
    const url = `${CATEGORIES_SERVICE_URL}/api/v1${endpoint}`;
    
    const config = {
      method,
      url,
      ...(data && { data }),
      ...(params && { params }),
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    logger.error('Categories Service request failed:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * GET /api/v1/categories
 * Tüm kategorileri getir (tree structure)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Proxying categories request to Categories Service');
    
    const result = await makeCategoriesServiceRequest('GET', '/categories');
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying categories request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * GET /api/v1/categories/all
 * Tüm kategorileri getir (flat list) with filters and pagination
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    logger.info('Proxying all categories request to Categories Service', { query: req.query });
    
    const result = await makeCategoriesServiceRequest('GET', '/categories/all', undefined, req.query);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying all categories request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * GET /api/v1/categories/:id
 * Tek kategori getir
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Proxying category request to Categories Service', { id });
    
    const result = await makeCategoriesServiceRequest('GET', `/categories/${id}`);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying category request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * GET /api/v1/categories/path/:path
 * Path ile kategori getir
 */
router.get('/path/:path', async (req: Request, res: Response) => {
  try {
    const { path } = req.params;
    logger.info('Proxying category by path request to Categories Service', { path });
    
    const result = await makeCategoriesServiceRequest('GET', `/categories/path/${path}`);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying category by path request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * POST /api/v1/categories
 * Yeni kategori oluştur - Auth gerektirir
 */
router.post('/', ...authMiddleware({ requiredPermissions: ['categories:create'] }), async (req: Request, res: Response) => {
  try {
    logger.info('Proxying create category request to Categories Service');
    
    const result = await makeCategoriesServiceRequest('POST', '/categories', req.body);
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error proxying create category request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * PUT /api/v1/categories/:id
 * Kategori güncelle - Auth gerektirir
 */
router.put('/:id', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Proxying update category request to Categories Service', { id });
    
    const result = await makeCategoriesServiceRequest('PUT', `/categories/${id}`, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying update category request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * DELETE /api/v1/categories/:id
 * Kategori sil - Auth gerektirir
 */
router.delete('/:id', ...authMiddleware({ requiredPermissions: ['categories:delete'] }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Proxying delete category request to Categories Service', { id });
    
    const result = await makeCategoriesServiceRequest('DELETE', `/categories/${id}`);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying delete category request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * GET /api/v1/categories/:id/attributes
 * Kategori attribute'larını getir
 */
router.get('/:id/attributes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Proxying category attributes request to Categories Service', { id });
    
    const result = await makeCategoriesServiceRequest('GET', `/categories/${id}/attributes`);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying category attributes request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * POST /api/v1/categories/:id/attributes
 * Kategori attribute'ı oluştur - Auth gerektirir
 */
router.post('/:id/attributes', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Proxying create category attribute request to Categories Service', { id });
    
    const result = await makeCategoriesServiceRequest('POST', `/categories/${id}/attributes`, req.body);
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error proxying create category attribute request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * PUT /api/v1/categories/:id/attributes/:attributeId
 * Kategori attribute'ı güncelle - Auth gerektirir
 */
router.put('/:id/attributes/:attributeId', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: Request, res: Response) => {
  try {
    const { id, attributeId } = req.params;
    logger.info('Proxying update category attribute request to Categories Service', { id, attributeId });
    
    const result = await makeCategoriesServiceRequest('PUT', `/categories/${id}/attributes/${attributeId}`, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying update category attribute request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * DELETE /api/v1/categories/:id/attributes/:attributeId
 * Kategori attribute'ı sil - Auth gerektirir
 */
router.delete('/:id/attributes/:attributeId', ...authMiddleware({ requiredPermissions: ['categories:edit'] }), async (req: Request, res: Response) => {
  try {
    const { id, attributeId } = req.params;
    logger.info('Proxying delete category attribute request to Categories Service', { id, attributeId });
    
    const result = await makeCategoriesServiceRequest('DELETE', `/categories/${id}/attributes/${attributeId}`);
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying delete category attribute request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

/**
 * GET /api/v1/categories/stats
 * Kategori istatistiklerini getir
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    logger.info('Proxying category stats request to Categories Service');
    
    const result = await makeCategoriesServiceRequest('GET', '/categories/stats');
    
    res.json(result);
  } catch (error) {
    logger.error('Error proxying category stats request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Categories Service is unavailable'
    });
  }
});

export default router;
