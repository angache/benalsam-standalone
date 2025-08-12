import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';
import { getErrorStatistics, ErrorSeverity, ErrorCategory } from '../config/errorClassification';

const router = Router();

// Get hybrid monitoring overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Get error statistics
    const errorStats = getErrorStatistics();
    
    // Mock data for now - in production this would fetch from both systems
    const hybridOverview = {
      timestamp: new Date().toISOString(),
      timeRange,
      summary: {
        totalErrors: errorStats.total,
        criticalErrors: errorStats.bySeverity[ErrorSeverity.CRITICAL],
        highErrors: errorStats.bySeverity[ErrorSeverity.HIGH],
        mediumErrors: errorStats.bySeverity[ErrorSeverity.MEDIUM],
        lowErrors: errorStats.bySeverity[ErrorSeverity.LOW],
        sentryErrors: errorStats.sentryCount,
        localErrors: errorStats.localCount
      },
      systemHealth: {
        overall: 'healthy',
        sentry: 'healthy',
        local: 'healthy',
        database: 'healthy',
        redis: 'healthy',
        elasticsearch: 'healthy'
      },
      performance: {
        avgResponseTime: 245,
        errorRate: 0.2,
        throughput: 1250,
        uptime: 99.9
      },
      alerts: {
        active: 0,
        critical: 0,
        warning: 0,
        info: 0
      }
    };

    logger.info('📊 Hybrid monitoring overview requested', {
      timeRange,
      totalErrors: hybridOverview.summary.totalErrors,
      sentryErrors: hybridOverview.summary.sentryErrors,
      localErrors: hybridOverview.summary.localErrors
    });

    res.json({
      success: true,
      data: hybridOverview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting hybrid monitoring overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hybrid monitoring overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get error classification breakdown
router.get('/error-breakdown', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const errorStats = getErrorStatistics();
    
    const breakdown = {
      timestamp: new Date().toISOString(),
      timeRange,
      bySeverity: {
        critical: {
          count: errorStats.bySeverity[ErrorSeverity.CRITICAL],
          percentage: 0,
          sentToSentry: errorStats.bySeverity[ErrorSeverity.CRITICAL],
          sentToLocal: 0
        },
        high: {
          count: errorStats.bySeverity[ErrorSeverity.HIGH],
          percentage: 0,
          sentToSentry: errorStats.bySeverity[ErrorSeverity.HIGH],
          sentToLocal: 0
        },
        medium: {
          count: errorStats.bySeverity[ErrorSeverity.MEDIUM],
          percentage: 0,
          sentToSentry: 0,
          sentToLocal: errorStats.bySeverity[ErrorSeverity.MEDIUM]
        },
        low: {
          count: errorStats.bySeverity[ErrorSeverity.LOW],
          percentage: 0,
          sentToSentry: 0,
          sentToLocal: errorStats.bySeverity[ErrorSeverity.LOW]
        }
      },
      byCategory: {
        payment: {
          count: errorStats.byCategory[ErrorCategory.PAYMENT],
          severity: ErrorSeverity.CRITICAL,
          destination: 'sentry'
        },
        authentication: {
          count: errorStats.byCategory[ErrorCategory.AUTHENTICATION],
          severity: ErrorSeverity.CRITICAL,
          destination: 'sentry'
        },
        database: {
          count: errorStats.byCategory[ErrorCategory.DATABASE],
          severity: ErrorSeverity.HIGH,
          destination: 'sentry'
        },
        api: {
          count: errorStats.byCategory[ErrorCategory.API],
          severity: ErrorSeverity.HIGH,
          destination: 'sentry'
        },
        network: {
          count: errorStats.byCategory[ErrorCategory.NETWORK],
          severity: ErrorSeverity.MEDIUM,
          destination: 'local'
        },
        cache: {
          count: errorStats.byCategory[ErrorCategory.CACHE],
          severity: ErrorSeverity.MEDIUM,
          destination: 'local'
        },
        analytics: {
          count: errorStats.byCategory[ErrorCategory.ANALYTICS],
          severity: ErrorSeverity.LOW,
          destination: 'local'
        },
        ui: {
          count: errorStats.byCategory[ErrorCategory.UI],
          severity: ErrorSeverity.LOW,
          destination: 'local'
        }
      }
    };

    // Calculate percentages
    const total = errorStats.total || 1;
    Object.keys(breakdown.bySeverity).forEach(severity => {
      const key = severity as keyof typeof breakdown.bySeverity;
      breakdown.bySeverity[key].percentage = (breakdown.bySeverity[key].count / total) * 100;
    });

    logger.info('📊 Error breakdown requested', {
      timeRange,
      totalErrors: errorStats.total,
      breakdown: breakdown.bySeverity
    });

    res.json({
      success: true,
      data: breakdown,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting error breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get error breakdown',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get cost analysis
router.get('/cost-analysis', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const errorStats = getErrorStatistics();
    
    // Cost analysis based on Sentry pricing
    const sentryErrors = errorStats.sentryCount;
    const localErrors = errorStats.localCount;
    
    // Sentry pricing: $26/month for 100K errors
    const sentryCostPerError = 26 / 100000; // $0.00026 per error
    const monthlySentryCost = sentryErrors * sentryCostPerError * 30; // 30 days
    const localCost = 0; // Our system is free
    
    const costAnalysis = {
      timestamp: new Date().toISOString(),
      timeRange,
      current: {
        sentryErrors,
        localErrors,
        totalErrors: sentryErrors + localErrors,
        sentryCost: monthlySentryCost,
        localCost,
        totalCost: monthlySentryCost + localCost
      },
      optimization: {
        potentialSentryErrors: Math.floor(sentryErrors * 0.3), // 70% reduction
        potentialLocalErrors: localErrors + Math.floor(sentryErrors * 0.7),
        potentialSentryCost: Math.floor(sentryErrors * 0.3) * sentryCostPerError * 30,
        potentialLocalCost: 0,
        potentialTotalCost: Math.floor(sentryErrors * 0.3) * sentryCostPerError * 30,
        savings: monthlySentryCost - (Math.floor(sentryErrors * 0.3) * sentryCostPerError * 30),
        savingsPercentage: ((monthlySentryCost - (Math.floor(sentryErrors * 0.3) * sentryCostPerError * 30)) / monthlySentryCost) * 100
      },
      recommendations: [
        'Critical and high severity errors should go to Sentry',
        'Medium and low severity errors should stay in local system',
        'Implement error classification rules for automatic routing',
        'Monitor cost savings monthly'
      ]
    };

    logger.info('💰 Cost analysis requested', {
      timeRange,
      currentCost: costAnalysis.current.totalCost,
      potentialSavings: costAnalysis.optimization.savings,
      savingsPercentage: costAnalysis.optimization.savingsPercentage
    });

    res.json({
      success: true,
      data: costAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cost analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test error classification
router.post('/test-classification', authenticateToken, async (req, res) => {
  try {
    const { errorMessage, errorType, context } = req.body;
    
    // Import the classification function
    const { classifyError } = await import('../config/errorClassification');
    
    // Create a test error
    const testError = new Error(errorMessage || 'Test error message');
    testError.stack = context?.stack || testError.stack;
    
    // Classify the error
    const classification = classifyError(testError, context);
    
    const testResult = {
      timestamp: new Date().toISOString(),
      input: {
        errorMessage: errorMessage || 'Test error message',
        errorType,
        context
      },
      classification,
      recommendation: {
        shouldSendToSentry: classification.shouldSendToSentry,
        shouldSendToLocal: classification.shouldSendToLocal,
        reasoning: `Error classified as ${classification.severity} severity in ${classification.category} category`
      }
    };

    logger.info('🧪 Error classification test', {
      errorMessage: testResult.input.errorMessage,
      classification: testResult.classification,
      recommendation: testResult.recommendation
    });

    res.json({
      success: true,
      data: testResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error testing classification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test error classification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system comparison
router.get('/system-comparison', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const comparison = {
      timestamp: new Date().toISOString(),
      timeRange,
      sentry: {
        features: [
          'Advanced error tracking',
          'Performance monitoring',
          'Release tracking',
          'Team collaboration',
          'Real-time alerts',
          'Error analytics',
          'Mobile support',
          'Integration ecosystem'
        ],
        pros: [
          'Production-tested',
          'Advanced features',
          'Team collaboration',
          'Mobile support',
          'Integration ecosystem'
        ],
        cons: [
          'Costly',
          '3rd party dependency',
          'Data privacy concerns',
          'Limited customization'
        ],
        cost: '$26/month (100K errors)',
        bestFor: 'Critical errors, performance monitoring, team collaboration'
      },
      local: {
        features: [
          'Basic error tracking',
          'System monitoring',
          'Health checks',
          'Cache monitoring',
          'Analytics',
          'Custom alerts'
        ],
        pros: [
          'Free',
          'Full control',
          'Data privacy',
          'Customizable',
          'No dependency'
        ],
        cons: [
          'Limited features',
          'Development time',
          'Maintenance required',
          'No mobile support'
        ],
        cost: '$0/month',
        bestFor: 'Basic monitoring, business metrics, custom analytics'
      },
      hybrid: {
        features: [
          'Critical errors → Sentry',
          'Basic monitoring → Local',
          'Cost optimization',
          'Risk management',
          'Best of both worlds'
        ],
        pros: [
          'Cost optimized',
          'Risk minimized',
          'Feature optimized',
          'Scalable'
        ],
        cons: [
          'Complex setup',
          'Dual maintenance',
          'Integration complexity'
        ],
        cost: '$8/month (estimated)',
        bestFor: 'Balanced approach, cost-conscious, feature-rich'
      }
    };

    logger.info('📊 System comparison requested', {
      timeRange,
      systems: ['sentry', 'local', 'hybrid']
    });

    res.json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error getting system comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system comparison',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
