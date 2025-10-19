import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminAuthService } from '../adminAuthService';
import { apiClient } from '../../lib/apiClient';

vi.mock('../../lib/apiClient');

const mockUser = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin',
  permissions: ['dashboard'],
  name: 'Admin',
  created_at: '',
  updated_at: '',
};

describe('adminAuthService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (apiClient.getToken as any).mockReturnValue(null);
    (apiClient.setToken as any).mockImplementation(() => {});
    (apiClient.clearAuth as any).mockImplementation(() => {});
    await adminAuthService.logout(); // state reset
  });

  it('başarılı login sonrası kullanıcıyı ve tokenı set eder', async () => {
    (apiClient.post as any).mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-jwt-token-for-testing-only',
        refreshToken: 'mock-refresh-token-for-testing-only',
        expiresIn: 3600,
      },
    });
    const res = await adminAuthService.login({ 
      email: 'admin@example.com', 
      password: 'mock-password-for-testing-only' 
    });
    expect(res.success).toBe(true);
    expect(adminAuthService.isAuthenticated()).toBe(true);
    expect(adminAuthService.getCurrentUser()).toMatchObject({ email: 'admin@example.com' });
  });

  it('başarısız login sonrası kullanıcıyı set etmez', async () => {
    (apiClient.post as any).mockResolvedValue({ success: false, error: { message: 'Hatalı giriş' } });
    const res = await adminAuthService.login({ 
      email: 'admin@example.com', 
      password: 'mock-wrong-password-for-testing-only' 
    });
    expect(res.success).toBe(false);
    expect(adminAuthService.isAuthenticated()).toBe(false);
    expect(adminAuthService.getCurrentUser()).toBeNull();
  });

  it('logout sonrası kullanıcıyı ve tokenı temizler', async () => {
    (apiClient.post as any).mockResolvedValue({ success: true });
    (apiClient.getToken as any).mockReturnValue('mock-jwt-token-for-testing-only');
    await adminAuthService.logout();
    expect(adminAuthService.isAuthenticated()).toBe(false);
    expect(adminAuthService.getCurrentUser()).toBeNull();
  });
}); 