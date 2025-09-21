/**
 * Test Helpers for Microservices
 * Test yazımını kolaylaştıran yardımcı fonksiyonlar
 */

/**
 * Jest Mock Helpers
 */
export class JestHelpers {
  /**
   * Mock'ları temizle
   */
  static clearAllMocks(): void {
    // jest.clearAllMocks();
  }

  /**
   * Mock'ları sıfırla
   */
  static resetAllMocks(): void {
    // jest.resetAllMocks();
  }

  /**
   * Mock'ları restore et
   */
  static restoreAllMocks(): void {
    // jest.restoreAllMocks();
  }

  /**
   * Console mock'larını ayarla
   */
  static mockConsole(): void {
    // jest.spyOn(console, 'log').mockImplementation(() => {});
    // jest.spyOn(console, 'warn').mockImplementation(() => {});
    // jest.spyOn(console, 'error').mockImplementation(() => {});
    // jest.spyOn(console, 'info').mockImplementation(() => {});
    // jest.spyOn(console, 'debug').mockImplementation(() => {});
  }

  /**
   * Console mock'larını restore et
   */
  static restoreConsole(): void {
    // jest.restoreAllMocks();
  }
}

/**
 * Async Test Helpers
 */
export class AsyncHelpers {
  /**
   * Promise'in resolve olmasını bekle
   */
  static async waitForPromise<T>(promise: Promise<T>, timeout: number = 5000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Promise timeout')), timeout)
      )
    ]);
  }

  /**
   * Belirli bir süre bekle
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Condition'ın true olmasını bekle
   */
  static async waitForCondition(
    condition: () => boolean, 
    timeout: number = 5000, 
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return;
      }
      await this.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

/**
 * Assertion Helpers
 */
export class AssertionHelpers {
  /**
   * Object'in belirli property'lere sahip olduğunu kontrol et
   */
  static expectToHaveProperties(obj: any, properties: string[]): void {
    properties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  }

  /**
   * Object'in belirli property'lere sahip olmadığını kontrol et
   */
  static expectNotToHaveProperties(obj: any, properties: string[]): void {
    properties.forEach(prop => {
      expect(obj).not.toHaveProperty(prop);
    });
  }

  /**
   * Array'in belirli elementleri içerdiğini kontrol et
   */
  static expectArrayToContain(array: any[], elements: any[]): void {
    elements.forEach(element => {
      expect(array).toContain(element);
    });
  }

  /**
   * String'in belirli pattern'leri içerdiğini kontrol et
   */
  static expectStringToMatch(string: string, patterns: RegExp[]): void {
    patterns.forEach(pattern => {
      expect(string).toMatch(pattern);
    });
  }

  /**
   * Error'ın belirli mesajı içerdiğini kontrol et
   */
  static expectErrorToContain(error: Error, messages: string[]): void {
    messages.forEach(message => {
      expect(error.message).toContain(message);
    });
  }
}

/**
 * Mock Data Helpers
 */
export class MockDataHelpers {
  /**
   * Random ID oluştur
   */
  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Random email oluştur
   */
  static generateEmail(): string {
    return `test-${this.generateId()}@example.com`;
  }

  /**
   * Random string oluştur
   */
  static generateString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Random number oluştur
   */
  static generateNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Random date oluştur
   */
  static generateDate(): string {
    return new Date().toISOString();
  }

  /**
   * Random boolean oluştur
   */
  static generateBoolean(): boolean {
    return Math.random() > 0.5;
  }

  /**
   * Random array oluştur
   */
  static generateArray<T>(generator: () => T, length: number = 5): T[] {
    return Array(length).fill(null).map(() => generator());
  }
}

/**
 * Test Environment Helpers
 */
export class EnvironmentHelpers {
  /**
   * Test environment'ı ayarla
   */
  static setupTestEnvironment(): void {
    process.env['NODE_ENV'] = 'test';
    process.env['PORT'] = '3000';
    process.env['SERVICE_NAME'] = 'test-service';
  }

  /**
   * Environment variable'ı ayarla
   */
  static setEnvVar(key: string, value: string): void {
    process.env[key] = value;
  }

  /**
   * Environment variable'ı sil
   */
  static deleteEnvVar(key: string): void {
    delete process.env[key];
  }

  /**
   * Environment variable'ları temizle
   */
  static clearEnvVars(): void {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('TEST_')) {
        delete process.env[key];
      }
    });
  }
}

/**
 * Performance Test Helpers
 */
export class PerformanceHelpers {
  /**
   * Function'ın execution time'ını ölç
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    const result = await fn();
    const executionTime = Date.now() - startTime;
    
    return { result, executionTime };
  }

  /**
   * Function'ın belirli sürede tamamlanmasını kontrol et
   */
  static async expectToCompleteWithin<T>(
    fn: () => Promise<T>, 
    maxTime: number
  ): Promise<T> {
    const { result, executionTime } = await this.measureExecutionTime(fn);
    
    expect(executionTime).toBeLessThan(maxTime);
    
    return result;
  }

  /**
   * Multiple execution'ların average time'ını ölç
   */
  static async measureAverageExecutionTime<T>(
    fn: () => Promise<T>, 
    iterations: number = 5
  ): Promise<{ result: T; averageTime: number; times: number[] }> {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const { result: iterationResult, executionTime } = await this.measureExecutionTime(fn);
      times.push(executionTime);
      result = iterationResult;
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

    return { result: result!, averageTime, times };
  }
}

/**
 * Database Test Helpers
 */
export class DatabaseHelpers {
  /**
   * Database connection'ı mock'la
   */
  static mockDatabaseConnection(): any {
    return {
      query: () => Promise.resolve({ rows: [], rowCount: 0 }),
      connect: () => Promise.resolve(undefined),
      disconnect: () => Promise.resolve(undefined),
      healthCheck: () => Promise.resolve({ status: 'healthy', responseTime: 100 })
    };
  }

  /**
   * Database error'ı mock'la
   */
  static mockDatabaseError(message: string = 'Database error'): any {
    return {
      query: () => Promise.reject(new Error(message)),
      connect: () => Promise.reject(new Error(message)),
      healthCheck: () => Promise.resolve({ status: 'unhealthy', responseTime: 0 })
    };
  }
}

/**
 * HTTP Test Helpers
 */
export class HttpHelpers {
  /**
   * HTTP response'ı mock'la
   */
  static mockHttpResponse(data: any, status: number = 200): any {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      headers: new Map()
    };
  }

  /**
   * HTTP error'ı mock'la
   */
  static mockHttpError(message: string = 'HTTP error', status: number = 500): any {
    return {
      ok: false,
      status,
      json: () => Promise.resolve({ error: message }),
      text: () => Promise.resolve(message)
    };
  }
}

/**
 * Test Suite Helpers
 */
export class TestSuiteHelpers {
  /**
   * Test suite setup'ı
   */
  static setupTestSuite(): void {
    JestHelpers.mockConsole();
    EnvironmentHelpers.setupTestEnvironment();
  }

  /**
   * Test suite cleanup'ı
   */
  static cleanupTestSuite(): void {
    JestHelpers.restoreConsole();
    JestHelpers.clearAllMocks();
    EnvironmentHelpers.clearEnvVars();
  }

  /**
   * Test case setup'ı
   */
  static setupTestCase(): void {
    JestHelpers.clearAllMocks();
  }

  /**
   * Test case cleanup'ı
   */
  static cleanupTestCase(): void {
    JestHelpers.clearAllMocks();
  }
}
