import { Router, IRouter } from 'express';
import { ElasticsearchController } from '../controllers/elasticsearchController';
import { Request, Response, NextFunction } from 'express';

const router: IRouter = Router();
const elasticsearchController = new ElasticsearchController();

// Health & Status Routes
router.get('/health', (req, res) => elasticsearchController.getHealth(req, res));
router.get('/health-check', (req, res) => elasticsearchController.getHealthCheck(req, res));
router.get('/stats', (req, res) => elasticsearchController.getIndexStats(req, res));

// Connection Test Routes
router.get('/test-connection', (req, res) => elasticsearchController.testConnection(req, res));
router.get('/test-redis', (req, res) => elasticsearchController.testRedisConnection(req, res));

// Search Routes
router.post('/search', (req, res) => elasticsearchController.searchListings(req, res));
router.get('/search', (req, res) => elasticsearchController.searchIndex(req, res));

// Category Counts Route
router.get('/category-counts', (req, res) => elasticsearchController.getCategoryCounts(req, res));
router.post('/category-counts/invalidate', (req, res) => elasticsearchController.invalidateCategoryCountsCache(req, res));

// Sync Management Routes
router.get('/sync/status', (req, res) => elasticsearchController.getSyncStatus(req, res));
router.get('/sync/config', (req, res) => elasticsearchController.getSyncConfig(req, res));
router.post('/sync/config', (req, res) => elasticsearchController.updateSyncConfig(req, res));
router.post('/sync/trigger', (req, res) => elasticsearchController.triggerManualSync(req, res));

// Queue Management Routes
router.get('/queue/stats', (req, res) => elasticsearchController.getQueueStats(req, res));
router.post('/queue/retry-failed', (req, res) => elasticsearchController.retryFailedJobs(req, res));
router.post('/queue/clear', (req, res) => elasticsearchController.clearQueue(req, res));

// Development-only middleware for dangerous operations
const developmentOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      message: 'Debug endpoints are not available in production'
    });
    return;
  }
  next();
};

// Debug Routes (Development Only)
router.post('/debug/clear-cache', developmentOnly, (req, res) => elasticsearchController.clearSearchCache(req, res));
router.post('/debug/clear-all-listings', developmentOnly, (req, res) => elasticsearchController.clearAllListings(req, res));

// Index Management Routes
router.post('/create-index', (req, res) => elasticsearchController.createIndex(req, res));
router.delete('/delete-index', (req, res) => elasticsearchController.deleteIndex(req, res));
router.post('/reindex', (req, res) => elasticsearchController.reindexAll(req, res));

export default router; 