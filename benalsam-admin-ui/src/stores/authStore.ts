import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../services/api';
import { apiService } from '../services/api';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requires2FA: boolean;
  pendingCredentials: { email: string; password: string } | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; userId?: string }>;
  verify2FA: (userId: string, code: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setRequires2FA: (requires: boolean) => void;
  setPendingCredentials: (credentials: { email: string; password: string } | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requires2FA: false,
      pendingCredentials: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.login({ email, password });
          
          // Check if 2FA is required
          if (response.requires2FA) {
            console.log('🔐 [AdminAuthStore] 2FA required for admin login');
            set({
              isLoading: false,
              requires2FA: true,
              pendingCredentials: { email, password }
            });
            return { success: false, requires2FA: true, userId: response.admin.id };
          }
          
          set({
            user: {
              id: response.admin.id,
              email: response.admin.email,
              name: `${response.admin.first_name} ${response.admin.last_name}`,
              role: response.admin.role,
              status: 'ACTIVE' as const,
              createdAt: response.admin.created_at,
              lastLoginAt: response.admin.last_login,
              permissions: response.admin.permissions,
            },
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requires2FA: false,
            pendingCredentials: null,
          });
          
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false };
        }
      },

      verify2FA: async (userId: string, code: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Use new verify-and-login endpoint
          console.log('🔐 [AdminAuthStore] 2FA verification and login attempt');
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/verify-and-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              token: code,
              email,
              password
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false, error: data.message || '2FA verification failed' });
            return { success: false, error: data.message };
          }

          // 2FA verification and login successful
          console.log('🔐 [AdminAuthStore] 2FA verification and login successful');
          
          set({
            user: {
              id: data.data.admin.id,
              email: data.data.admin.email,
              name: `${data.data.admin.first_name} ${data.data.admin.last_name}`,
              role: data.data.admin.role,
              status: 'ACTIVE' as const,
              createdAt: data.data.admin.created_at,
              lastLoginAt: data.data.admin.last_login,
              permissions: data.data.admin.permissions,
            },
            token: data.data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requires2FA: false,
            pendingCredentials: null,
          });
          
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '2FA verification failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setRequires2FA: (requires: boolean) => {
        set({ requires2FA: requires });
      },

      setPendingCredentials: (credentials: { email: string; password: string } | null) => {
        set({ pendingCredentials: credentials });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 