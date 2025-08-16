import { apiClient } from '@/lib/apiClient';

const performanceService = {
  // Save performance analysis data to Redis via backend
  async saveAnalysis(analysis) {
    try {
      const response = await apiClient.post('/performance-analysis/analysis', analysis);
      return response.data;
    } catch (error) {
      console.error('Failed to save performance analysis:', error);
      throw error;
    }
  },

  // Get performance analyses from Redis
  async getAnalyses(options = {}) {
    try {
      const { route, limit = 50, offset = 0 } = options;
      const params = new URLSearchParams();
      if (route) params.append('route', route);
      if (limit) params.append('limit', limit);
      if (offset) params.append('offset', offset);
      
      const response = await apiClient.get(`/performance-analysis/analyses?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get performance analyses:', error);
      throw error;
    }
  },

  // Get performance trends
  async getTrends(options = {}) {
    try {
      const { route, days = 7 } = options;
      const params = new URLSearchParams();
      if (route) params.append('route', route);
      if (days) params.append('days', days);
      
      const response = await apiClient.get(`/performance-analysis/trends?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get performance trends:', error);
      throw error;
    }
  },

  // Get performance summary
  async getSummary(options = {}) {
    try {
      const { days = 30 } = options;
      const params = new URLSearchParams();
      if (days) params.append('days', days);
      
      const response = await apiClient.get(`/performance-analysis/summary?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      throw error;
    }
  },

  // Get performance alerts
  async getAlerts(options = {}) {
    try {
      const { limit = 10 } = options;
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      
      const response = await apiClient.get(`/performance-analysis/alerts?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get performance alerts:', error);
      throw error;
    }
  }
};

export default performanceService;
