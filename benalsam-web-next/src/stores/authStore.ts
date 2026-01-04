'use client'

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { fetchUserProfile } from '@/services/profileService';
// import { sharedRateLimitService } from '@/services/sharedRateLimitService'; // Not available in Next.js
import { User } from 'benalsam-shared-types';
import { logger } from '@/utils/production-logger';

interface AuthState {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; requires2FA?: boolean; userId?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  verify2FA: (userId: string, code: string) => Promise<{ error?: string }>;
}

// Enterprise Session Logger Service
const sessionLoggerService = {
  async logSessionActivity(action: 'login' | 'logout' | 'activity', metadata = {}) {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.warn('[AuthStore] No active session found for logging');
        return false;
      }

      // Call Edge Function for session logging
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/session-logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          metadata: {
            ...metadata,
            platform: 'web',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('[AuthStore] Enterprise Session Logger: Failed to log session activity', { error: errorData });
        return false;
      }

      const result = await response.json();
      logger.debug('[AuthStore] Enterprise Session Logger: Session activity logged successfully', { result });
      return true;
    } catch (error) {
      logger.error('[AuthStore] Enterprise Session Logger Error:', { error });
      return false;
    }
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Auto-initialize on store creation
  const initializeStore = async () => {
    logger.debug('[AuthStore] Auto-initializing...');
    set({ loading: true });
    
    try {
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [AuthStore] Session check result:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString()
      });
      
      if (session?.user) {
        // Set basic user info from session
        const basicUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'Kullanıcı',
          avatar_url: session.user.user_metadata?.avatar_url,
          rating: null,
          total_ratings: 0,
          rating_sum: 0,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at
        };
        
        logger.debug('[AuthStore] Setting basic user:', { 
          userId: basicUser.id, 
          userEmail: basicUser.email, 
          userName: basicUser.name 
        });
        set({ user: basicUser, currentUser: basicUser, loading: false, initialized: true });
        logger.debug('[AuthStore] Basic user set, profile will be fetched by React Query when needed');
      } else {
        logger.debug('[AuthStore] No session found');
        set({ user: null, currentUser: null, loading: false, initialized: true });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 [AuthStore] Auth state change:', { 
          event, 
          hasSession: !!session, 
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          timestamp: new Date().toISOString()
        });
        
        if (event === 'SIGNED_IN' && session?.user) {
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'Kullanıcı',
            avatar_url: session.user.user_metadata?.avatar_url,
            rating: null,
            total_ratings: 0,
            rating_sum: 0,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          };
          console.log('🔐 [AuthStore] User signed in, updating state:', { 
            userId: basicUser.id, 
            userEmail: basicUser.email, 
            userName: basicUser.name 
          });
          set({ user: basicUser, currentUser: basicUser, loading: false });
          console.log('🔐 [AuthStore] User signed in, state updated');
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 [AuthStore] User signed out');
          set({ user: null, currentUser: null, loading: false });
        }
      });
      } catch (error) {
        logger.error('[AuthStore] Initialize error:', { error });
      set({ user: null, currentUser: null, loading: false, initialized: true });
    }
  };

  // Start initialization immediately
  initializeStore();

  return {
    user: null,
    currentUser: null,
    loading: false,
    initialized: false,

    signIn: async (email: string, password: string) => {
      console.log('🔐 [AuthStore] Sign in attempt:', { email });
      set({ loading: true });
      
      try {
              // Rate limit check
      // Simple rate limiting - check localStorage for recent attempts
      const rateLimitKey = `rate_limit_${email}`;
      const lastAttempt = localStorage.getItem(rateLimitKey);
      const now = Date.now();
      const rateLimitCheck = { allowed: true };
      
      if (lastAttempt) {
        const timeDiff = now - parseInt(lastAttempt);
        if (timeDiff < 60000) { // 1 minute cooldown
          rateLimitCheck.allowed = false;
        }
      }
      console.log('🔐 [AuthStore] Rate limit check:', rateLimitCheck);
        
        if (!rateLimitCheck.allowed) {
          let errorMsg = '';
          if (rateLimitCheck.error === 'ACCOUNT_LOCKED') {
            errorMsg = `Hesabınız güvenlik nedeniyle kilitlendi. ${Math.ceil(rateLimitCheck.timeRemaining / 60)} dakika sonra tekrar deneyin.`;
          } else if (rateLimitCheck.error === 'TOO_MANY_ATTEMPTS') {
            errorMsg = `Çok fazla başarısız deneme. ${Math.ceil(rateLimitCheck.timeRemaining / 60)} dakika sonra tekrar deneyin.`;
          } else if (rateLimitCheck.error === 'PROGRESSIVE_DELAY') {
            errorMsg = `Çok hızlı deneme yapıyorsunuz. ${rateLimitCheck.timeRemaining} saniye bekleyin.`;
          } else if (rateLimitCheck.message) {
            errorMsg = rateLimitCheck.message;
          } else {
            errorMsg = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
          }
          
          console.log('🔐 [AuthStore] Rate limit exceeded:', errorMsg);
          set({ loading: false });
          return { error: errorMsg };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('🔐 [AuthStore] Sign in result:', { 
          hasData: !!data, 
          hasError: !!error, 
          userId: data?.user?.id,
          userEmail: data?.user?.email 
        });

        if (error) {
          console.error('🔐 [AuthStore] Sign in error:', error);
          
                  // Record failed attempt for rate limiting
        // Record failed attempt in localStorage
        localStorage.setItem(rateLimitKey, now.toString());
          
          set({ loading: false });
          return { error: error.message };
        }

        if (data.user && data.session) {
          // Enterprise Session Logging
          console.log('🔐 [AuthStore] Enterprise Session: Logging login activity...');
          await sessionLoggerService.logSessionActivity(
            'login',
            { user_id: data.user.id, email: data.user.email }
          );

          // Check if user has 2FA enabled
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_2fa_enabled')
            .eq('id', data.user.id)
            .single();

          if (profile?.is_2fa_enabled) {
            console.log('🔐 [AuthStore] 2FA enabled for user:', data.user.email);
            // 2FA gerektiğinde session oluşturma, sadece bilgi döndür
            set({ loading: false });
            return { error: '2FA_REQUIRED', requires2FA: true, userId: data.user.id };
          }

          const basicUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'Kullanıcı',
            avatar_url: data.user.user_metadata?.avatar_url,
            rating: null,
            total_ratings: 0,
            rating_sum: 0,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at
          };
          console.log('🔐 [AuthStore] Setting user after sign in:', { 
            userId: basicUser.id, 
            userEmail: basicUser.email, 
            userName: basicUser.name 
          });
          
          // Reset rate limit on successful login
          // Reset rate limit on successful login
          localStorage.removeItem(rateLimitKey);
          
          set({ user: basicUser, currentUser: basicUser, loading: false });
        }

        return {};
      } catch (error) {
        console.error('🔐 [AuthStore] Sign in exception:', error);
        set({ loading: false });
        return { error: 'Giriş yapılırken bir hata oluştu' };
      }
    },

        verify2FA: async (userId: string, code: string, email?: string, password?: string) => {
      console.log('🔐 [AuthStore] 2FA verification attempt:', { userId });
      set({ loading: true });
      
      try {
        // Backend'e 2FA doğrulama isteği gönder (session olmadan)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            token: code
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('🔐 [AuthStore] 2FA verification failed:', result);
          set({ loading: false });
          return { error: result.message || '2FA doğrulama başarısız' };
        }

        // Doğrulama başarılı, şimdi session oluştur
        console.log('🔐 [AuthStore] 2FA verification successful, creating session...');
        console.log('🔐 [AuthStore] Email and password check:', { hasEmail: !!email, hasPassword: !!password });
        
        // Email ve password ile tekrar login yap
        if (email && password) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (loginError) {
            console.error('🔐 [AuthStore] Login after 2FA failed:', loginError);
            set({ loading: false });
            return { error: 'Giriş yapılamadı' };
          }

          if (loginData.user) {
            // Kullanıcı bilgilerini getir
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', loginData.user.id)
              .single();

            if (profile) {
              const basicUser = {
                id: profile.id,
                email: profile.email,
                name: profile.name || 'Kullanıcı',
                avatar_url: profile.avatar_url,
                rating: profile.rating,
                total_ratings: profile.total_ratings,
                rating_sum: profile.rating_sum,
                created_at: profile.created_at,
                updated_at: profile.updated_at
              };

              console.log('🔐 [AuthStore] 2FA verification successful, setting user:', { 
                userId: basicUser.id, 
                userEmail: basicUser.email 
              });
              
              // Session oluştur ve kullanıcıyı set et
              set({ user: basicUser, currentUser: basicUser, loading: false });
              
              // Enterprise Session Logging
              await sessionLoggerService.logSessionActivity(
                'login',
                { user_id: basicUser.id, email: basicUser.email, method: '2fa_verified' }
              );
              
              console.log('🔐 [AuthStore] 2FA session created successfully');
            }
          }
        }

        return {};
      } catch (error) {
        console.error('🔐 [AuthStore] 2FA verification error:', error);
        set({ loading: false });
        return { error: '2FA doğrulama hatası' };
      }
    },

    signUp: async (email: string, password: string, name: string) => {
      console.log('🔐 [AuthStore] Sign up attempt:', { email, name });
      set({ loading: true });
      try {
        const avatar_url = `https://source.boringavatars.com/beam/120/${name.replace(/\s+/g, '') || 'benalsamUser'}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              avatar_url,
            },
          },
        });

        console.log('🔐 [AuthStore] Sign up result:', { 
          hasData: !!data, 
          hasError: !!error, 
          userId: data?.user?.id,
          userEmail: data?.user?.email 
        });

        if (error) {
          console.error('🔐 [AuthStore] Sign up error:', error);
          set({ loading: false });
          return { error: error.message };
        }

        if (data.user && data.session) {
          // Enterprise Session Logging for signup
          console.log('🔐 [AuthStore] Enterprise Session: Logging signup activity...');
          await sessionLoggerService.logSessionActivity(
            'login',
            { user_id: data.user.id, email: data.user.email }
          );

          // Update profile with avatar_url
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              name, 
              avatar_url,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          if (profileError) {
            console.error("🔐 [AuthStore] Error updating profile on signup:", profileError);
          }

          const basicUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || name,
            avatar_url: data.user.user_metadata?.avatar_url || avatar_url,
            rating: null,
            total_ratings: 0,
            rating_sum: 0,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at
          };
          console.log('🔐 [AuthStore] Setting user after sign up:', { 
            userId: basicUser.id, 
            userEmail: basicUser.email, 
            userName: basicUser.name 
          });
          set({ user: basicUser, currentUser: basicUser, loading: false });
        }

        return {};
      } catch (error) {
        console.error('🔐 [AuthStore] Sign up exception:', error);
        set({ loading: false });
        return { error: 'Kayıt olurken bir hata oluştu' };
      }
    },

    signOut: async () => {
      console.log('🔐 [AuthStore] Starting robust sign out process');
      set({ loading: true });
      
      try {
        const currentUser = get().user;
        
        // ÖNEMLİ: State'i hemen temizle (UI responsiveness için)
        set({ 
          user: null, 
          currentUser: null,
          loading: true 
        });
        
        // 1. Enterprise session logging (hata olsa da devam et)
        if (currentUser?.id) {
          try {
            // Session kontrolü YAP
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session && !error) {
              // Session geçerliyse logout logla
              console.log('🔐 [AuthStore] Enterprise Session: Logging logout activity...');
              await sessionLoggerService.logSessionActivity(
                'logout',
                { user_id: currentUser.id, email: currentUser.email }
              );
            } else {
              console.warn('🔐 [AuthStore] No valid session for logging, skipping enterprise log');
            }
          } catch (logError) {
            console.warn('🔐 [AuthStore] Enterprise logging failed (continuing)', logError);
          }
        }
        
        // 2. Robust Supabase SignOut
        try {
          // Önce session durumunu kontrol et
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session && !sessionError) {
            // Session geçerliyse normal signOut
            console.log('🔐 [AuthStore] Valid session found, attempting normal signOut');
            const { error } = await supabase.auth.signOut({ scope: 'global' });
            
            if (error) {
              console.warn('🔐 [AuthStore] Normal signOut failed, forcing client cleanup', error);
              // Hata olsa bile client-side cleanup devam et
            } else {
              console.log('🔐 [AuthStore] Normal signOut successful');
            }
          } else {
            console.warn('🔐 [AuthStore] No valid session found, performing client-side cleanup only');
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
              console.warn('🔐 [AuthStore] Private method cleanup failed, continuing with storage cleanup');
            }
            
            // Storage'ı manuel temizle
            try {
              // @ts-ignore - protected property but necessary for cleanup
              const storage = supabase.auth.storage;
              if (storage) {
                await storage.removeItem('sb-auth-token');
                await storage.removeItem('supabase.auth.token');
                await storage.removeItem('supabase.auth.refreshToken');
                await storage.removeItem('supabase.auth.expires_at');
              }
            } catch (storageError) {
              console.warn('🔐 [AuthStore] Storage cleanup failed, continuing');
            }
            
            console.log('🔐 [AuthStore] Forced client cleanup completed');
          } catch (cleanupError) {
            console.warn('🔐 [AuthStore] Force cleanup failed', cleanupError);
          }
          
        } catch (supabaseError) {
          console.error('🔐 [AuthStore] Supabase signOut completely failed, doing manual cleanup', supabaseError);
        }
        
        // 3. Local Storage cleanup (her zaman yap)
        try {
          // Local storage'dan auth related key'leri temizle
          const authKeys = [
            'sb-auth-token',
            'supabase.auth.token',
            'supabase.auth.refreshToken',
            'supabase.auth.expires_at',
            'supabase.auth.user'
          ];
          
          authKeys.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn(`🔐 [AuthStore] Failed to remove ${key} from localStorage`);
            }
          });
          
          // Session storage'dan da temizle
          authKeys.forEach(key => {
            try {
              sessionStorage.removeItem(key);
            } catch (e) {
              console.warn(`🔐 [AuthStore] Failed to remove ${key} from sessionStorage`);
            }
          });
          
          console.log('🔐 [AuthStore] Local storage cleanup completed');
        } catch (storageError) {
          console.warn('🔐 [AuthStore] Local storage cleanup failed', storageError);
        }
        
        // 4. Cookies cleanup
        try {
          // Auth related cookies'leri temizle
          const authCookies = [
            'sb-auth-token',
            'supabase.auth.token',
            'supabase.auth.refreshToken'
          ];
          
          authCookies.forEach(cookieName => {
            try {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            } catch (e) {
              console.warn(`🔐 [AuthStore] Failed to remove cookie ${cookieName}`);
            }
          });
          
          console.log('🔐 [AuthStore] Cookies cleanup completed');
        } catch (cookieError) {
          console.warn('🔐 [AuthStore] Cookies cleanup failed', cookieError);
        }
        
        // 5. Final state cleanup
        set({ 
          user: null, 
          currentUser: null, 
          loading: false 
        });
        
        console.log('🔐 [AuthStore] User signed out successfully with comprehensive cleanup');
        
        // 6. Force page reload to clear any remaining state
        try {
          // Small delay to ensure all cleanup is complete
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } catch (reloadError) {
          console.warn('🔐 [AuthStore] Force reload failed', reloadError);
        }
        
      } catch (error) {
        console.error('🔐 [AuthStore] Sign out exception:', error);
        set({ loading: false });
      }
    },

    initialize: async () => {
      // This function is kept for compatibility but auto-initialization is handled in store creation
      console.log('🔐 [AuthStore] Manual initialize called (auto-initialization already running)');
    },
  };
}); 