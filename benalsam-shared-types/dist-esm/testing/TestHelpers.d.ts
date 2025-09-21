/**
 * Test Helpers for Microservices
 * Test yazımını kolaylaştıran yardımcı fonksiyonlar
 */
/**
 * Jest Mock Helpers
 */
export declare class JestHelpers {
    /**
     * Mock'ları temizle
     */
    static clearAllMocks(): void;
    /**
     * Mock'ları sıfırla
     */
    static resetAllMocks(): void;
    /**
     * Mock'ları restore et
     */
    static restoreAllMocks(): void;
    /**
     * Console mock'larını ayarla
     */
    static mockConsole(): void;
    /**
     * Console mock'larını restore et
     */
    static restoreConsole(): void;
}
/**
 * Async Test Helpers
 */
export declare class AsyncHelpers {
    /**
     * Promise'in resolve olmasını bekle
     */
    static waitForPromise<T>(promise: Promise<T>, timeout?: number): Promise<T>;
    /**
     * Belirli bir süre bekle
     */
    static wait(ms: number): Promise<void>;
    /**
     * Condition'ın true olmasını bekle
     */
    static waitForCondition(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
}
/**
 * Assertion Helpers
 */
export declare class AssertionHelpers {
    /**
     * Object'in belirli property'lere sahip olduğunu kontrol et
     */
    static expectToHaveProperties(obj: any, properties: string[]): void;
    /**
     * Object'in belirli property'lere sahip olmadığını kontrol et
     */
    static expectNotToHaveProperties(obj: any, properties: string[]): void;
    /**
     * Array'in belirli elementleri içerdiğini kontrol et
     */
    static expectArrayToContain(array: any[], elements: any[]): void;
    /**
     * String'in belirli pattern'leri içerdiğini kontrol et
     */
    static expectStringToMatch(string: string, patterns: RegExp[]): void;
    /**
     * Error'ın belirli mesajı içerdiğini kontrol et
     */
    static expectErrorToContain(error: Error, messages: string[]): void;
}
/**
 * Mock Data Helpers
 */
export declare class MockDataHelpers {
    /**
     * Random ID oluştur
     */
    static generateId(): string;
    /**
     * Random email oluştur
     */
    static generateEmail(): string;
    /**
     * Random string oluştur
     */
    static generateString(length?: number): string;
    /**
     * Random number oluştur
     */
    static generateNumber(min?: number, max?: number): number;
    /**
     * Random date oluştur
     */
    static generateDate(): string;
    /**
     * Random boolean oluştur
     */
    static generateBoolean(): boolean;
    /**
     * Random array oluştur
     */
    static generateArray<T>(generator: () => T, length?: number): T[];
}
/**
 * Test Environment Helpers
 */
export declare class EnvironmentHelpers {
    /**
     * Test environment'ı ayarla
     */
    static setupTestEnvironment(): void;
    /**
     * Environment variable'ı ayarla
     */
    static setEnvVar(key: string, value: string): void;
    /**
     * Environment variable'ı sil
     */
    static deleteEnvVar(key: string): void;
    /**
     * Environment variable'ları temizle
     */
    static clearEnvVars(): void;
}
/**
 * Performance Test Helpers
 */
export declare class PerformanceHelpers {
    /**
     * Function'ın execution time'ını ölç
     */
    static measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        executionTime: number;
    }>;
    /**
     * Function'ın belirli sürede tamamlanmasını kontrol et
     */
    static expectToCompleteWithin<T>(fn: () => Promise<T>, maxTime: number): Promise<T>;
    /**
     * Multiple execution'ların average time'ını ölç
     */
    static measureAverageExecutionTime<T>(fn: () => Promise<T>, iterations?: number): Promise<{
        result: T;
        averageTime: number;
        times: number[];
    }>;
}
/**
 * Database Test Helpers
 */
export declare class DatabaseHelpers {
    /**
     * Database connection'ı mock'la
     */
    static mockDatabaseConnection(): any;
    /**
     * Database error'ı mock'la
     */
    static mockDatabaseError(message?: string): any;
}
/**
 * HTTP Test Helpers
 */
export declare class HttpHelpers {
    /**
     * HTTP response'ı mock'la
     */
    static mockHttpResponse(data: any, status?: number): any;
    /**
     * HTTP error'ı mock'la
     */
    static mockHttpError(message?: string, status?: number): any;
}
/**
 * Test Suite Helpers
 */
export declare class TestSuiteHelpers {
    /**
     * Test suite setup'ı
     */
    static setupTestSuite(): void;
    /**
     * Test suite cleanup'ı
     */
    static cleanupTestSuite(): void;
    /**
     * Test case setup'ı
     */
    static setupTestCase(): void;
    /**
     * Test case cleanup'ı
     */
    static cleanupTestCase(): void;
}
//# sourceMappingURL=TestHelpers.d.ts.map