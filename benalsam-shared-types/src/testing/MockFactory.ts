/**
 * Mock Factory for Microservices
 * Tüm servisler için standardize edilmiş mock'lar
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Express Mock Factory
 */
export class ExpressMockFactory {
  static createRequest(overrides: Partial<Request> = {}): Partial<Request> {
    return {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      path: '/api/test',
      query: {},
      params: {},
      body: {},
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      ...overrides
    };
  }

  static createResponse(): Partial<Response> {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      removeHeader: jest.fn(),
      locals: {}
    };
    return res;
  }

  static createNextFunction(): NextFunction {
    return jest.fn();
  }
}

/**
 * Database Mock Factory
 */
export class DatabaseMockFactory {
  static createSupabaseMock() {
    return {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
            })
          }),
          order: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          }),
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
          }),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: {}, error: null })
            })
          })
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        }),
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
    };
  }
}

/**
 * File Mock Factory
 */
export class FileMockFactory {
  static createMulterFile(overrides: Partial<any> = {}): any {
    return {
      fieldname: 'test-field',
      originalname: 'test-file.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024000, // 1MB
      buffer: Buffer.from('fake-file-data'),
      destination: '/tmp',
      filename: 'test-file.jpg',
      path: '/tmp/test-file.jpg',
      stream: null as any,
      ...overrides
    };
  }

  static createImageFile(): any {
    return this.createMulterFile({
      mimetype: 'image/jpeg',
      originalname: 'test-image.jpg',
      size: 2048000 // 2MB
    });
  }

  static createLargeFile(): any {
    return this.createMulterFile({
      mimetype: 'image/jpeg',
      originalname: 'large-image.jpg',
      size: 15 * 1024 * 1024 // 15MB
    });
  }

  static createInvalidFile(): any {
    return this.createMulterFile({
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
      size: 1024000
    });
  }
}

/**
 * Service Mock Factory
 */
export class ServiceMockFactory {
  static createLoggerMock() {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }

  static createHealthCheckMock(status: 'healthy' | 'unhealthy' = 'healthy', responseTime: number = 100) {
    return jest.fn().mockResolvedValue({
      status,
      responseTime
    });
  }

  static createErrorMock(message: string = 'Test error') {
    return jest.fn().mockRejectedValue(new Error(message));
  }

  static createSuccessMock<T>(data: T) {
    return jest.fn().mockResolvedValue(data);
  }
}

/**
 * HTTP Mock Factory
 */
export class HttpMockFactory {
  static createFetchMock(responseData: any, status: number = 200) {
    return jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(responseData),
      text: jest.fn().mockResolvedValue(JSON.stringify(responseData))
    });
  }

  static createFetchErrorMock(errorMessage: string = 'Network error') {
    return jest.fn().mockRejectedValue(new Error(errorMessage));
  }
}

/**
 * Test Data Factory
 */
export class TestDataFactory {
  static createUser(overrides: any = {}) {
    return {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createCategory(overrides: any = {}) {
    return {
      id: 'category-123',
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
      parent_id: null,
      level: 0,
      path: 'test-category',
      is_active: true,
      sort_order: 1,
      attributes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createListing(overrides: any = {}) {
    return {
      id: 'listing-123',
      title: 'Test Listing',
      description: 'Test listing description',
      price: 1000,
      category_id: 'category-123',
      user_id: 'user-123',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  static createJob(overrides: any = {}) {
    return {
      id: 'job-123',
      type: 'IMAGE_UPLOAD_REQUESTED',
      status: 'pending',
      priority: 'normal',
      data: {},
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  static createUploadedFile(overrides: any = {}) {
    return {
      id: 'file-123',
      originalName: 'test-image.jpg',
      filename: 'test-image.jpg',
      url: 'https://cloudinary.com/test-image.jpg',
      size: 1024000,
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
      format: 'jpg',
      publicId: 'test-public-id',
      folder: 'test-folder',
      uploadedAt: new Date().toISOString(),
      ...overrides
    };
  }
}

/**
 * Environment Mock Factory
 */
export class EnvironmentMockFactory {
  static createTestEnvironment() {
    return {
      NODE_ENV: 'test',
      PORT: '3000',
      SERVICE_NAME: 'test-service',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      RABBITMQ_URL: 'amqp://localhost:5672',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key'
    };
  }
}

/**
 * Utility Functions
 */
export class TestUtils {
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createMockPromise<T>(data: T, delay: number = 0): Promise<T> {
    return new Promise(resolve => {
      setTimeout(() => resolve(data), delay);
    });
  }

  static createMockPromiseReject(error: Error, delay: number = 0): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(error), delay);
    });
  }

  static generateRandomId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static generateRandomEmail(): string {
    return `test-${this.generateRandomId()}@example.com`;
  }

  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
