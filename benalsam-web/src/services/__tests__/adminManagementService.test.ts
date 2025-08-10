import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminManagementService } from '../adminManagementService';
import { apiClient } from '../../lib/apiClient';

vi.mock('../../lib/apiClient');

const mockAdminUser = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin',
  name: 'Admin User',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAdminUsers = [
  mockAdminUser,
  {
    id: '2',
    email: 'moderator@example.com',
    role: 'moderator',
    name: 'Moderator User',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('AdminManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminUsers', () => {
    it('admin kullanıcıları başarıyla getirir', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: { users: mockAdminUsers, total: 2 },
      });

      const result = await AdminManagementService.getAdminUsers();
      
      expect(result.success).toBe(true);
      expect(result.data?.users).toHaveLength(2);
      expect(result.data?.total).toBe(2);
    });

    it('filtrelerle admin kullanıcıları getirir', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: { users: [mockAdminUser], total: 1 },
      });

      const result = await AdminManagementService.getAdminUsers({
        role: 'admin',
        search: 'admin',
      });
      
      expect(apiClient.get).toHaveBeenCalledWith('/admin/users', {
        role: 'admin',
        search: 'admin',
      });
    });

    it('hata durumunda false döner', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: false,
        error: { message: 'Yetki hatası' },
      });

      const result = await AdminManagementService.getAdminUsers();
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Yetki hatası');
    });
  });

  describe('getAdminUser', () => {
    it('tek admin kullanıcısını getirir', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: mockAdminUser,
      });

      const result = await AdminManagementService.getAdminUser('1');
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('1');
      expect(apiClient.get).toHaveBeenCalledWith('/admin/users/1');
    });
  });

  describe('createAdminUser', () => {
    it('yeni admin kullanıcısı oluşturur', async () => {
      const newUser = {
        email: 'newadmin@example.com',
        password: 'mock-secure-password-for-testing-only',
        role: 'moderator',
        name: 'New Admin',
      };

      (apiClient.post as any).mockResolvedValue({
        success: true,
        data: { ...mockAdminUser, ...newUser, id: '3' },
      });

      const result = await AdminManagementService.createAdminUser(newUser);
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('newadmin@example.com');
      expect(apiClient.post).toHaveBeenCalledWith('/admin/users', newUser);
    });
  });

  describe('updateAdminUser', () => {
    it('admin kullanıcısını günceller', async () => {
      const updates = { name: 'Updated Name', role: 'super_admin' };

      (apiClient.put as any).mockResolvedValue({
        success: true,
        data: { ...mockAdminUser, ...updates },
      });

      const result = await AdminManagementService.updateAdminUser('1', updates);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
      expect(apiClient.put).toHaveBeenCalledWith('/admin/users/1', updates);
    });
  });

  describe('deleteAdminUser', () => {
    it('admin kullanıcısını siler', async () => {
      (apiClient.delete as any).mockResolvedValue({
        success: true,
        data: { message: 'Kullanıcı silindi' },
      });

      const result = await AdminManagementService.deleteAdminUser('1');
      
      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/admin/users/1');
    });
  });

  describe('getAdminUserStats', () => {
    it('admin istatistiklerini getirir', async () => {
      const mockStats = {
        totalUsers: 10,
        activeUsers: 8,
        totalListings: 150,
        pendingListings: 5,
        totalRevenue: 5000,
      };

      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const result = await AdminManagementService.getAdminUserStats();
      
      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(10);
      expect(apiClient.get).toHaveBeenCalledWith('/admin/users/stats');
    });
  });
}); 