/**
 * Admin Listing Fetchers
 * Admin-specific listing operations for the admin backend
 */

import { apiClient, ApiResponse } from '@/lib/apiClient';
import { errorHandler } from '@/lib/errorHandler';

// Admin listing types
export interface AdminListing {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  status: 'pending' | 'active' | 'rejected' | 'expired' | 'completed';
  user_id: string;
  user_email: string;
  user_name: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  popularity_score: number;
  view_count: number;
  offer_count: number;
  is_featured: boolean;
  is_urgent_premium: boolean;
  is_showcase: boolean;
  main_image_url?: string;
  additional_image_urls?: string[];
  geolocation?: string;
  contact_preference: string;
  auto_republish: boolean;
  urgency: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

export interface AdminListingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  featured?: boolean;
  urgent?: boolean;
  showcase?: boolean;
}

export interface AdminListingStats {
  total: number;
  pending: number;
  active: number;
  rejected: number;
  expired: number;
  completed: number;
  featured: number;
  urgent: number;
  showcase: number;
}

export interface AdminListingAnalytics {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  averageBudget: number;
  topCategories: Array<{ category: string; count: number }>;
  listingsByStatus: Array<{ status: string; count: number }>;
  listingsByLocation: Array<{ location: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    listing_title: string;
    user_email: string;
    timestamp: string;
  }>;
}

/**
 * Admin Listing Fetchers
 */
export class AdminListingFetchers {
  /**
   * Get all listings with admin filters
   */
  static async fetchAdminListings(
    filters: AdminListingFilters = {}
  ): Promise<ApiResponse<{ listings: AdminListing[]; total: number; stats: AdminListingStats }>> {
    try {
      const response = await apiClient.get('/listings', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'fetchAdminListings');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'fetchAdminListings');
      return {
        success: false,
        error: {
          message: 'İlanlar yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get single listing for admin
   */
  static async fetchAdminListing(listingId: string): Promise<ApiResponse<AdminListing>> {
    try {
      const response = await apiClient.get(`/listings/${listingId}`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'fetchAdminListing');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'fetchAdminListing');
      return {
        success: false,
        error: {
          message: 'İlan detayları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Update listing (admin)
   */
  static async updateAdminListing(
    listingId: string,
    updates: Partial<AdminListing>
  ): Promise<ApiResponse<AdminListing>> {
    try {
      const response = await apiClient.put(`/listings/${listingId}`, updates);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'updateAdminListing');
        return response;
      }

      errorHandler.showSuccess('İlan başarıyla güncellendi');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'updateAdminListing');
      return {
        success: false,
        error: {
          message: 'İlan güncellenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Delete listing (admin)
   */
  static async deleteAdminListing(listingId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/listings/${listingId}`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'deleteAdminListing');
        return response;
      }

      errorHandler.showSuccess('İlan başarıyla silindi');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'deleteAdminListing');
      return {
        success: false,
        error: {
          message: 'İlan silinirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Moderate listing (approve/reject)
   */
  static async moderateListing(
    listingId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ApiResponse<AdminListing>> {
    try {
      const response = await apiClient.post(`/listings/${listingId}/moderate`, {
        action,
        reason,
      });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'moderateListing');
        return response;
      }

      const actionText = action === 'approve' ? 'onaylandı' : 'reddedildi';
      errorHandler.showSuccess(`İlan başarıyla ${actionText}`);
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'moderateListing');
      return {
        success: false,
        error: {
          message: 'İlan moderasyonu sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Re-evaluate listing (move active listing back to pending)
   */
  static async reEvaluateListing(listingId: string): Promise<ApiResponse<AdminListing>> {
    try {
      const response = await apiClient.post(`/listings/${listingId}/re-evaluate`);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'reEvaluateListing');
        return response;
      }

      errorHandler.showSuccess('İlan yeniden değerlendirme için bekletmeye alındı');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'reEvaluateListing');
      return {
        success: false,
        error: {
          message: 'İlan yeniden değerlendirme sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get listing analytics
   */
  static async getListingAnalytics(): Promise<ApiResponse<AdminListingAnalytics>> {
    try {
      const response = await apiClient.get('/analytics/listings');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getListingAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getListingAnalytics');
      return {
        success: false,
        error: {
          message: 'Analitik veriler yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get listings by user
   */
  static async getListingsByUser(userId: string): Promise<ApiResponse<AdminListing[]>> {
    try {
      const response = await apiClient.get('/listings', { userId });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getListingsByUser');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getListingsByUser');
      return {
        success: false,
        error: {
          message: 'Kullanıcı ilanları yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Search listings with full-text search
   */
  static async searchListings(query: string): Promise<ApiResponse<AdminListing[]>> {
    try {
      const response = await apiClient.get('/search/listings', { q: query });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'searchListings');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'searchListings');
      return {
        success: false,
        error: {
          message: 'Arama sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Bulk moderate listings
   */
  static async bulkModerateListings(
    listingIds: string[],
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    try {
      const response = await apiClient.post('/listings/bulk-moderate', {
        listingIds,
        action,
        reason,
      });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'bulkModerateListings');
        return response;
      }

      const actionText = action === 'approve' ? 'onaylandı' : 'reddedildi';
      const successCount = response.data?.success?.length || 0;
      errorHandler.showSuccess(`${successCount} ilan başarıyla ${actionText}`);
      
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'bulkModerateListings');
      return {
        success: false,
        error: {
          message: 'Toplu moderasyon sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get listing statistics
   */
  static async getListingStats(): Promise<ApiResponse<AdminListingStats>> {
    try {
      const response = await apiClient.get('/listings/stats');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getListingStats');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getListingStats');
      return {
        success: false,
        error: {
          message: 'İstatistikler yüklenirken bir hata oluştu',
        },
      };
    }
  }
}

 