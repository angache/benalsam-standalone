/**
 * Admin Backend API Client
 * Handles all communication with the admin backend API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    // Import environment config dynamically to avoid circular dependencies
    const envConfig = (import.meta as any).env?.VITE_API_URL;
    this.baseURL = envConfig || 'http://localhost:3002/api/v1';
    this.token = localStorage.getItem('admin_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  /**
   * Make HTTP request to admin backend
   */
  async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      };

      const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
      };

      console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `HTTP ${response.status}`,
          code: errorData.code,
          details: errorData.details,
        } as ApiError;
      }

      const data = await response.json();
      
      console.log(`✅ API Response: ${options.method || 'GET'} ${endpoint}`, data);
      
      return {
        success: true,
        data,
        message: data.message,
      };

    } catch (error) {
      console.error(`❌ API Error: ${options.method || 'GET'} ${endpoint}`, error);
      
      if (error.status === 401) {
        // Token expired or invalid
        this.clearAuth();
        window.location.href = '/admin/login';
      }
      
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: error.code,
          details: error.details,
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? this.buildUrlWithParams(endpoint, params) : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Build URL with query parameters
   */
  private buildUrlWithParams(endpoint: string, params: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
    
    return url.pathname + url.search;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 