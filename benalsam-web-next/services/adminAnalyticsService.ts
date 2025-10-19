/**
 * Admin Analytics Service
 * Handles analytics and reporting for admin operations
 */

import { apiClient, ApiResponse } from '@/lib/apiClient';
import { errorHandler } from '@/lib/errorHandler';

// Analytics types
export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalOffers: number;
  totalConversations: number;
  activeListings: number;
  pendingListings: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    listings: number;
    offers: number;
  };
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'user' | 'listing' | 'offer' | 'conversation';
    action: string;
    details: string;
    timestamp: string;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByStatus: Array<{ status: string; count: number }>;
  usersByLocation: Array<{ location: string; count: number }>;
  topUsers: Array<{
    id: string;
    email: string;
    name: string;
    listingCount: number;
    offerCount: number;
    lastActive: string;
  }>;
  userGrowth: Array<{ date: string; count: number }>;
  userEngagement: {
    averageListingsPerUser: number;
    averageOffersPerUser: number;
    averageConversationsPerUser: number;
  };
}

export interface ListingAnalytics {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  averageBudget: number;
  listingsByStatus: Array<{ status: string; count: number }>;
  listingsByCategory: Array<{ category: string; count: number }>;
  listingsByLocation: Array<{ location: string; count: number }>;
  premiumFeatures: {
    featured: number;
    urgent: number;
    showcase: number;
  };
  listingGrowth: Array<{ date: string; count: number }>;
  topListings: Array<{
    id: string;
    title: string;
    user_email: string;
    view_count: number;
    offer_count: number;
    popularity_score: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueByPlan: Array<{ plan: string; amount: number }>;
  revenueGrowth: Array<{ month: string; amount: number }>;
  topRevenueSources: Array<{ source: string; amount: number }>;
  conversionRate: number;
  averageRevenuePerUser: number;
}

export interface SystemAnalytics {
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  databaseStats: {
    totalRecords: number;
    tableSizes: Record<string, number>;
    queryPerformance: Array<{ query: string; avgTime: number }>;
  };
  cacheStats: {
    hitRate: number;
    missRate: number;
    totalKeys: number;
    memoryUsage: number;
  };
  elasticsearchStats: {
    totalDocuments: number;
    indexCount: number;
    searchPerformance: number;
  };
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  location?: string;
  status?: string;
  limit?: number;
}

/**
 * Admin Analytics Service
 */
export class AdminAnalyticsService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getDashboardStats');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getDashboardStats');
      return {
        success: false,
        error: {
          message: 'Dashboard istatistikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(filters?: AnalyticsFilters): Promise<ApiResponse<UserAnalytics>> {
    try {
      const response = await apiClient.get('/analytics/users', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getUserAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getUserAnalytics');
      return {
        success: false,
        error: {
          message: 'Kullanıcı analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get listing analytics
   */
  static async getListingAnalytics(filters?: AnalyticsFilters): Promise<ApiResponse<ListingAnalytics>> {
    try {
      const response = await apiClient.get('/analytics/listings', filters);
      
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
          message: 'İlan analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(filters?: AnalyticsFilters): Promise<ApiResponse<RevenueAnalytics>> {
    try {
      const response = await apiClient.get('/analytics/revenue', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getRevenueAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getRevenueAnalytics');
      return {
        success: false,
        error: {
          message: 'Gelir analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get system analytics
   */
  static async getSystemAnalytics(): Promise<ApiResponse<SystemAnalytics>> {
    try {
      const response = await apiClient.get('/analytics/system');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getSystemAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getSystemAnalytics');
      return {
        success: false,
        error: {
          message: 'Sistem analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get offer analytics
   */
  static async getOfferAnalytics(filters?: AnalyticsFilters): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/offers', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getOfferAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getOfferAnalytics');
      return {
        success: false,
        error: {
          message: 'Teklif analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get conversation analytics
   */
  static async getConversationAnalytics(filters?: AnalyticsFilters): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/conversations', filters);
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getConversationAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getConversationAnalytics');
      return {
        success: false,
        error: {
          message: 'Mesajlaşma analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get category analytics
   */
  static async getCategoryAnalytics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/categories');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getCategoryAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getCategoryAnalytics');
      return {
        success: false,
        error: {
          message: 'Kategori analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get location analytics
   */
  static async getLocationAnalytics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/locations');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getLocationAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getLocationAnalytics');
      return {
        success: false,
        error: {
          message: 'Konum analitikleri yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Export analytics data
   */
  static async exportAnalytics(
    type: 'users' | 'listings' | 'offers' | 'conversations' | 'revenue',
    format: 'csv' | 'json' | 'xlsx',
    filters?: AnalyticsFilters
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const response = await apiClient.post('/analytics/export', {
        type,
        format,
        filters,
      });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'exportAnalytics');
        return response;
      }

      errorHandler.showSuccess('Analitik veriler başarıyla dışa aktarıldı');
      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'exportAnalytics');
      return {
        success: false,
        error: {
          message: 'Veri dışa aktarma sırasında bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get real-time analytics
   */
  static async getRealTimeAnalytics(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/analytics/realtime');
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getRealTimeAnalytics');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getRealTimeAnalytics');
      return {
        success: false,
        error: {
          message: 'Gerçek zamanlı analitikler yüklenirken bir hata oluştu',
        },
      };
    }
  }

  /**
   * Get custom analytics report
   */
  static async getCustomReport(
    metrics: string[],
    dimensions: string[],
    filters?: AnalyticsFilters
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/analytics/custom-report', {
        metrics,
        dimensions,
        filters,
      });
      
      if (!response.success) {
        errorHandler.handleApiError(response.error, 'getCustomReport');
        return response;
      }

      return response;
    } catch (error) {
      errorHandler.handleApiError(error, 'getCustomReport');
      return {
        success: false,
        error: {
          message: 'Özel rapor oluşturulurken bir hata oluştu',
        },
      };
    }
  }
}

 