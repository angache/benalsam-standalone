import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { config } from '../config/environment';
import type { 
  LoginRequest, 
  LoginResponse, 
  ApiResponse, 
  Listing, 
  GetListingsParams, 
  User, 
  AdminUser, 
  Role, 
  Permission, 
  AnalyticsData 
} from 'benalsam-shared-types';

const API_BASE_URL = import.meta.env.VITE_API_URL || config.apiUrl;
console.log('🔧 API_BASE_URL:', API_BASE_URL);

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    console.log('🔑 Adding auth token to request:', token ? 'Token exists' : 'No token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// API Service
export const apiService = {
  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Attempting login with:', credentials.email);
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    console.log('🔐 Login response:', response.data);
    
    // Admin backend returns { success: true, data: { admin, token, refreshToken }, message }
    const loginData = response.data.data!;
    return {
      token: loginData.token,
      refreshToken: loginData.refreshToken,
      admin: loginData.admin,
    };
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },

  // Listings
  async getListings(params: GetListingsParams = {}): Promise<ApiResponse<Listing[]>> {
    console.log('🔍 Fetching listings with params:', params);
    const response = await apiClient.get<ApiResponse<Listing[]>>('/listings', { params });
    console.log('✅ Listings response:', response.data);
    return response.data;
  },

  async getListing(id: string): Promise<Listing> {
    const response = await apiClient.get<ApiResponse<Listing>>(`/listings/${id}`);
    return response.data.data!;
  },

  async moderateListing(id: string, action: 'approve' | 'reject', reason?: string): Promise<void> {
    const status = action === 'approve' ? 'active' : 'rejected';
    await apiClient.post(`/listings/${id}/moderate`, { status, reason });
  },

  async reEvaluateListing(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/listings/${id}/re-evaluate`, { reason });
  },

  async deleteListing(id: string): Promise<void> {
    await apiClient.delete(`/listings/${id}`);
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    const response = await apiClient.put<ApiResponse<Listing>>(`/listings/${id}`, data);
    return response.data.data;
  },

  // Users
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: { status?: string; role?: string };
  } = {}): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  async banUser(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/users/${id}/ban`, { reason });
  },

  async unbanUser(id: string): Promise<void> {
    await apiClient.post(`/users/${id}/unban`);
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const response = await apiClient.get<ApiResponse<AnalyticsData>>('/analytics');
    return response.data.data;
  },

  // Admin Management
  async getAdminUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: { role?: string; status?: string };
  } = {}): Promise<ApiResponse<AdminUser[]>> {
    const response = await apiClient.get<ApiResponse<AdminUser[]>>('/admin-management/users', { params });
    return response.data;
  },

  async getAdminUser(id: string): Promise<AdminUser> {
    const response = await apiClient.get<ApiResponse<AdminUser>>(`/admin-management/users/${id}`);
    return response.data.data;
  },

  async createAdminUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: string[];
  }): Promise<AdminUser> {
    const response = await apiClient.post<ApiResponse<AdminUser>>('/admin-management/users', data);
    return response.data.data;
  },

  async updateAdminUser(id: string, data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: boolean;
    permissions?: string[];
  }): Promise<AdminUser> {
    const response = await apiClient.put<ApiResponse<AdminUser>>(`/admin-management/users/${id}`, data);
    return response.data.data;
  },

  async deleteAdminUser(id: string): Promise<void> {
    await apiClient.delete(`/admin-management/users/${id}`);
  },

  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiClient.get<ApiResponse<Role[]>>('/admin-management/roles');
    return response.data;
  },

  async getRoleDetails(role: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin-management/roles/${role}`);
    return response.data;
  },

  async updateRolePermissions(role: string, permissionIds: string[]): Promise<void> {
    await apiClient.put(`/admin-management/roles/${role}/permissions`, { permissionIds });
  },

  async getPermissions(params?: { resource?: string }): Promise<ApiResponse<Permission[]>> {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/admin-management/permissions', { params });
    return response.data;
  },

  async getPermissionMatrix(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>('/admin-management/permissions/matrix');
    return response.data;
  },

  async getCurrentUserPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/admin-management/permissions/current');
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Real-time Analytics
  async getRealTimeMetrics(): Promise<any> {
    const response = await apiClient.get('/analytics/real-time-metrics');
    return response.data.data;
  },

  async getUserActivities(): Promise<any[]> {
    const response = await apiClient.get('/analytics/user-activities');
    return response.data.data || [];
  },

  async getSessionActivities(): Promise<any[]> {
    const response = await apiClient.get('/analytics/session-activities');
    return response.data.data || [];
  },

  async getPerformanceAlerts(): Promise<any[]> {
    const response = await apiClient.get('/analytics/performance-alerts');
    return response.data.data || [];
  },

  async getPerformanceMetrics(days: number = 7): Promise<any> {
    const response = await apiClient.get(`/analytics/performance-metrics?days=${days}`);
    return response.data.data;
  },

  async getDashboardStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/dashboard-stats');
    return response.data.data;
  },

  async getAnalyticsDashboard(days: number = 7): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/dashboard?days=${days}`);
    return response.data;
  },

  async getPopularPages(days: number = 7): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/popular-pages?days=${days}`);
    return response.data;
  },

  async getFeatureUsage(days: number = 7): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/feature-usage?days=${days}`);
    return response.data;
  },

  async getAnalyticsUserJourneyData(userId: string, days: number = 7): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/user-journey/${userId}?days=${days}`);
    return response.data;
  },

  async getBounceRate(days: number = 7): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/bounce-rate?days=${days}`);
    return response.data;
  },

  // Elasticsearch
  async getElasticsearchStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/elasticsearch/stats');
    return response.data;
  },

  async searchElasticsearchIndex(indexName: string, size: number = 20): Promise<any> {
    console.log('🔍 API Service: Searching index:', indexName, 'size:', size);
    const response = await apiClient.get<ApiResponse<any>>(`/elasticsearch/search?index=${indexName}&size=${size}`);
    console.log('📊 API Service: Response:', response.data);
    return response.data;
  },

  // Enhanced Analytics Methods
  // Session-based Analytics Methods
  async getSessionAnalytics(params: {
    page?: number;
    limit?: number;
    event_type?: string;
    session_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<any> {
    const response = await apiClient.get('/analytics/session-events', { params });
    return response.data;
  },

  async getSessionStats(days: number = 7): Promise<any> {
    const response = await apiClient.get('/analytics/session-stats', {
      params: { days }
    });
    return response.data;
  },

  async getSessionEvents(params: {
    page?: number;
    limit?: number;
    event_type?: string;
    session_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<any> {
    const response = await apiClient.get('/analytics/events', { params });
    return response.data;
  },

  async getAnalyticsEventTypes(days: number = 7): Promise<any> {
    const response = await apiClient.get('/analytics/event-types', {
      params: { days }
    });
    return response.data;
  },

  async getAnalyticsUserStats(userId: string, days: number = 30): Promise<any> {
    const response = await apiClient.get(`/analytics/user-stats/${userId}`, {
      params: { days }
    });
    return response.data;
  },

  async getAnalyticsPerformanceMetrics(days: number = 7): Promise<any> {
    const response = await apiClient.get('/analytics/performance-metrics', {
      params: { days }
    });
    return response.data;
  },

  async getSessionJourney(sessionId: string, days: number = 7): Promise<any> {
    const response = await apiClient.get(`/analytics/session-journey/${sessionId}`, {
      params: { days }
    });
    return response.data;
  },

  async getSessionAnalyticsById(sessionId: string, days: number = 7): Promise<any> {
    const response = await apiClient.get(`/analytics/session-analytics/${sessionId}`, {
      params: { days }
    });
    return response.data;
  },

  async trackAnalyticsEvent(event: any): Promise<any> {
    const response = await apiClient.post('/analytics/track-event', event);
    return response.data;
  },

  // Performance Monitoring
  async getPerformanceDashboard(): Promise<any> {
    const response = await apiClient.get('/performance/dashboard');
    return response.data.data;
  },

  async getSystemMetrics(): Promise<any> {
    const response = await apiClient.get('/performance/system');
    return response.data.data;
  },

  async getElasticsearchMetrics(): Promise<any> {
    const response = await apiClient.get('/performance/elasticsearch');
    return response.data.data;
  },

  async getAPIMetrics(minutes: number = 5): Promise<any> {
    const response = await apiClient.get('/performance/api', { params: { minutes } });
    return response.data.data;
  },



  async checkPerformanceAlerts(): Promise<any> {
    const response = await apiClient.post('/performance/alerts/check');
    return response.data.data;
  },

  async trackSystemMetrics(): Promise<any> {
    const response = await apiClient.post('/performance/track/system');
    return response.data;
  },

  async trackElasticsearchMetrics(): Promise<any> {
    const response = await apiClient.post('/performance/track/elasticsearch');
    return response.data;
  },

  // User Journey Tracking
  async initializeUserJourney(): Promise<any> {
    const response = await apiClient.post('/user-journey/initialize');
    return response.data.data!;
  },

  async trackJourneyEvent(eventData: any): Promise<any> {
    const response = await apiClient.post('/user-journey/track-event', eventData);
    return response.data.data!;
  },

  async getJourneyAnalysis(days: number = 7): Promise<any> {
    const response = await apiClient.get('/user-journey/analysis', { params: { days } });
    return response.data.data!;
  },

  async getJourneyOptimization(days: number = 7): Promise<any> {
    const response = await apiClient.get('/user-journey/optimization', { params: { days } });
    return response.data.data!;
  },

  async getUserJourney(userId: string, days: number = 7): Promise<any> {
    const response = await apiClient.get(`/user-journey/user/${userId}`, { params: { days } });
    return response.data.data!;
  },

  async getRealTimeJourneyMetrics(): Promise<any> {
    const response = await apiClient.get('/user-journey/realtime');
    return response.data.data!;
  },

  async getJourneyDashboard(days: number = 7): Promise<any> {
    const response = await apiClient.get('/user-journey/dashboard', { params: { days } });
    return response.data.data!;
  },

  // Analytics Alerts System
  async initializeAnalyticsAlerts(): Promise<any> {
    const response = await apiClient.post('/analytics-alerts/initialize');
    return response.data.data!;
  },

  // Alert Rules Management
  async createAlertRule(ruleData: any): Promise<any> {
    const response = await apiClient.post('/analytics-alerts/rules', ruleData);
    return response.data.data!;
  },

  async getAlertRules(): Promise<any> {
    const response = await apiClient.get('/analytics-alerts/rules');
    return response.data.data!;
  },

  async updateAlertRule(ruleId: string, ruleData: any): Promise<any> {
    const response = await apiClient.put(`/analytics-alerts/rules/${ruleId}`, ruleData);
    return response.data.data!;
  },

  async deleteAlertRule(ruleId: string): Promise<any> {
    const response = await apiClient.delete(`/analytics-alerts/rules/${ruleId}`);
    return response.data.data!;
  },

  // Notification Channels Management
  async createNotificationChannel(channelData: any): Promise<any> {
    const response = await apiClient.post('/analytics-alerts/channels', channelData);
    return response.data.data!;
  },

  async getNotificationChannels(): Promise<any> {
    const response = await apiClient.get('/analytics-alerts/channels');
    return response.data.data!;
  },

  // Alerts Management
  async getAlerts(params: {
    status?: string;
    severity?: string;
    metric_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  } = {}): Promise<any> {
    const response = await apiClient.get('/analytics-alerts/alerts', { params });
    return response.data.data!;
  },

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<any> {
    const response = await apiClient.post(`/analytics-alerts/alerts/${alertId}/acknowledge`, { acknowledgedBy });
    return response.data.data!;
  },

  async resolveAlert(alertId: string): Promise<any> {
    const response = await apiClient.post(`/analytics-alerts/alerts/${alertId}/resolve`);
    return response.data.data!;
  },

  // Alert Summary
  async getAlertSummary(): Promise<any> {
    const response = await apiClient.get('/analytics-alerts/summary');
    return response.data.data!;
  },

  // Test Alerts
  async checkAlerts(metrics: any): Promise<any> {
    const response = await apiClient.post('/analytics-alerts/check', { metrics });
    return response.data.data!;
  },

  async testNotification(channelId: string, testAlert: any): Promise<any> {
    const response = await apiClient.post('/analytics-alerts/test-notification', { channelId, testAlert });
    return response.data.data!;
  },

  // Data Export System V2
  async initializeDataExport(): Promise<any> {
    const response = await apiClient.post('/data-export-v2/initialize');
    return response.data.data!;
  },

  async createExportRequest(requestData: {
    export_type: 'csv' | 'json' | 'excel' | 'pdf';
    data_type: 'user_analytics' | 'performance_metrics' | 'business_metrics' | 'custom';
    filters?: {
      date_range?: { start: string; end: string };
      metrics?: string[];
      user_segments?: string[];
      custom_dimensions?: Record<string, any>;
    };
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
      time?: string;
      days?: string[];
    };
  }): Promise<any> {
    const response = await apiClient.post('/data-export-v2/requests', requestData);
    return response.data.data!;
  },

  async getExportRequests(params?: { user_id?: string; status?: string }): Promise<any> {
    const response = await apiClient.get('/data-export-v2/requests', { params });
    return response.data.data!;
  },

  async processExport(exportId: string): Promise<any> {
    const response = await apiClient.post(`/data-export-v2/process/${exportId}`);
    return response.data.data!;
  },

  async downloadExport(exportId: string): Promise<Blob> {
    const response = await apiClient.get(`/data-export-v2/download/${exportId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async deleteExport(exportId: string): Promise<any> {
    const response = await apiClient.delete(`/data-export-v2/requests/${exportId}`);
    return response.data.data!;
  },

  async getExportStatistics(): Promise<any> {
    const response = await apiClient.get('/data-export-v2/statistics');
    return response.data.data!;
  },

  async quickExport(requestData: {
    export_type: 'csv' | 'json' | 'excel' | 'pdf';
    data_type: 'user_analytics' | 'performance_metrics' | 'business_metrics' | 'custom';
    filters?: {
      date_range?: { start: string; end: string };
      metrics?: string[];
      user_segments?: string[];
      custom_dimensions?: Record<string, any>;
    };
  }): Promise<any> {
    const response = await apiClient.post('/data-export-v2/requests', requestData);
    return response.data.data!;
  },

  async getExportFormats(): Promise<any> {
    const response = await apiClient.get('/data-export-v2/formats');
    return response.data.data!;
  },

              async getExportDataTypes(): Promise<any> {
              const response = await apiClient.get('/data-export-v2/data-types');
              return response.data.data!;
            },

            // Frontend Performance Monitoring
            async trackFrontendMetrics(metrics: {
              componentName: string;
              renderTime: number;
              mountTime: number;
              pageLoadTime: number;
              userInteractions: any[];
              memoryUsage?: number;
              bundleSize?: number;
              url: string;
              timestamp: string;
            }): Promise<any> {
              const response = await apiClient.post('/performance/track/frontend', metrics);
              return response.data;
            },

            async getFrontendMetrics(params?: {
              componentName?: string;
              startDate?: string;
              endDate?: string;
              limit?: number;
            }): Promise<any> {
              const response = await apiClient.get('/performance/frontend', { params });
              return response.data.data!;
            },

            // User Journey Methods
            async getUserJourneyMetrics(days: number = 7): Promise<any> {
              const response = await apiClient.get(`/user-journey/metrics?days=${days}`);
              return response.data;
            },

            async getUserJourneyRecommendations(days: number = 7): Promise<any> {
              const response = await apiClient.get(`/user-journey/recommendations?days=${days}`);
              return response.data;
            },

            async initializeUserJourneyTracking(): Promise<any> {
              const response = await apiClient.post('/user-journey/initialize');
              return response.data;
            },

            async trackUserJourneyEvent(eventData: {
              userId: string;
              sessionId: string;
              eventType: string;
              page: string;
              metadata?: any;
            }): Promise<any> {
              const response = await apiClient.post('/user-journey/track', eventData);
              return response.data;
            },

            // Session-based Alert System Methods
            async getSessionAlertRules(): Promise<any> {
              const response = await apiClient.get('/alerts/session-rules');
              return response.data;
            },

            async createSessionAlertRule(ruleData: any): Promise<any> {
              const response = await apiClient.post('/alerts/session-rules', ruleData);
              return response.data;
            },

            async updateSessionAlertRule(id: string, updates: any): Promise<any> {
              const response = await apiClient.put(`/alerts/session-rules/${id}`, updates);
              return response.data;
            },

            async deleteSessionAlertRule(id: string): Promise<any> {
              const response = await apiClient.delete(`/alerts/session-rules/${id}`);
              return response.data;
            },







            async getAlertMetrics(days: number = 7): Promise<any> {
              const response = await apiClient.get(`/alerts/metrics?days=${days}`);
              return response.data;
            },

            async checkAlertConditions(): Promise<any> {
              const response = await apiClient.post('/alerts/check');
              return response.data;
            },

            // Sentry Integration
            async getSentryMetrics(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/sentry/metrics?timeRange=${timeRange}`);
              return response.data;
            },

            async getSentryErrors(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/sentry/errors?timeRange=${timeRange}`);
              return response.data;
            },

            async getSentryPerformance(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/sentry/performance?timeRange=${timeRange}`);
              return response.data;
            },

            async getSentryReleases(): Promise<any> {
              const response = await apiClient.get('/sentry/releases');
              return response.data;
            },

            // Hybrid Monitoring Integration
            async getHybridOverview(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/hybrid-monitoring/overview?timeRange=${timeRange}`);
              return response.data;
            },

            async getHybridBreakdown(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/hybrid-monitoring/error-breakdown?timeRange=${timeRange}`);
              return response.data;
            },

            async getHybridCostAnalysis(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/hybrid-monitoring/cost-analysis?timeRange=${timeRange}`);
              return response.data;
            },

            async getHybridComparison(timeRange: string = '24h'): Promise<any> {
              const response = await apiClient.get(`/hybrid-monitoring/system-comparison?timeRange=${timeRange}`);
              return response.data;
            },

            async testErrorClassification(errorMessage: string, errorType?: string, context?: any): Promise<any> {
              const response = await apiClient.post('/hybrid-monitoring/test-classification', {
                errorMessage,
                errorType,
                context
              });
              return response.data;
            }
          }; 