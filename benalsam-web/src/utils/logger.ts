// Structured Logging System
// Enterprise-grade logging with context, levels, and external service integration

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext extends Record<string, unknown> {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  environment: string;
  version: string;
  userAgent?: string;
  url?: string;
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableExternalService: boolean;
  enableLocalStorage: boolean;
  maxLocalStorageEntries: number;
  enablePerformanceLogging: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableExternalService: import.meta.env.MODE === 'production',
  enableLocalStorage: import.meta.env.MODE === 'development',
  maxLocalStorageEntries: 1000,
  enablePerformanceLogging: true
};

// Structured Logger Class
export class StructuredLogger {
  private static instance: StructuredLogger;
  private config: LoggerConfig;
  private logHistory: LogEntry[] = [];
  private performanceMarks: Map<string, number> = new Map();

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<LoggerConfig>): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger(config);
    }
    return StructuredLogger.instance;
  }

  /**
   * Configure logger
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log debug message
   */
  public debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  public error(message: string, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log critical message
   */
  public critical(message: string, context: LogContext = {}): void {
    this.log(LogLevel.CRITICAL, message, context);
  }

  /**
   * Main logging method
   */
  private log(level: LogLevel, message: string, context: LogContext): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    // Create log entry
    const logEntry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: context.timestamp || new Date()
      },
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in history
    this.addToHistory(logEntry);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // External service logging
    if (this.config.enableExternalService) {
      this.logToExternalService(logEntry);
    }

    // Local storage logging (development)
    if (this.config.enableLocalStorage) {
      this.logToLocalStorage(logEntry);
    }
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentLevelIndex = levels.indexOf(this.config.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, timestamp } = entry;
    const contextStr = this.formatContext(context);
    const timeStr = new Date(timestamp).toLocaleTimeString();

    const logMessage = `[${timeStr}] ${level.toUpperCase()}: ${message}${contextStr}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`🐛 ${logMessage}`, context);
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${logMessage}`, context);
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${logMessage}`, context);
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${logMessage}`, context);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 ${logMessage}`, context);
        break;
    }
  }

  /**
   * Log to external service (Sentry, etc.)
   */
  private logToExternalService(entry: LogEntry): void {
    // TODO: Implement Sentry or other external service integration
    // For now, just log to console in production
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      console.log('📊 External service log:', {
        level: entry.level,
        message: entry.message,
        context: entry.context
      });
    }
  }

  /**
   * Log to local storage (development only)
   */
  private logToLocalStorage(entry: LogEntry): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      const newLogs = [...existingLogs, entry].slice(-this.config.maxLocalStorageEntries);
      localStorage.setItem('app_logs', JSON.stringify(newLogs));
    } catch (error) {
      console.warn('Failed to log to localStorage:', error);
    }
  }

  /**
   * Format context for display
   */
  private formatContext(context: LogContext): string {
    const parts: string[] = [];
    
    if (context.component) parts.push(`[${context.component}]`);
    if (context.action) parts.push(`[${context.action}]`);
    if (context.userId) parts.push(`[user:${context.userId}]`);
    if (context.sessionId) parts.push(`[session:${context.sessionId}]`);
    
    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
  }

  /**
   * Add to log history
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    
    // Keep only recent logs
    if (this.logHistory.length > this.config.maxLocalStorageEntries) {
      this.logHistory = this.logHistory.slice(-this.config.maxLocalStorageEntries);
    }
  }

  /**
   * Performance logging
   */
  public startPerformanceMark(name: string): void {
    if (this.config.enablePerformanceLogging) {
      this.performanceMarks.set(name, performance.now());
    }
  }

  public endPerformanceMark(name: string, context: LogContext = {}): void {
    if (this.config.enablePerformanceLogging) {
      const startTime = this.performanceMarks.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        this.info(`Performance: ${name}`, {
          ...context,
          metadata: {
            ...context.metadata,
            duration: `${duration.toFixed(2)}ms`
          }
        });
        this.performanceMarks.delete(name);
      }
    }
  }

  /**
   * Get log history
   */
  public getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  public clearLogHistory(): void {
    this.logHistory = [];
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('app_logs');
    }
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logHistory.filter(entry => entry.level === level);
  }

  /**
   * Get logs by component
   */
  public getLogsByComponent(component: string): LogEntry[] {
    return this.logHistory.filter(entry => entry.context.component === component);
  }
}

// Export singleton instance
export const logger = StructuredLogger.getInstance();

// Convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, context?: LogContext) => logger.error(message, context);
export const logCritical = (message: string, context?: LogContext) => logger.critical(message, context);

// Performance logging helpers
export const startPerformanceMark = (name: string) => logger.startPerformanceMark(name);
export const endPerformanceMark = (name: string, context?: LogContext) => logger.endPerformanceMark(name, context);

// Legacy console.log replacement
export const log = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  critical: logCritical
};

// Export types
export type { LogContext, LogEntry };
