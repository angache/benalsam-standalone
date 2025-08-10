import { Router, IRouter } from 'express';
import { listingsController } from '../controllers/listingsController';
import { authenticateToken } from '../middleware/auth';

const router: IRouter = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get all listings with filters
router.get('/', listingsController.getListings);

// Get single listing
router.get('/:id', listingsController.getListing);

// Update listing
router.put('/:id', listingsController.updateListing);

// Delete listing
router.delete('/:id', listingsController.deleteListing);

// Moderate listing (approve/reject)
router.post('/:id/moderate', listingsController.moderateListing);

// Re-evaluate listing (move active listing back to pending)
router.post('/:id/re-evaluate', listingsController.reEvaluateListing);

export { router as listingsRouter }; 