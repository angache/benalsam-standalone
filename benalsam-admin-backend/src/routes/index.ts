import { Router, IRouter } from 'express';
import authRoutes from './auth';
import { listingsRouter } from './listings';
import { testListingsRouter } from './testListings';
import { categoriesRouter } from './categories';
import { usersRouter } from './users';
import adminManagementRoutes from './admin-management';
import searchRoutes from './search';
import elasticsearchRoutes from './elasticsearch';
import healthRoutes from './health';
import monitoringRoutes from './monitoring';
import twoFactorRouter from './twoFactor';
import trendAnalysisRoutes from './trendAnalysis';
import aiSuggestionsRoutes from './aiSuggestions';

const router: IRouter = Router();

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check routes
router.use('/health', healthRoutes);

// Monitoring routes
router.use('/monitoring', monitoringRoutes);

// Auth routes
router.use('/auth', authRoutes);

// 2FA routes
router.use('/2fa', twoFactorRouter);

// Test Listings routes (no auth required)
router.use('/test-listings', testListingsRouter);

// Listings routes
router.use('/listings', listingsRouter);

// Categories routes
router.use('/categories', categoriesRouter);

// Users routes
router.use('/users', usersRouter);

// Admin Management routes
router.use('/admin-management', adminManagementRoutes);

// Search routes
router.use('/search', searchRoutes);

// Elasticsearch routes
router.use('/elasticsearch', elasticsearchRoutes);

// Trend Analysis routes
router.use('/trends', trendAnalysisRoutes);

// AI Suggestions routes
router.use('/ai-suggestions', aiSuggestionsRoutes);

router.get('/reports', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Reports module not implemented yet',
    error: 'NOT_IMPLEMENTED',
  });
});

router.get('/analytics', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Analytics module not implemented yet',
    error: 'NOT_IMPLEMENTED',
  });
});

router.get('/system', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'System module not implemented yet',
    error: 'NOT_IMPLEMENTED',
  });
});

export default router; 