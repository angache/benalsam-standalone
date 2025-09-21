import axios, { AxiosResponse } from 'axios';
import logger from '../config/logger';

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:3016';

export interface SearchServiceRequest {
  query?: string;
  categories?: string[];
  location?: string;
  urgency?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  attributes?: any;
}

export interface SearchServiceResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  aggregations?: any;
  responseTime?: number;
  cached?: boolean;
  error?: string;
  message?: string;
}

/**
 * Search Service Client
 * Admin Backend'ten Search Service'e istek yapmak için
 */
export class SearchServiceClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = SEARCH_SERVICE_URL;
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Search listings via Search Service
   */
  async searchListings(params: SearchServiceRequest): Promise<SearchServiceResponse> {
    try {
      logger.info('🔍 Forwarding search request to Search Service:', {
        url: `${this.baseUrl}/api/v1/search/listings`,
        params: {
          query: params.query,
          page: params.page,
          pageSize: params.pageSize,
          categories: params.categories?.length,
          location: params.location,
          urgency: params.urgency
        }
      });

      const response: AxiosResponse<SearchServiceResponse> = await axios.post(
        `${this.baseUrl}/api/v1/search/listings`,
        params,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      logger.info('✅ Search Service response received:', {
        success: response.data.success,
        total: response.data.total,
        responseTime: response.data.responseTime,
        cached: response.data.cached
      });

      return response.data;

    } catch (error: any) {
      logger.error('❌ Search Service request failed:', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        url: `${this.baseUrl}/api/v1/search/listings`
      });

      // Return fallback response
      return {
        success: false,
        data: [],
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: 0,
        error: error.message || 'Search Service unavailable',
        message: 'Search operation failed'
      };
    }
  }

  /**
   * Get search suggestions via Search Service
   */
  async getSuggestions(query: string): Promise<SearchServiceResponse> {
    try {
      const response: AxiosResponse<SearchServiceResponse> = await axios.get(
        `${this.baseUrl}/api/v1/search/suggestions`,
        {
          params: { q: query },
          timeout: this.timeout
        }
      );

      return response.data;

    } catch (error: any) {
      logger.error('❌ Search suggestions request failed:', error);
      
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        error: error.message || 'Search suggestions unavailable'
      };
    }
  }

  /**
   * Get search analytics via Search Service
   */
  async getAnalytics(): Promise<SearchServiceResponse> {
    try {
      const response: AxiosResponse<SearchServiceResponse> = await axios.get(
        `${this.baseUrl}/api/v1/search/analytics`,
        {
          timeout: this.timeout
        }
      );

      return response.data;

    } catch (error: any) {
      logger.error('❌ Search analytics request failed:', error);
      
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        error: error.message || 'Search analytics unavailable'
      };
    }
  }

  /**
   * Health check for Search Service
   */
  async healthCheck(): Promise<{ status: string; healthy: boolean; responseTime?: number }> {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/v1/health`, {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      return {
        status: response.data.status || 'unknown',
        healthy: response.data.status === 'healthy',
        responseTime
      };

    } catch (error: any) {
      logger.error('❌ Search Service health check failed:', error);
      
      return {
        status: 'unhealthy',
        healthy: false
      };
    }
  }

  /**
   * Reindex via Search Service
   */
  async reindex(): Promise<SearchServiceResponse> {
    try {
      const response: AxiosResponse<SearchServiceResponse> = await axios.post(
        `${this.baseUrl}/api/v1/search/reindex`,
        {},
        {
          timeout: 60000 // 1 minute for reindex
        }
      );

      return response.data;

    } catch (error: any) {
      logger.error('❌ Search reindex request failed:', error);
      
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        error: error.message || 'Search reindex failed'
      };
    }
  }
}

// Export singleton instance
export const searchServiceClient = new SearchServiceClient();
