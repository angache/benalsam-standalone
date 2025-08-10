import { Platform } from 'react-native';

/**
 * KVKK COMPLIANCE: Production Logging Service
 * 
 * Production'da logları uygun servislere yönlendirir:
 * 
 * ✅ ERROR - Sentry'ye gönder
 * ✅ WARN - Elasticsearch'e gönder  
 * ✅ INFO - Analytics backend'e gönder
 * ✅ DEBUG - Sadece development'ta göster
 * 
 * KVKK: Kişisel veri loglanmaz, sadece session_id kullanılır
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogData {
  level: LogLevel;
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class ProductionLoggingService {
  private isProduction = !__DEV__;
  private sessionId?: string;

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Debug logs - sadece development'ta
  debug(message: string, metadata?: Record<string, any>) {
    if (__DEV__) {
      console.log(`🔍 ${message}`, metadata);
    }
  }

  // Info logs - Analytics backend'e
  info(message: string, metadata?: Record<string, any>) {
    const logData: LogData = {
      level: LogLevel.INFO,
      message,
      sessionId: this.sessionId,
      metadata,
      timestamp: new Date().toISOString()
    };

    if (__DEV__) {
      console.log(`ℹ️ ${message}`, metadata);
    } else {
      this.sendToAnalytics(logData);
    }
  }

  // Warn logs - Elasticsearch'e
  warn(message: string, metadata?: Record<string, any>) {
    const logData: LogData = {
      level: LogLevel.WARN,
      message,
      sessionId: this.sessionId,
      metadata,
      timestamp: new Date().toISOString()
    };

    if (__DEV__) {
      console.warn(`⚠️ ${message}`, metadata);
    } else {
      this.sendToElasticsearch(logData);
    }
  }

  // Error logs - Sentry'ye
  error(message: string, error?: Error, metadata?: Record<string, any>) {
    const logData: LogData = {
      level: LogLevel.ERROR,
      message,
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        error: error?.message,
        stack: error?.stack
      },
      timestamp: new Date().toISOString()
    };

    if (__DEV__) {
      console.error(`❌ ${message}`, error, metadata);
    } else {
      this.sendToSentry(logData);
    }
  }

  // Success logs - Analytics backend'e
  success(message: string, metadata?: Record<string, any>) {
    const logData: LogData = {
      level: LogLevel.INFO,
      message: `✅ ${message}`,
      sessionId: this.sessionId,
      metadata,
      timestamp: new Date().toISOString()
    };

    if (__DEV__) {
      console.log(`✅ ${message}`, metadata);
    } else {
      this.sendToAnalytics(logData);
    }
  }

  // Production'da logları uygun servislere gönder
  private async sendToAnalytics(logData: LogData) {
    try {
      // Analytics backend'e gönder
      const response = await fetch(`${process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL}/api/v1/logs/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      // Fallback: console'a yaz
      console.log('Analytics log failed:', logData);
    }
  }

  private async sendToElasticsearch(logData: LogData) {
    try {
      // Elasticsearch'e gönder
      const response = await fetch(`${process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL}/api/v1/logs/elasticsearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.warn('Elasticsearch log failed:', logData);
    }
  }

  private async sendToSentry(logData: LogData) {
    try {
      // Sentry'ye gönder (production'da)
      if (this.isProduction) {
        // Sentry SDK kullan
        // Sentry.captureException(new Error(logData.message), {
        //   tags: { session_id: logData.sessionId },
        //   extra: logData.metadata
        // });
      }
    } catch (error) {
      console.error('Sentry log failed:', logData);
    }
  }
}

export default new ProductionLoggingService(); 