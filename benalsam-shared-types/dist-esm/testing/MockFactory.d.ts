/**
 * Mock Factory for Microservices
 * Tüm servisler için standardize edilmiş mock'lar
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Express Mock Factory
 */
export declare class ExpressMockFactory {
    static createRequest(overrides?: Partial<Request>): Partial<Request>;
    static createResponse(): Partial<Response>;
    static createNextFunction(): NextFunction;
}
/**
 * Database Mock Factory
 */
export declare class DatabaseMockFactory {
    static createSupabaseMock(): {
        from: jest.Mock<any, any, any>;
    };
}
/**
 * File Mock Factory
 */
export declare class FileMockFactory {
    static createMulterFile(overrides?: Partial<any>): any;
    static createImageFile(): any;
    static createLargeFile(): any;
    static createInvalidFile(): any;
}
/**
 * Service Mock Factory
 */
export declare class ServiceMockFactory {
    static createLoggerMock(): {
        info: jest.Mock<any, any, any>;
        warn: jest.Mock<any, any, any>;
        error: jest.Mock<any, any, any>;
        debug: jest.Mock<any, any, any>;
    };
    static createHealthCheckMock(status?: 'healthy' | 'unhealthy', responseTime?: number): jest.Mock<any, any, any>;
    static createErrorMock(message?: string): jest.Mock<any, any, any>;
    static createSuccessMock<T>(data: T): jest.Mock<any, any, any>;
}
/**
 * HTTP Mock Factory
 */
export declare class HttpMockFactory {
    static createFetchMock(responseData: any, status?: number): jest.Mock<any, any, any>;
    static createFetchErrorMock(errorMessage?: string): jest.Mock<any, any, any>;
}
/**
 * Test Data Factory
 */
export declare class TestDataFactory {
    static createUser(overrides?: any): any;
    static createCategory(overrides?: any): any;
    static createListing(overrides?: any): any;
    static createJob(overrides?: any): any;
    static createUploadedFile(overrides?: any): any;
}
/**
 * Environment Mock Factory
 */
export declare class EnvironmentMockFactory {
    static createTestEnvironment(): {
        NODE_ENV: string;
        PORT: string;
        SERVICE_NAME: string;
        DATABASE_URL: string;
        REDIS_URL: string;
        RABBITMQ_URL: string;
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
        SUPABASE_URL: string;
        SUPABASE_SERVICE_ROLE_KEY: string;
    };
}
/**
 * Utility Functions
 */
export declare class TestUtils {
    static waitFor(ms: number): Promise<void>;
    static createMockPromise<T>(data: T, delay?: number): Promise<T>;
    static createMockPromiseReject(error: Error, delay?: number): Promise<never>;
    static generateRandomId(): string;
    static generateRandomEmail(): string;
    static generateRandomString(length?: number): string;
}
//# sourceMappingURL=MockFactory.d.ts.map