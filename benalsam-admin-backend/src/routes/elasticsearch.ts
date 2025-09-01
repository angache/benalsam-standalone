import { Router } from 'express';
import { elasticsearchController } from '../controllers/elasticsearchController';

const router = Router();

// Get all indices
router.get('/indices', elasticsearchController.getIndices);

// Search documents in an index
router.get('/search/:index', elasticsearchController.searchDocuments);

// Get document by ID
router.get('/document/:index/:id', elasticsearchController.getDocument);

// Get index statistics
router.get('/stats/:index', elasticsearchController.getIndexStats);

// Reindex an index
router.post('/reindex/:index', elasticsearchController.reindex);

// Delete an index
router.delete('/index/:index', elasticsearchController.deleteIndex);

export default router; 