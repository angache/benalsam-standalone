import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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

// Types
export interface CategoryAttribute {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  path: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  display_priority: number;
  order_updated_at?: string;
  order_updated_by?: string;
  created_at: string;
  updated_at: string;
  ai_suggestions?: any;
  ai_enhanced: boolean;
  subcategories?: Category[];
  attributes?: CategoryAttribute[];
  category_attributes?: CategoryAttribute[];
  stats?: {
    subcategoryCount: number;
    totalSubcategories: number;
    attributeCount: number;
    totalAttributes: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Category Service
export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return response.data.data;
  },

  // Get single category by path
  async getCategory(path: string): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${encodeURIComponent(path)}`);
    return response.data.data;
  },

  // Update category
  async updateCategory(path: string, data: Partial<Category>): Promise<void> {
    await apiClient.put(`/categories/${encodeURIComponent(path)}`, data);
  },

  // Delete category
  async deleteCategory(path: string): Promise<void> {
    await apiClient.delete(`/categories/${encodeURIComponent(path)}`);
  },

  // Update category order
  async updateCategoryOrder(id: number, data: { sort_order: number; display_priority: number; is_featured: boolean }): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${id}/order`, data);
    return response.data;
  },

  // Toggle featured status
  async toggleFeatured(id: number): Promise<Category> {
    const response = await apiClient.post<Category>(`/categories/${id}/toggle-featured`);
    return response.data;
  },
}; 