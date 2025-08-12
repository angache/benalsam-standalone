import { captureException } from './sentry';
import logger from './logger';

// Error severity levels
export enum ErrorSeverity {
  CRITICAL = 'critical',    // → Sentry (Payment, Auth, Security)
  HIGH = 'high',           // → Sentry (Database, API failures)
  MEDIUM = 'medium',       // → Mevcut sistem (Business logic)
  LOW = 'low'              // → Mevcut sistem (UI, minor issues)
}

// Error categories for classification
export enum ErrorCategory {
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  API = 'api',
  SECURITY = 'security',
  BUSINESS_LOGIC = 'business_logic',
  UI = 'ui',
  NETWORK = 'network',
  CACHE = 'cache',
  ANALYTICS = 'analytics'
}

// Error classification rules
export interface ErrorClassificationRule {
  pattern: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  description: string;
}

// Classification rules
export const ERROR_CLASSIFICATION_RULES: ErrorClassificationRule[] = [
  // Critical errors - Sentry
  {
    pattern: 'payment|stripe|billing|subscription',
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.PAYMENT,
    description: 'Payment related errors'
  },
  {
    pattern: 'authentication|auth|jwt|token|login|session',
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.AUTHENTICATION,
    description: 'Authentication related errors'
  },
  {
    pattern: 'security|unauthorized|forbidden|hack|breach',
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.SECURITY,
    description: 'Security related errors'
  },
  {
    pattern: 'database|postgres|supabase|connection|query',
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.DATABASE,
    description: 'Database related errors'
  },
  {
    pattern: 'api|endpoint|route|server|500|502|503|http|rest',
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.API,
    description: 'API related errors'
  },
  {
    pattern: 'network|timeout|connection|fetch|axios',
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.NETWORK,
    description: 'Network related errors'
  },
  {
    pattern: 'cache|redis|memory|storage',
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.CACHE,
    description: 'Cache related errors'
  },
  {
    pattern: 'ui|component|render|display|view|dashboard|react|vue|angular|frontend',
    severity: ErrorSeverity.LOW,
    category: ErrorCategory.UI,
    description: 'UI related errors'
  },
  {
    pattern: 'analytics|tracking|metrics|monitoring',
    severity: ErrorSeverity.LOW,
    category: ErrorCategory.ANALYTICS,
    description: 'Analytics related errors'
  }
];

// Error classification result
export interface ErrorClassificationResult {
  severity: ErrorSeverity;
  category: ErrorCategory;
  shouldSendToSentry: boolean;
  shouldSendToLocal: boolean;
  description: string;
}

// Classify error based on message and context
export function classifyError(
  error: Error | string,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    userAgent?: string;
    ip?: string;
  }
): ErrorClassificationResult {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? '' : error.stack || '';
  const fullErrorText = `${errorMessage} ${errorStack}`.toLowerCase();

  // Check classification rules
  for (const rule of ERROR_CLASSIFICATION_RULES) {
    const pattern = rule.pattern.toLowerCase();
    const patterns = pattern.split('|');
    const matches = patterns.some(p => fullErrorText.includes(p));
    
    if (matches) {
      const shouldSendToSentry = rule.severity === ErrorSeverity.CRITICAL || rule.severity === ErrorSeverity.HIGH;
      const shouldSendToLocal = rule.severity === ErrorSeverity.MEDIUM || rule.severity === ErrorSeverity.LOW;

      return {
        severity: rule.severity,
        category: rule.category,
        shouldSendToSentry,
        shouldSendToLocal,
        description: rule.description
      };
    }
  }

  // Default classification for unknown errors
  const defaultClassification: ErrorClassificationResult = {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.BUSINESS_LOGIC,
    shouldSendToSentry: false,
    shouldSendToLocal: true,
    description: 'Unknown error type'
  };

  // If error contains HTTP status codes, classify accordingly
  if (fullErrorText.includes('500') || fullErrorText.includes('502') || fullErrorText.includes('503')) {
    defaultClassification.severity = ErrorSeverity.HIGH;
    defaultClassification.category = ErrorCategory.API;
    defaultClassification.shouldSendToSentry = true;
    defaultClassification.shouldSendToLocal = true;
    defaultClassification.description = 'Server error (5xx)';
  }

  return defaultClassification;
}

// Hybrid error handler
export function handleErrorHybrid(
  error: Error | string,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    userAgent?: string;
    ip?: string;
  }
): void {
  const classification = classifyError(error, context);
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Log classification result
  logger.info('🔍 Error classification result', {
    error: errorMessage,
    classification,
    context
  });

  // Send to Sentry if needed
  if (classification.shouldSendToSentry) {
    try {
      if (typeof error === 'string') {
        captureException(new Error(error), {
          tags: {
            severity: classification.severity,
            category: classification.category,
            endpoint: context?.endpoint,
            method: context?.method
          },
          extra: {
            context,
            classification
          }
        });
      } else {
        captureException(error, {
          tags: {
            severity: classification.severity,
            category: classification.category,
            endpoint: context?.endpoint,
            method: context?.method
          },
          extra: {
            context,
            classification
          }
        });
      }

      logger.info('✅ Error sent to Sentry', {
        error: errorMessage,
        severity: classification.severity,
        category: classification.category
      });
    } catch (sentryError) {
      logger.error('❌ Failed to send error to Sentry', {
        originalError: errorMessage,
        sentryError: sentryError instanceof Error ? sentryError.message : sentryError
      });
    }
  }

  // Send to local monitoring if needed
  if (classification.shouldSendToLocal) {
    try {
      // Add to local error tracking
      logger.error('📊 Error tracked locally', {
        error: errorMessage,
        severity: classification.severity,
        category: classification.category,
        context
      });

      // TODO: Add to local error database/storage
      // This will be implemented in the next phase
    } catch (localError) {
      logger.error('❌ Failed to track error locally', {
        originalError: errorMessage,
        localError: localError instanceof Error ? localError.message : localError
      });
    }
  }
}

// Error statistics
export interface ErrorStatistics {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  sentryCount: number;
  localCount: number;
}

// Get error statistics
export function getErrorStatistics(): ErrorStatistics {
  // TODO: Implement error statistics tracking
  // This will be implemented in the next phase
  return {
    total: 0,
    bySeverity: {
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.LOW]: 0
    },
    byCategory: {
      [ErrorCategory.PAYMENT]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.DATABASE]: 0,
      [ErrorCategory.API]: 0,
      [ErrorCategory.SECURITY]: 0,
      [ErrorCategory.BUSINESS_LOGIC]: 0,
      [ErrorCategory.UI]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.CACHE]: 0,
      [ErrorCategory.ANALYTICS]: 0
    },
    sentryCount: 0,
    localCount: 0
  };
}
