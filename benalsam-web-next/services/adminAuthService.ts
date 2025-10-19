/**
 * Admin Authentication Service
 * Handles admin authentication with the admin backend
 */

import { apiClient, ApiResponse } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

// Admin authentication types
export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAuthResponse {
  user: AdminUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AdminProfile {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAuthState {
  user: AdminUser | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
}

/**
 * Admin Authentication Service
 */
export class AdminAuthService {
  private static instance: AdminAuthService;
  private authState: AdminAuthState = {
    user: null,
    loading: false,
    initialized: false,
    isAuthenticated: false,
  };

  private listeners: ((state: AdminAuthState) => void)[] = [];

  private constructor() {
    this.initializeAuth();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    this.authState.loading = true;
    this.notifyListeners();

    try {
      const token = apiClient.getToken();
      if (token) {
        // Verify token and get user profile
        const response = await this.getProfile();
        if (response.success && response.data) {
          this.authState.user = response.data;
          this.authState.isAuthenticated = true;
        } else {
          // Token is invalid, clear it
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error initializing admin auth:', error);
      this.logout();
    } finally {
      this.authState.loading = false;
      this.authState.initialized = true;
      this.notifyListeners();
    }
  }

  /**
   * Admin login
   */
  async login(credentials: AdminLoginCredentials): Promise<ApiResponse<AdminAuthResponse>> {
    try {
      this.authState.loading = true;
      this.notifyListeners();

      console.log('🔐 Attempting admin login with:', credentials.email);

      const response = await apiClient.post<AdminAuthResponse>('/auth/login', credentials);

      if (response.success && response.data) {
        // Set token
        apiClient.setToken(response.data.token);
        
        // Update auth state
        this.authState.user = response.data.user;
        this.authState.isAuthenticated = true;
        
        toast({
          title: "Giriş Başarılı",
          description: `Hoş geldiniz, ${response.data.user.name || response.data.user.email}!`,
        });

        console.log('✅ Admin login successful:', response.data.user.email);
      } else {
        toast({
          title: "Giriş Başarısız",
          description: response.error?.message || "Giriş yapılırken bir hata oluştu",
          variant: "destructive",
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Admin login error:', error);
      
      toast({
        title: "Giriş Hatası",
        description: "Sunucu ile bağlantı kurulamadı",
        variant: "destructive",
      });

      return {
        success: false,
        error: {
          message: "Giriş yapılırken bir hata oluştu",
        },
      };
    } finally {
      this.authState.loading = false;
      this.notifyListeners();
    }
  }

  /**
   * Admin logout
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
    } finally {
      // Clear local state
      apiClient.clearAuth();
      this.authState.user = null;
      this.authState.isAuthenticated = false;
      this.notifyListeners();

      toast({
        title: "Çıkış Yapıldı",
        description: "Başarıyla çıkış yaptınız",
      });

      console.log('👋 Admin logout successful');
    }
  }

  /**
   * Get admin profile
   */
  async getProfile(): Promise<ApiResponse<AdminProfile>> {
    return apiClient.get<AdminProfile>('/auth/profile');
  }

  /**
   * Update admin profile
   */
  async updateProfile(updates: Partial<AdminProfile>): Promise<ApiResponse<AdminProfile>> {
    const response = await apiClient.put<AdminProfile>('/auth/profile', updates);
    
    if (response.success && response.data) {
      // Update local state
      this.authState.user = response.data;
      this.notifyListeners();
    }

    return response;
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh-token');
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.authState.user || !this.authState.isAuthenticated) {
      return false;
    }

    return this.authState.user.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    if (!this.authState.user || !this.authState.isAuthenticated) {
      return false;
    }

    return this.authState.user.role === role;
  }

  /**
   * Get current auth state
   */
  getAuthState(): AdminAuthState {
    return { ...this.authState };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AdminAuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.authState });
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AdminUser | null {
    return this.authState.user;
  }

  /**
   * Check if auth is initialized
   */
  isInitialized(): boolean {
    return this.authState.initialized;
  }

  /**
   * Check if auth is loading
   */
  isLoading(): boolean {
    return this.authState.loading;
  }
}

// Export singleton instance
export const adminAuthService = AdminAuthService.getInstance(); 