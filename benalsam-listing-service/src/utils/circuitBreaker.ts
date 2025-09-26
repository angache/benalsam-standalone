/**
 * Enterprise Circuit Breaker Pattern Implementation
 * 
 * @fileoverview Circuit breaker for listing service operations with automatic recovery
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
      failureThreshold: 5,      // 5 failures
      recoveryTimeout: 10000,   // 10 seconds
      monitoringPeriod: 60000,  // 1 minute window
      successThreshold: 3,      // 3 successes to close
      ...config
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, operationName: string = 'operation'): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        const waitTime = Math.ceil((this.nextAttemptTime - Date.now()) / 1000);
        logger.warn(`🔴 Circuit breaker OPEN for ${operationName}, waiting ${waitTime}s before retry`);
        throw new Error(`Circuit breaker is OPEN for ${operationName}. Retry after ${waitTime} seconds.`);
      } else {
        // Time to try again - move to half-open
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

  /**
   * Handle successful operation
   */
  private onSuccess(operationName: string): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      logger.info(`🟢 Circuit breaker success for ${operationName} (${this.successCount}/${this.config.successThreshold})`);
      
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        logger.info(`✅ Circuit breaker CLOSED for ${operationName} - service recovered`);
      }
    } else {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(operationName: string, error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    logger.warn(`🔴 Circuit breaker failure for ${operationName} (${this.failureCount}/${this.config.failureThreshold})`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      operationName,
      failureCount: this.failureCount
    });

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      logger.error(`🚨 Circuit breaker OPENED for ${operationName} - service unavailable for ${this.config.recoveryTimeout}ms`);
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Get success count (only relevant in HALF_OPEN state)
   */
  getSuccessCount(): number {
    return this.successCount;
  }

  /**
   * Get circuit breaker metrics
   */
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

  /**
   * Reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    logger.info('🔄 Circuit breaker reset to CLOSED state');
  }
}

// Database operations circuit breaker
export const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 10000,
  monitoringPeriod: 60000,
  successThreshold: 3
});

// External service calls circuit breaker
export const externalServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 15000,
  monitoringPeriod: 60000,
  successThreshold: 2
});

// File operations circuit breaker
export const fileOperationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 5000,
  monitoringPeriod: 30000,
  successThreshold: 2
});
