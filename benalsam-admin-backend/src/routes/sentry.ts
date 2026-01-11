import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';
import { getSentryApiService } from '../services/sentryApi';

const router = Router();

// Get Sentry metrics overview
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Get Sentry API service
    const sentryApi = getSentryApiService();
    const metrics = await sentryApi.getMetrics(timeRange as string);

    logger.info('📊 Sentry metrics requested', {
      timeRange,
      errorRate: metrics.errorRate,
      totalErrors: metrics.totalErrors
    });

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting Sentry metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get Sentry metrics',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error && error.message.includes('configuration') ? 'Check environment variables (SENTRY_ORG_SLUG, SENTRY_PROJECT_SLUG, SENTRY_AUTH_TOKEN)' : undefined
    });
  }
});

// Get Sentry errors
router.get('/errors', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Get Sentry API service
    const sentryApi = getSentryApiService();
    const errors = await sentryApi.getErrors(timeRange as string);

    logger.info('📊 Sentry errors requested', {
      timeRange,
      errorCount: errors.length
    });

    res.json({
      success: true,
      data: errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting Sentry errors:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get Sentry errors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Sentry performance data
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Get Sentry API service
    const sentryApi = getSentryApiService();
    const performance = await sentryApi.getPerformance(timeRange as string);

    logger.info('📊 Sentry performance requested', {
      timeRange,
      transactionCount: performance.length
    });

    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting Sentry performance:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get Sentry performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Sentry releases
router.get('/releases', authenticateToken, async (req, res) => {
  try {
    // Get Sentry API service
    const sentryApi = getSentryApiService();
    const releases = await sentryApi.getReleases();

    logger.info('📊 Sentry releases requested', {
      releaseCount: releases.length
    });

    res.json({
      success: true,
      data: releases,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting Sentry releases:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get Sentry releases',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
