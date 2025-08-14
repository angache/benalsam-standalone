import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabaseClient';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { AuthService } from '../services/authService';
import { DebugLogger } from '../services/debugLogger';
import { fcmTokenService } from '../services/fcmTokenService';
import type { User } from '../types';

// Enterprise Session Logger Service
const sessionLoggerService = {
  async logSessionActivity(action: 'login' | 'logout' | 'activity', metadata = {}) {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        DebugLogger.warn('No active session found for logging');
        return false;
      }

      // Call Edge Function for session logging
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/session-logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          metadata: {
            ...metadata,
            platform: 'mobile',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        DebugLogger.error('Enterprise Session Logger: Failed to log session activity', errorData);
        return false;
      }

      const result = await response.json();
      DebugLogger.info('Enterprise Session Logger: Session activity logged successfully', result);
      return true;
    } catch (error) {
      DebugLogger.error('Enterprise Session Logger Error:', error);
      return false;
    }
  }
};

interface AuthState {
  // State
  user: User | null;
  loading: boolean;
  initialized: boolean;
  requires2FA: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRequires2FA: (requires: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  signInWithSession: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<void>;
  initialize: () => Promise<void>;
  reset: () => void;
  clearExpiredSession: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      loading: true,
      initialized: false,
      requires2FA: false,

      // Actions
      setUser: (user) => {
        console.log('🔵 [AuthStore] Setting user:', user ? 'User exists' : 'No user');
        set({ user });
      },
      
      setLoading: (loading) => {
        console.log('🔵 [AuthStore] Setting loading:', loading);
        set({ loading });
      },
      
      setRequires2FA: (requires) => {
        console.log('🔵 [AuthStore] Setting requires2FA:', requires);
        set({ requires2FA: requires });
      },

      signIn: async (email: string, password: string) => {
        try {
          console.log('🟡 [AuthStore] Starting sign in process...');
          set({ loading: true });
          
          const result = await AuthService.signIn(email, password);
          
          if (result.error) {
            throw new Error(result.error);
          }

          if (result.user) {
            // Check if 2FA is required
            const { TwoFactorService } = await import('../services/twoFactorService');
            const requires2FA = await TwoFactorService.requiresTwoFactor(result.user.id);
            
            if (requires2FA) {
              console.log('🟡 [AuthStore] 2FA required, clearing session and navigating to verification screen');
              
              // Enterprise Security: Clear session before 2FA verification
              const { supabase } = await import('../services/supabaseClient');
              await supabase.auth.signOut();
              
              // Store pending credentials for 2FA verification
              set({ 
                user: null, // Don't set user yet
                loading: false,
                requires2FA: true
              });
              
              // Direct navigation to 2FA screen with retry mechanism
              const attemptNavigation = async (retryCount = 0) => {
                const { NavigationService } = await import('../services/navigationService');
                
                // Check if NavigationService is ready
                if (NavigationService.isReady()) {
                  NavigationService.navigate('TwoFactorVerify', {
                    userId: result.user.id,
                    email: email,
                    password: password
                  });
                } else if (retryCount < 10) {
                  // Retry after 200ms if not ready (max 10 times = 2 seconds)
                  setTimeout(() => attemptNavigation(retryCount + 1), 200);
                } else {
                  console.warn('NavigationService not ready after retries');
                }
              };
              
              setTimeout(attemptNavigation, 100);
              
              return;
            }
            
            set({ user: result.user });
            console.log('🟢 [AuthStore] Sign in successful');
          } else {
            throw new Error('No user returned from AuthService');
          }
          
        } catch (error) {
          console.error('🔴 [AuthStore] Error in signIn flow:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      signUp: async (email: string, password: string, username: string) => {
        try {
          set({ loading: true });
          
          const result = await AuthService.signUp(email, password, username);
          
          if (result.error) {
            throw new Error(result.error);
          }

          if (result.user) {
            set({ user: result.user });
            console.log('🟢 [AuthStore] Sign up successful');
          } else {
            throw new Error('No user returned from AuthService');
          }
        } catch (error) {
          console.error('🔴 [AuthStore] Error in signUp flow:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        try {
          DebugLogger.info('Starting robust sign out process');
          const currentUser = get().user;
          
          // ÖNEMLİ: State'i hemen temizle (UI responsiveness için)
          set({ 
            user: null,
            loading: true
          });
          
          // 1. Enterprise session logging (hata olsa da devam et)
          if (currentUser?.id) {
            try {
              // Session kontrolü YAP
              const { data: { session }, error } = await supabase.auth.getSession();
              
              if (session && !error) {
                // Session geçerliyse logout logla
                await sessionLoggerService.logSessionActivity('logout', { 
                  user_id: currentUser.id 
                });
              } else {
                DebugLogger.warn('No valid session for logging, skipping enterprise log');
              }
            } catch (logError) {
              DebugLogger.warn('Enterprise logging failed (continuing)', logError);
            }
          }
          
          // 2. FCM token temizle (her zaman yap)
          if (currentUser) {
            try {
              await fcmTokenService.onUserLogout(currentUser.id);
            } catch (fcmError) {
              DebugLogger.warn('FCM cleanup failed (continuing)', fcmError);
            }
          }
          
          // 3. Robust Supabase SignOut
          try {
            // Önce session durumunu kontrol et
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (session && !sessionError) {
              // Session geçerliyse normal signOut
              DebugLogger.info('Valid session found, attempting normal signOut');
              const { error } = await supabase.auth.signOut({ scope: 'global' });
              
              if (error) {
                DebugLogger.warn('Normal signOut failed, forcing client cleanup', error);
                // Hata olsa bile client-side cleanup devam et
              } else {
                DebugLogger.info('Normal signOut successful');
              }
            } else {
              DebugLogger.warn('No valid session found, performing client-side cleanup only');
            }
            
            // FORCE CLIENT CLEANUP (session geçerli olsun olmasın)
            try {
              // Manual cleanup - Supabase'in private method'larını kullanmaya çalış
              try {
                // @ts-ignore - private method but necessary for cleanup
                if ((supabase.auth as any)._removeSession) {
                  await (supabase.auth as any)._removeSession();
                }
              } catch (privateError) {
                DebugLogger.warn('Private method cleanup failed, continuing with storage cleanup');
              }
              
              // Storage'ı manuel temizle
              try {
                // @ts-ignore - protected property but necessary for cleanup
                const storage = supabase.auth.storage;
                if (storage) {
                  await storage.removeItem('sb-auth-token');
                  await storage.removeItem('subabase.auth.token');
                }
              } catch (storageError) {
                DebugLogger.warn('Storage cleanup failed, continuing');
              }
              
              DebugLogger.info('Forced client cleanup completed');
            } catch (cleanupError) {
              DebugLogger.warn('Force cleanup failed', cleanupError);
            }
            
          } catch (supabaseError) {
            DebugLogger.error('Supabase signOut completely failed, doing manual cleanup', supabaseError);
          }
          
          // 4. AuthService cleanup
          try {
            // AuthService'de clearToken yok, bu adımı atla
            DebugLogger.info('AuthService cleanup skipped (no clearToken method)');
          } catch (authError) {
            DebugLogger.warn('AuthService cleanup failed', authError);
          }
          
          // 5. Storage cleanup (her zaman yap)
          try {
            // Persist storage temizle
            await AsyncStorage.removeItem('auth-storage');
            
            // Diğer auth related key'leri temizle
            const authKeys = [
              'sb-auth-token',
              'supabase.auth.token',
              'supabase.auth.refreshToken',
              'supabase.auth.expires_at'
            ];
            
            await Promise.allSettled(
              authKeys.map(key => AsyncStorage.removeItem(key))
            );
            
            DebugLogger.info('Storage cleanup completed');
          } catch (storageError) {
            DebugLogger.warn('Storage cleanup failed', storageError);
          }
          
          // 6. SecureStore cleanup
          try {
            const secureKeys = [
              'supabase.auth.token',
              'sb-auth-token'
            ];
            
            await Promise.allSettled(
              secureKeys.map(key => SecureStore.deleteItemAsync(key))
            );
            
            DebugLogger.info('SecureStore cleanup completed');
          } catch (secureError) {
            DebugLogger.warn('SecureStore cleanup failed', secureError);
          }
          
          // 7. AGGRESSIVE CLEANUP - Tüm storage'ı temizle
          try {
            DebugLogger.info('Starting aggressive cleanup...');
            
            // AsyncStorage'ı tamamen temizle
            await AsyncStorage.clear();
            DebugLogger.info('AsyncStorage completely cleared');
            
            // SecureStore'u temizle
            const allSecureKeys = [
              'supabase.auth.token',
              'sb-auth-token',
              'supabase.auth.refreshToken',
              'supabase.auth.expires_at',
              'supabase.auth.user'
            ];
            
            await Promise.allSettled(
              allSecureKeys.map(key => SecureStore.deleteItemAsync(key))
            );
            DebugLogger.info('SecureStore completely cleared');
            
          } catch (aggressiveError) {
            DebugLogger.warn('Aggressive cleanup failed', aggressiveError);
          }
          
          // 8. SUPABASE CLIENT RESET
          try {
            DebugLogger.info('Resetting Supabase client...');
            
            // Global signOut
            await supabase.auth.signOut({ scope: 'global' });
            
            // Client'ı force reset et
            // @ts-ignore - private method
            if ((supabase.auth as any)._removeSession) {
              await (supabase.auth as any)._removeSession();
            }
            
            // Storage'ı manuel temizle
            // @ts-ignore - protected property
            const storage = supabase.auth.storage;
            if (storage) {
              await storage.removeItem('sb-auth-token');
              await storage.removeItem('supabase.auth.token');
              await storage.removeItem('supabase.auth.refreshToken');
              await storage.removeItem('supabase.auth.expires_at');
            }
            
            DebugLogger.info('Supabase client reset completed');
            
          } catch (resetError) {
            DebugLogger.warn('Supabase client reset failed', resetError);
          }
          
          // 9. Final verification
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              DebugLogger.warn('Session still exists after aggressive cleanup - APP RESTART REQUIRED');
              
              // App restart önerisi
              DebugLogger.error('CRITICAL: Session persistence detected. App restart required for complete cleanup.');
              
              // 3 saniye sonra app'i restart et
              setTimeout(() => {
                DebugLogger.info('Forcing app restart in 3 seconds...');
                // Expo'da app restart için
                if ((global as any).__EXPO__) {
                  // @ts-ignore
                  (global as any).__EXPO__.reload();
                }
              }, 3000);
              
            } else {
              DebugLogger.info('Session successfully cleared after aggressive cleanup');
            }
          } catch (verifyError) {
            DebugLogger.warn('Session verification failed', verifyError);
          }
          
          DebugLogger.info('Ultra-robust signOut completed');
          
        } catch (error) {
          DebugLogger.error('SignOut error', error);
          // Hata olsa bile state temizle
          set({ 
            user: null,
            loading: false
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          const { user } = get();
          if (!user) throw new Error('No user logged in');

          set({ loading: true });

          // Önce Supabase'e gönder
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) throw error;

          // Başarılı olursa store'u güncelle
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });

          // Profil verisini yeniden çek
          const { data: refreshedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (refreshedProfile) {
            set({ user: refreshedProfile });
          }

          return refreshedProfile || updatedUser;
        } catch (error) {
          console.error('Error updating profile:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      signInWithSession: async () => {
        try {
          set({ loading: true });
          
          const result = await AuthService.signInWithSession();
          
          if (result.error) {
            console.error('🔴 [AuthStore] Session sign in error:', result.error);
            return false;
          }

          if (result.user) {
            set({ user: result.user });
            console.log('🟢 [AuthStore] Session sign in successful');
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('🔴 [AuthStore] Error in signInWithSession:', error);
          return false;
        } finally {
          set({ loading: false });
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          console.log('🔍 [AuthStore] Fetching user profile for ID:', userId);
          
          const user = await AuthService.fetchUserProfile(userId);
          
          if (user) {
            set({ user });
            console.log('✅ [AuthStore] Profile fetched successfully');
          } else {
            set({ user: null });
            console.log('❌ [AuthStore] No profile found');
          }
        } catch (error) {
          console.error('❌ [AuthStore] Error fetching user profile:', error);
          set({ user: null });
        }
      },

      initialize: async () => {
        try {
          console.log('🟡 [AuthStore] Starting initialization...');
          set({ loading: true });
          
          // Önce expired session'ları temizle
          const expiredCleared = await get().clearExpiredSession();
          if (expiredCleared) {
            console.log('🔄 [AuthStore] Expired session cleared during initialization');
          }
          
          // Check current session with detailed logging
          let { data: { session }, error: sessionError } = await supabase.auth.getSession();
          console.log('🔵 [AuthStore] Initial session check result:', {
            hasSession: !!session,
            sessionError: sessionError?.message,
            sessionUser: session?.user?.id,
            sessionExpiresAt: session?.expires_at,
            sessionAccessToken: session?.access_token ? 'EXISTS' : 'MISSING',
            sessionRefreshToken: session?.refresh_token ? 'EXISTS' : 'MISSING',
            currentTime: new Date().toISOString()
          });
          
          // If no session, check if we have refresh token before attempting refresh
          if (!session) {
            console.log('🔄 [AuthStore] No session found, checking for refresh token...');
            
            // Check if we have any stored tokens before attempting refresh
            try {
              const hasRefreshToken = await SecureStore.getItemAsync('supabase.auth.refreshToken');
              const hasAuthToken = await SecureStore.getItemAsync('supabase.auth.token');
              
              if (hasRefreshToken || hasAuthToken) {
                console.log('🔄 [AuthStore] Found stored tokens, attempting to refresh...');
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError) {
                  console.log('❌ [AuthStore] Session refresh failed (expected if no valid refresh token):', refreshError.message);
                  // This is normal - no valid refresh token means user needs to login again
                  console.log('🔄 [AuthStore] No valid refresh token, user needs to login');
                  set({ user: null, loading: false, initialized: true });
                  return;
                } else {
                  session = refreshData.session;
                  console.log('🔄 [AuthStore] Session refresh successful:', {
                    hasSession: !!session,
                    sessionUser: session?.user?.id,
                    sessionExpiresAt: session?.expires_at
                  });
                }
              } else {
                console.log('🔄 [AuthStore] No stored tokens found, user needs to login');
                set({ user: null, loading: false, initialized: true });
                return;
              }
            } catch (tokenCheckError) {
              console.log('🔄 [AuthStore] Error checking stored tokens:', tokenCheckError);
              set({ user: null, loading: false, initialized: true });
              return;
            }
          }
          
          if (session?.user) {
            console.log('🟢 [AuthStore] Found existing session, fetching profile...');
            await get().fetchUserProfile(session.user.id);
          } else {
            console.log('🔴 [AuthStore] No session found during initialization');
            // Clear user state if no session
            set({ user: null });
          }

          // Setup auth state listener
          AuthService.setupAuthStateListener(async (event: string, session) => {
            console.log('🔄 [AuthStore] Auth state changed:', {
              event,
              hasSession: !!session,
              sessionUser: session?.user?.id,
              sessionExpiresAt: session?.expires_at
            });
            
            if (event === 'SIGNED_IN') {
              console.log('🟢 [AuthStore] User signed in, fetching profile...');
              if (session?.user) {
                await get().fetchUserProfile(session.user.id);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('🟢 [AuthStore] User signed out, clearing user state...');
              set({ user: null });
            } else if (event === 'USER_UPDATED') {
              console.log('🟢 [AuthStore] User updated, refreshing profile...');
              if (session?.user) {
                await get().fetchUserProfile(session.user.id);
              }
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('🔄 [AuthStore] Token refreshed, session updated');
            }
            
            set({ loading: false });
          });

          console.log('🟢 [AuthStore] Initialization complete');
          set({ initialized: true, loading: false });
        } catch (error) {
          console.error('🔴 [AuthStore] Error during initialization:', error);
          set({ loading: false });
        }
      },

      reset: () => {
        set({ user: null, loading: false, initialized: false });
      },

      // Ek helper fonksiyon - expired session'ları temizlemek için
      clearExpiredSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            DebugLogger.info('No session to clear');
            return false;
          }
          
          // Session expire kontrolü
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at <= now) {
            DebugLogger.warn('Found expired session, performing aggressive cleanup...');
            
            // 1. State'i temizle
            set({ user: null });
            
            // 2. AsyncStorage'ı tamamen temizle
            await AsyncStorage.clear();
            DebugLogger.info('AsyncStorage cleared for expired session');
            
            // 3. SecureStore'u temizle
            const secureKeys = [
              'supabase.auth.token',
              'sb-auth-token',
              'supabase.auth.refreshToken',
              'supabase.auth.expires_at',
              'supabase.auth.user'
            ];
            
            await Promise.allSettled(
              secureKeys.map(key => SecureStore.deleteItemAsync(key))
            );
            DebugLogger.info('SecureStore cleared for expired session');
            
            // 4. Supabase client'ı temizle
            await supabase.auth.signOut({ scope: 'global' });
            
            // 5. Client'ı force reset et
            try {
              // @ts-ignore - private method
              if ((supabase.auth as any)._removeSession) {
                await (supabase.auth as any)._removeSession();
              }
            } catch (privateError) {
              DebugLogger.warn('Private method cleanup failed for expired session');
            }
            
            // 6. Storage'ı manuel temizle
            try {
              // @ts-ignore - protected property
              const storage = supabase.auth.storage;
              if (storage) {
                await storage.removeItem('sb-auth-token');
                await storage.removeItem('supabase.auth.token');
                await storage.removeItem('supabase.auth.refreshToken');
                await storage.removeItem('supabase.auth.expires_at');
              }
            } catch (storageError) {
              DebugLogger.warn('Storage cleanup failed for expired session');
            }
            
            DebugLogger.info('Expired session aggressively cleared');
            return true;
          }
          
          return false;
        } catch (error) {
          DebugLogger.error('Clear expired session error', error);
          return false;
        }
      },

      resetPassword: async (email: string) => {
        try {
          const { supabase } = await import('../services/supabaseClient');
          const { AuthService } = await import('../services/authService');
          const { DebugLogger } = await import('../services/debugLogger');

          const result = await AuthService.resetPassword(email);

          if (result.error) {
            DebugLogger.error('Password reset failed:', result.error);
            return { success: false, error: result.error };
          }

          DebugLogger.info('Password reset email sent successfully');
          return { success: true };
        } catch (error) {
          DebugLogger.error('Error sending password reset email:', error);
          return { success: false, error: 'Failed to send password reset email' };
        }
      },

      updatePassword: async (newPassword: string) => {
        try {
          const { supabase } = await import('../services/supabaseClient');
          const { AuthService } = await import('../services/authService');
          const { DebugLogger } = await import('../services/debugLogger');

          const result = await AuthService.updatePassword(newPassword);

          if (result.error) {
            DebugLogger.error('Password update failed:', result.error);
            return { success: false, error: result.error };
          }

          DebugLogger.info('Password updated successfully');
          return { success: true };
        } catch (error) {
          DebugLogger.error('Error updating password:', error);
          return { success: false, error: 'Failed to update password' };
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        initialized: state.initialized,
      }),
    }
  )
); 