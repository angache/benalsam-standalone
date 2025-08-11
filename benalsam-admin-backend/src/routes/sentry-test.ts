import { Router } from 'express';
import { captureMessage, captureException, setUser, addBreadcrumb } from '../config/sentry';
import logger from '../config/logger';

const router = Router();

// Test Sentry message capture
router.get('/test-message', (req, res) => {
  captureMessage('Test message from Sentry test route', 'info', {
    route: '/api/v1/sentry-test/test-message',
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Test message sent to Sentry',
    timestamp: new Date().toISOString()
  });
});

// Test Sentry exception capture
router.get('/test-exception', (req, res) => {
  try {
    // Simulate an error
    throw new Error('Test exception for Sentry');
  } catch (error) {
    captureException(error as Error, {
      route: '/api/v1/sentry-test/test-exception',
      test: true
    });

    res.status(500).json({
      success: false,
      message: 'Test exception captured in Sentry',
      timestamp: new Date().toISOString()
    });
  }
});

// Test Sentry user context
router.get('/test-user', (req, res) => {
  // Set user context
  setUser({
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'admin'
  });

  // Add breadcrumb
  addBreadcrumb({
    category: 'test',
    message: 'User context test',
    level: 'info',
    data: {
      route: '/api/v1/sentry-test/test-user'
    }
  });

  captureMessage('User context test completed', 'info');

  res.json({
    success: true,
    message: 'User context set in Sentry',
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'admin'
    },
    timestamp: new Date().toISOString()
  });
});

// Test Sentry performance monitoring
router.get('/test-performance', async (req, res) => {
  const startTime = Date.now();

  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));

  const duration = Date.now() - startTime;

  captureMessage('Performance test completed', 'info', {
    duration,
    route: '/api/v1/sentry-test/test-performance'
  });

  res.json({
    success: true,
    message: 'Performance test completed',
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
});

// Test Sentry with different error types
router.get('/test-error-types', (req, res) => {
  const errorType = req.query.type as string;

  switch (errorType) {
    case 'validation':
      captureMessage('Validation error test', 'warning', {
        field: 'email',
        value: 'invalid-email'
      });
      break;

    case 'database':
      captureException(new Error('Database connection failed'), {
        service: 'postgresql',
        operation: 'select'
      });
      break;

    case 'network':
      captureException(new Error('Network timeout'), {
        url: 'https://api.example.com',
        timeout: 5000
      });
      break;

    default:
      captureMessage('Unknown error type test', 'error', {
        requestedType: errorType
      });
  }

  res.json({
    success: true,
    message: `Error type test completed: ${errorType}`,
    timestamp: new Date().toISOString()
  });
});

// Generate a real test error for Sentry Dashboard
router.post('/generate-error', (req, res) => {
  try {
    const { errorType = 'TestError', message = 'This is a test error' } = req.body;
    
    // Create a real error
    const testError = new Error(message);
    testError.name = errorType;
    
    // Capture in Sentry
    captureException(testError, {
      tags: {
        errorType,
        test: 'true',
        generated: 'true'
      },
      extra: {
        requestBody: req.body,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`🧪 Generated test error: ${errorType} - ${message}`);

    res.json({
      success: true,
      message: 'Test error generated and captured',
      error: {
        type: errorType,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Error generating test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
