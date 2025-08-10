import { Router, IRouter } from 'express';
import { ElasticsearchController } from '../controllers/elasticsearchController';

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

// Sync Management Routes
router.get('/sync/status', (req, res) => elasticsearchController.getSyncStatus(req, res));
router.get('/sync/config', (req, res) => elasticsearchController.getSyncConfig(req, res));
router.post('/sync/config', (req, res) => elasticsearchController.updateSyncConfig(req, res));
router.post('/sync/trigger', (req, res) => elasticsearchController.triggerManualSync(req, res));

// Queue Management Routes
router.get('/queue/stats', (req, res) => elasticsearchController.getQueueStats(req, res));
router.post('/queue/retry-failed', (req, res) => elasticsearchController.retryFailedJobs(req, res));
router.post('/queue/clear', (req, res) => elasticsearchController.clearQueue(req, res));

// Index Management Routes
router.post('/create-index', (req, res) => elasticsearchController.createIndex(req, res));
router.post('/reindex', (req, res) => elasticsearchController.reindexAll(req, res));

export default router; 