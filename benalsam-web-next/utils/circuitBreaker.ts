/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring service health
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Service unavailable, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening circuit
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
  }
}

// Default configuration for Listing Service
export const listingServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,        // Open circuit after 3 failures
  recoveryTimeout: 30000,     // Wait 30 seconds before retrying
  monitoringPeriod: 60000     // Reset failure count every minute
});
