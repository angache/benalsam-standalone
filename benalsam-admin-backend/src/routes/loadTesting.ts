import express from 'express';
import LoadTestingService, { LoadTestConfig, PerformanceBaseline } from '../services/loadTestingService';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';

const router: express.Router = express.Router();
const loadTestingService = new LoadTestingService();

// Initialize load testing indexes
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const success = await loadTestingService.initializeIndexes();
    res.json({
      success,
      message: success ? 'Load testing indexes initialized successfully' : 'Failed to initialize load testing indexes'
    });
  } catch (error) {
    logger.error('Failed to initialize load testing indexes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize load testing indexes'
    });
  }
});

// Run load test
router.post('/run', authenticateToken, async (req, res) => {
  try {
    const config: LoadTestConfig = req.body;
    
    // Validate config
    if (!config.concurrentUsers || !config.duration || !config.targetUrl || !config.endpoints) {
      return res.status(400).json({
        success: false,
        error: 'Missing required configuration parameters'
      });
    }

    // Check if test is already running
    if (loadTestingService.isTestRunning()) {
      return res.status(409).json({
        success: false,
        error: 'Load test already running'
      });
    }

    const result = await loadTestingService.runLoadTest(config);
    return res.json({
      success: true,
      data: result,
      message: 'Load test completed successfully'
    });
  } catch (error) {
    logger.error('Failed to run load test:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to run load test'
    });
  }
});

// Get load test results
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.query;
    const results = await loadTestingService.getLoadTestResults(testId as string);
    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Failed to get load test results:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get load test results'
    });
  }
});

// Create performance baseline
router.post('/baseline', authenticateToken, async (req, res) => {
  try {
    const thresholds = req.body.thresholds;
    
    if (!thresholds || !thresholds.maxResponseTime || !thresholds.maxErrorRate || !thresholds.minRequestsPerSecond) {
      return res.status(400).json({
        success: false,
        error: 'Missing required threshold parameters'
      });
    }

    const baseline = await loadTestingService.createPerformanceBaseline(thresholds);
    return res.json({
      success: true,
      data: baseline,
      message: 'Performance baseline created successfully'
    });
  } catch (error) {
    logger.error('Failed to create performance baseline:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create performance baseline'
    });
  }
});

// Compare test with baseline
router.post('/compare', authenticateToken, async (req, res) => {
  try {
    const { testId, baselineId } = req.body;
    
    if (!testId || !baselineId) {
      return res.status(400).json({
        success: false,
        error: 'Missing testId or baselineId'
      });
    }

    // Get test result
    const testResults = await loadTestingService.getLoadTestResults(testId);
    if (testResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
    }

    const testResult = testResults[0];
    const comparison = await loadTestingService.compareWithBaseline(testResult, baselineId);
    
    return res.json({
      success: true,
      data: comparison,
      message: 'Performance comparison completed'
    });
  } catch (error) {
    logger.error('Failed to compare with baseline:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to compare with baseline'
    });
  }
});

// Stop all tests
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    loadTestingService.stopAllTests();
    return res.json({
      success: true,
      message: 'All load tests stopped'
    });
  } catch (error) {
    logger.error('Failed to stop load tests:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop load tests'
    });
  }
});

// Get test status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const isRunning = loadTestingService.isTestRunning();
    return res.json({
      success: true,
      data: {
        isRunning
      }
    });
  } catch (error) {
    logger.error('Failed to get test status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get test status'
    });
  }
});

export default router; 