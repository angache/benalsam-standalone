import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../apiClient';

// Mock fetch
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url, config) => {
    if (url.toString().includes('/health')) {
      return {
        ok: true,
        json: async () => ({ status: 'ok' }),
      };
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    };
  }));
});

describe('apiClient', () => {
  it('should return health check response', async () => {
    const res = await apiClient.healthCheck();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('status', 'ok');
  });

  it('should handle 404 error', async () => {
    const res = await apiClient.get('/not-found');
    expect(res.success).toBe(false);
    expect(res.error?.message).toBe('Not found');
  });
}); 