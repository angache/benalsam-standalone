import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminListingFetchers } from '../adminFetchers';
import { apiClient } from '../../../lib/apiClient';

vi.mock('../../../lib/apiClient');

const mockListing = {
  id: '1',
  title: 'Test İlanı',
  description: 'Test açıklaması',
  category: 'elektronik',
  budget: 1000,
  location: 'İstanbul',
  status: 'pending',
  user_id: 'user1',
  user_email: 'user@example.com',
  user_name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  popularity_score: 0,
  view_count: 0,
  offer_count: 0,
  is_featured: false,
  is_urgent_premium: false,
  is_showcase: false,
  contact_preference: 'email',
  auto_republish: false,
  urgency: 'normal',
};

const mockListings = [mockListing];

describe('AdminListingFetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAdminListings', () => {
    it('admin ilanları başarıyla getirir', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: {
          listings: mockListings,
          total: 1,
          stats: {
            total: 1,
            pending: 1,
            active: 0,
            rejected: 0,
            expired: 0,
            completed: 0,
            featured: 0,
            urgent: 0,
            showcase: 0,
          },
        },
      });

      const result = await AdminListingFetchers.fetchAdminListings();
      
      expect(result.success).toBe(true);
      expect(result.data?.listings).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.stats.total).toBe(1);
    });

    it('filtrelerle admin ilanları getirir', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: { listings: mockListings, total: 1, stats: {} },
      });

      const filters = {
        status: 'pending',
        category: 'elektronik',
        search: 'test',
      };

      const result = await AdminListingFetchers.fetchAdminListings(filters);
      
      expect(apiClient.get).toHaveBeenCalledWith('/listings', filters);
    });

    it('hata durumunda false döner', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: false,
        error: { message: 'İlanlar yüklenemedi' },
      });

      const result = await AdminListingFetchers.fetchAdminListings();
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('İlanlar yüklenemedi');
    });
  });

  describe('fetchAdminListing', () => {
    it('tek admin ilanını getirir', async () => {
      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: mockListing,
      });

      const result = await AdminListingFetchers.fetchAdminListing('1');
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('1');
      expect(result.data?.title).toBe('Test İlanı');
      expect(apiClient.get).toHaveBeenCalledWith('/listings/1');
    });
  });

  describe('updateAdminListing', () => {
    it('admin ilanını günceller', async () => {
      const updates = { status: 'active' as const, is_featured: true };

      (apiClient.put as any).mockResolvedValue({
        success: true,
        data: { ...mockListing, ...updates },
      });

      const result = await AdminListingFetchers.updateAdminListing('1', updates);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('active');
      expect(result.data?.is_featured).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith('/listings/1', updates);
    });
  });

  describe('deleteAdminListing', () => {
    it('admin ilanını siler', async () => {
      (apiClient.delete as any).mockResolvedValue({
        success: true,
        data: { message: 'İlan silindi' },
      });

      const result = await AdminListingFetchers.deleteAdminListing('1');
      
      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/listings/1');
    });
  });

  describe('moderateListing', () => {
    it('ilanı onaylar', async () => {
      (apiClient.post as any).mockResolvedValue({
        success: true,
        data: { ...mockListing, status: 'active' },
      });

      const result = await AdminListingFetchers.moderateListing('1', 'approve', 'Onaylandı');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('active');
      expect(apiClient.post).toHaveBeenCalledWith('/listings/1/moderate', {
        action: 'approve',
        reason: 'Onaylandı',
      });
    });

    it('ilanı reddeder', async () => {
      (apiClient.post as any).mockResolvedValue({
        success: true,
        data: { ...mockListing, status: 'rejected' },
      });

      const result = await AdminListingFetchers.moderateListing('1', 'reject', 'Uygunsuz içerik');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('rejected');
      expect(apiClient.post).toHaveBeenCalledWith('/listings/1/moderate', {
        action: 'reject',
        reason: 'Uygunsuz içerik',
      });
    });
  });

  describe('bulkModerateListings', () => {
    it('toplu ilan moderasyonu yapar', async () => {
      (apiClient.post as any).mockResolvedValue({
        success: true,
        data: {
          success: ['1', '2'],
          failed: [],
          message: '2 ilan onaylandı',
        },
      });

      const result = await AdminListingFetchers.bulkModerateListings(
        ['1', '2'],
        'approve',
        'Toplu onay'
      );
      
      expect(result.success).toBe(true);
      expect(result.data?.success).toHaveLength(2);
      expect(apiClient.post).toHaveBeenCalledWith('/listings/bulk-moderate', {
        listingIds: ['1', '2'],
        action: 'approve',
        reason: 'Toplu onay',
      });
    });
  });

  describe('getListingAnalytics', () => {
    it('ilan analitiklerini getirir', async () => {
      const mockAnalytics = {
        totalListings: 100,
        activeListings: 80,
        pendingListings: 10,
        averageBudget: 1500,
        topCategories: [
          { category: 'elektronik', count: 30 },
          { category: 'ev', count: 25 },
        ],
        listingsByStatus: [
          { status: 'active', count: 80 },
          { status: 'pending', count: 10 },
        ],
        listingsByLocation: [
          { location: 'İstanbul', count: 50 },
          { location: 'Ankara', count: 30 },
        ],
        recentActivity: [
          {
            id: '1',
            action: 'approved',
            listing_title: 'Test İlanı',
            user_email: 'user@example.com',
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      (apiClient.get as any).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      });

      const result = await AdminListingFetchers.getListingAnalytics();
      
      expect(result.success).toBe(true);
      expect(result.data?.totalListings).toBe(100);
      expect(result.data?.activeListings).toBe(80);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/listings');
    });
  });
}); 