/**
 * Enterprise Circuit Breaker Pattern Implementation
 * 
 * @fileoverview Circuit breaker for cache service operations with automatic recovery
 * @author Benalsam Team
 * @version 1.0.0
 */

import { logger } from '../config/logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successes needed to close from half-open
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 10,     // Default 10 failures
      recoveryTimeout: 15000,   // Default 15 seconds
      monitoringPeriod: 60000,  // Default 1 minute window
      successThreshold: 3,      // Default 3 successes to close
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>, operationName: string = 'operation'): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        const waitTime = Math.ceil((this.nextAttemptTime - Date.now()) / 1000);
        logger.warn(`🔴 Circuit breaker OPEN for ${operationName}, waiting ${waitTime}s before retry`);
        throw new Error(`Circuit breaker is OPEN for ${operationName}. Retry after ${waitTime} seconds.`);
      } else {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        logger.info(`🟡 Circuit breaker moving to HALF_OPEN for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(operationName);
      return result;
    } catch (error) {
      this.onFailure(operationName, error);
      throw error;
    }
  }

  private onSuccess(operationName: string): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`🟢 Circuit breaker CLOSED for ${operationName}`);
      }
    } else {
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  private onFailure(operationName: string, error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      logger.error(`🔴 Circuit breaker OPENED for ${operationName} due to ${this.failureCount} failures`, { error: error.message });
    } else {
      logger.warn(`🟠 Circuit breaker failure for ${operationName}. Failure count: ${this.failureCount}/${this.config.failureThreshold}`, { error: error.message });
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isHealthy: this.state === 'CLOSED' || this.state === 'HALF_OPEN'
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    logger.info('🔄 Circuit breaker reset');
  }
}

export const redisCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 10000, // 10 seconds
  successThreshold: 2
});

export const memoryCacheCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 5000, // 5 seconds
  successThreshold: 1
});

export const supabaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 10000, // 10 seconds
  successThreshold: 2
});

export const cacheOperationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 5000, // 5 seconds
  successThreshold: 1
});
