import { supabase } from './supabaseClient';
import { User } from '../types';
import { fcmTokenService } from './fcmTokenService';
import ipChangeDetectionService from './ipChangeDetectionService';
import { sharedRateLimitService } from './sharedRateLimitService';

// Enterprise Session Logger Service
const sessionLoggerService = {
  async logSessionActivity(action: 'login' | 'logout' | 'activity', metadata = {}) {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No active session found for logging');
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
        console.error('❌ Enterprise Session Logger: Failed to log session activity', errorData);
        return false;
      }

      const result = await response.json();
      console.log('✅ Enterprise Session Logger: Session activity logged successfully', result);
      return true;
    } catch (error) {
      console.error('❌ Enterprise Session Logger Error:', error);
      return false;
    }
  }
};

export class AuthService {
  /**
   * Kullanıcı girişi
   */
  static async signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    try {
      console.log('🟡 [AuthService] Starting sign in process...');
      
      // Rate limit check
      const rateLimitCheck = await sharedRateLimitService.checkRateLimit(email);
      console.log('🛡️ [AuthService] Rate limit check:', rateLimitCheck);
      
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
        
        console.log('🛡️ [AuthService] Rate limit exceeded:', errorMsg);
        return { user: null, error: errorMsg };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('🔴 [AuthService] Supabase auth error:', error);
        
        // Record failed attempt for rate limiting
        await sharedRateLimitService.recordFailedAttempt(email);
        
        return { user: null, error: error.message };
      }

      if (!data.session) {
        console.error('🔴 [AuthService] No session returned after login');
        return { user: null, error: 'Login successful but no session created' };
      }

      // Enterprise Session Logging
      console.log('🔐 Enterprise Session: Logging login activity...');
      await sessionLoggerService.logSessionActivity(
        'login',
        { user_id: data.session.user.id }
      );

      // Start IP Change Detection Service
      console.log('🔍 [AuthService] Starting IP Change Detection Service...');
      await ipChangeDetectionService.initialize();

      // Fetch user profile
      console.log('🟢 [AuthService] Auth successful, fetching profile...');
      const user = await this.fetchUserProfile(data.session.user.id);
      
      // FCM token'ı ayarla
      console.log('🔔 [AuthService] Setting up FCM token...');
      await fcmTokenService.onUserLogin(data.session.user.id);
      
      console.log('🟢 [AuthService] Profile fetched successfully');
      
      // Reset rate limit on successful login
      await sharedRateLimitService.resetRateLimit(email);
      
      return { user };
    } catch (error) {
      console.error('🔴 [AuthService] Error in signIn flow:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Kullanıcı kaydı
   */
  static async signUp(email: string, password: string, username: string): Promise<{ user: User | null; error?: string }> {
    try {
      console.log('🟡 [AuthService] Starting sign up process...');
      
      // Rate limit check
      const rateLimitCheck = await sharedRateLimitService.checkRateLimit(email);
      console.log('🛡️ [AuthService] Rate limit check for signup:', rateLimitCheck);
      
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
        
        console.log('🛡️ [AuthService] Rate limit exceeded for signup:', errorMsg);
        return { user: null, error: errorMsg };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      if (error) {
        console.error('🔴 [AuthService] Sign up error:', error);
        
        // Record failed attempt for rate limiting
        await sharedRateLimitService.recordFailedAttempt(email);
        
        return { user: null, error: error.message };
      }

      if (!data.user) {
        console.error('🔴 [AuthService] No user data returned after signup');
        return { user: null, error: 'Signup successful but no user data returned' };
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            username,
            created_at: new Date().toISOString(),
          },
        ]);
        
      if (profileError) {
        console.error('🔴 [AuthService] Profile creation error:', profileError);
        return { user: null, error: 'Failed to create user profile' };
      }

      // Enterprise Session Logging for signup
      console.log('🔐 Enterprise Session: Logging signup activity...');
      await sessionLoggerService.logSessionActivity(
        'login',
        { user_id: data.user.id }
      );

             const user: User = {
         id: data.user.id,
         email: data.user.email!,
         username,
         avatar_url: undefined,
         created_at: new Date().toISOString(),
       };

      console.log('🟢 [AuthService] Sign up successful');
      return { user };
    } catch (error) {
      console.error('🔴 [AuthService] Error in signUp flow:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Kullanıcı çıkışı
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🟡 [AuthService] Starting sign out process...');
      
      // Get current user info before signing out
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      
      // Try to log session activity first (if we have user info)
      if (currentUser?.id) {
        try {
          console.log('🔐 Enterprise Session: Logging logout activity...');
          await sessionLoggerService.logSessionActivity(
            'logout',
            { user_id: currentUser.id }
          );
        } catch (sessionError) {
          console.warn('⚠️ Session logging failed, continuing with logout:', sessionError);
        }
      }
      
      // Try to sign out from Supabase (but don't fail if it errors)
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('⚠️ Supabase signOut failed:', error);
        }
      } catch (signOutError) {
        console.warn('⚠️ Supabase signOut threw error:', signOutError);
      }
      
      console.log('🟢 [AuthService] Successfully signed out, cleaning up...');
      
      // FCM token'ı temizle
      if (currentUser) {
        console.log('🔔 [AuthService] Cleaning up FCM token...');
        await fcmTokenService.onUserLogout(currentUser.id);
      }
      
      console.log('🟢 [AuthService] Sign out complete');
      return { success: true };
      
    } catch (error) {
      console.error('🔴 [AuthService] Error in signOut flow:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Session ile giriş
   */
  static async signInWithSession(): Promise<{ user: User | null; error?: string }> {
    try {
      console.log('🟡 [AuthService] Checking existing session...');
      
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('🔴 [AuthService] Session check error:', error);
        return { user: null, error: error.message };
      }
      
      if (data.session?.user) {
        console.log('🟢 [AuthService] Found existing session, fetching profile...');
        
        // Enterprise Session Logging for existing session
        console.log('🔐 Enterprise Session: Logging existing session activity...');
        await sessionLoggerService.logSessionActivity(
          'login',
          { user_id: data.session.user.id }
        );
        
        // Start IP Change Detection Service
        console.log('🔍 [AuthService] Starting IP Change Detection Service...');
        await ipChangeDetectionService.initialize();
        
        const user = await this.fetchUserProfile(data.session.user.id);
        return { user };
      }
      
      console.log('🔴 [AuthService] No session found');
      return { user: null };
    } catch (error) {
      console.error('🔴 [AuthService] Error in signInWithSession:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Kullanıcı profilini getir
   */
  static async fetchUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('🔍 [AuthService] Fetching user profile for ID:', userId);
      
      // Önce session kontrolü
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 [AuthService] Session check during profile fetch:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        sessionUser: session?.user?.id,
        requestedUser: userId,
        sessionExpiresAt: session?.expires_at
      });
      
      if (sessionError) {
        console.error('❌ [AuthService] Session error:', sessionError);
        return null;
      }
      
      if (!session) {
        console.error('❌ [AuthService] No session found during profile fetch');
        return null;
      }
      
      console.log('✅ [AuthService] Session found, user ID:', session.user.id);
      console.log('✅ [AuthService] Session user matches requested ID:', session.user.id === userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [AuthService] Profile fetch error:', error);
        return null;
      }

      const user: User = {
        id: data.id,
        email: data.email,
        username: data.username,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
      };

      console.log('✅ [AuthService] Profile fetched successfully:', {
        userId: user.id,
        email: user.email,
        username: user.username
      });
      
      return user;
    } catch (error) {
      console.error('❌ [AuthService] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Auth state listener'ı kur
   */
  static setupAuthStateListener(onAuthStateChange: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthService] Auth state changed:', {
        event,
        hasSession: !!session,
        sessionUser: session?.user?.id,
        sessionExpiresAt: session?.expires_at
      });
      
      onAuthStateChange(event, session);
    });
  }

  /**
   * Şifre sıfırlama e-postası gönder
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🟡 [AuthService] Starting password reset for:', email);
      
      // Rate limit check
      const rateLimitCheck = await sharedRateLimitService.checkRateLimit(email);
      console.log('🛡️ [AuthService] Rate limit check for password reset:', rateLimitCheck);
      
      if (!rateLimitCheck.allowed) {
        let errorMsg = '';
        if (rateLimitCheck.error === 'ACCOUNT_LOCKED') {
          errorMsg = `Hesabınız güvenlik nedeniyle kilitlendi. ${Math.ceil(rateLimitCheck.timeRemaining / 60)} dakika sonra tekrar deneyin.`;
        } else if (rateLimitCheck.error === 'TOO_MANY_ATTEMPTS') {
          errorMsg = `Çok fazla deneme. ${Math.ceil(rateLimitCheck.timeRemaining / 60)} dakika sonra tekrar deneyin.`;
        } else if (rateLimitCheck.error === 'PROGRESSIVE_DELAY') {
          errorMsg = `Çok hızlı deneme yapıyorsunuz. ${rateLimitCheck.timeRemaining} saniye bekleyin.`;
        } else if (rateLimitCheck.message) {
          errorMsg = rateLimitCheck.message;
        } else {
          errorMsg = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
        }
        
        console.log('🛡️ [AuthService] Rate limit exceeded for password reset:', errorMsg);
        return { success: false, error: errorMsg };
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'benalsam://auth/reset-password',
      });
      
      if (error) {
        console.error('🔴 [AuthService] Password reset error:', error);
        
        // Record failed attempt for rate limiting
        await sharedRateLimitService.recordFailedAttempt(email);
        
        return { success: false, error: error.message };
      }
      
      console.log('🟢 [AuthService] Password reset email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('🔴 [AuthService] Error in resetPassword:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Şifre güncelle - Password Reset Token ile (Email linkinden gelen)
   */
  static async updatePasswordWithResetToken(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🟡 [AuthService] Starting password update with reset token...');
      
      // Password complexity validation
      const passwordValidation = this.validatePasswordComplexity(newPassword);
      if (!passwordValidation.isValid) {
        console.log('❌ [AuthService] Password complexity validation failed:', passwordValidation.error);
        return { success: false, error: passwordValidation.error };
      }

      console.log('✅ [AuthService] Password complexity validation passed');

      // Password reset token ile şifre güncelle
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        console.error('🔴 [AuthService] Password update error:', error);
        
        let errorMessage = 'Şifre güncellenemedi.';
        
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          errorMessage = 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı talep edin.';
        } else if (error.message?.includes('weak-password')) {
          errorMessage = 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.';
        } else if (error.message?.includes('same-password')) {
          errorMessage = 'Yeni şifre eski şifre ile aynı olamaz.';
        }
        
        return { success: false, error: errorMessage };
      }
      
      if (!data.user) {
        console.error('🔴 [AuthService] No user data returned after password update');
        return { success: false, error: 'Şifre güncellendi ancak kullanıcı bilgileri alınamadı.' };
      }
      
      console.log('🟢 [AuthService] Password updated successfully with reset token');
      
      // Enterprise Session Logging
      console.log('🔐 Enterprise Session: Logging password reset completion...');
      await sessionLoggerService.logSessionActivity(
        'activity',
        { action: 'password_reset_completed', user_id: data.user.id }
      );
      
      return { success: true };
    } catch (error) {
      console.error('🔴 [AuthService] Error in updatePasswordWithResetToken:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu' };
    }
  }

  /**
   * Gelişmiş şifre güncelleme - Storage error'ını handle eder
   */
  static async updatePasswordWithErrorHandling(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🟡 [AuthService] Starting password update using Supabase official method...');
      
      // Get current user email from session
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      if (!userEmail) {
        console.error('🔴 [AuthService] No user email found in session');
        return { success: false, error: 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.' };
      }
      
      console.log('🟡 [AuthService] Starting password update for:', userEmail);
      
      // Password complexity validation
      const passwordValidation = this.validatePasswordComplexity(newPassword);
      if (!passwordValidation.isValid) {
        console.log('❌ [AuthService] Password complexity validation failed:', passwordValidation.error);
        return { success: false, error: passwordValidation.error };
      }
      
      console.log('✅ [AuthService] Password complexity validation passed');
      
      // Supabase'in resmi önerisi: Önce mevcut şifre ile giriş yaparak doğrulama
      // Bu kısmı ChangePasswordScreen'de yapacağız, burada sadece updateUser çağırıyoruz
      
      // Şifre güncelleme
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        console.error('🔴 [AuthService] Password update error:', updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log('🟢 [AuthService] Password updated successfully');
      
      // Enterprise Session Logging
      console.log('🔐 Enterprise Session: Logging password change completion...');
      try {
        await sessionLoggerService.logSessionActivity(
          'activity',
          { action: 'password_changed', user_email: userEmail }
        );
        console.log('✅ [AuthService] Session logging completed successfully');
      } catch (error) {
        console.warn('⚠️ [AuthService] Session logging failed:', error);
        // Log the error but don't fail the password update
        // This ensures password change works even if logging fails
      }
      
      return { success: true };
    } catch (error) {
      console.error('🔴 [AuthService] Error in updatePasswordWithErrorHandling:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu' };
    }
  }

  /**
   * Session durumunu detaylı kontrol
   */
  private static async checkSessionStatus(): Promise<{ 
    isValid: boolean; 
    session?: any; 
    error?: string;
    sessionType?: string;
  }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔴 [AuthService] Session get error:', error);
        return { isValid: false, error: 'Session alınamadı: ' + error.message };
      }
      
      if (!session) {
        console.error('🔴 [AuthService] No session found');
        return { isValid: false, error: 'Aktif oturum bulunamadı. Lütfen tekrar giriş yapın.' };
      }
      
      if (!session.user) {
        console.error('🔴 [AuthService] No user in session');
        return { isValid: false, error: 'Oturumda kullanıcı bilgisi bulunamadı.' };
      }
      
      // Session süresini kontrol et
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      
      if (expiresAt && now >= expiresAt) {
        console.error('🔴 [AuthService] Session expired');
        return { isValid: false, error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' };
      }
      
      // Session türünü belirle
      let sessionType = 'normal';
      if (session.user.recovery_sent_at) {
        sessionType = 'password_recovery';
      } else if (session.user.email_confirmed_at && !session.user.email_confirmed_at) {
        sessionType = 'pending_confirmation';
      }
      
      console.log('✅ [AuthService] Session status:', {
        userId: session.user.id,
        email: session.user.email,
        sessionType,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : 'unknown',
        timeToExpiry: expiresAt ? (expiresAt - now) : 'unknown'
      });
      
      return { 
        isValid: true, 
        session, 
        sessionType 
      };
    } catch (error) {
      console.error('🔴 [AuthService] Error checking session status:', error);
      return { isValid: false, error: 'Session kontrolü başarısız' };
    }
  }

  /**
   * Farklı yöntemlerle şifre güncelleme dene
   */
  private static async attemptPasswordUpdateWithFallbacks(
    newPassword: string, 
    session: any
  ): Promise<{ success: boolean; error?: string }> {
    
    // Strateji 1: Normal updateUser
    console.log('🔄 [AuthService] Attempting Strategy 1: Normal updateUser...');
    const result1 = await this.attemptNormalPasswordUpdate(newPassword);
    if (result1.success) {
      return result1;
    }
    console.log('❌ [AuthService] Strategy 1 failed:', result1.error);
    
    // Strateji 2: Session refresh + updateUser
    console.log('🔄 [AuthService] Attempting Strategy 2: Refresh session + updateUser...');
    const result2 = await this.attemptRefreshAndUpdate(newPassword);
    if (result2.success) {
      return result2;
    }
    console.log('❌ [AuthService] Strategy 2 failed:', result2.error);
    
    // Strateji 3: Manual admin update (eğer mümkünse)
    console.log('🔄 [AuthService] Attempting Strategy 3: Admin update...');
    const result3 = await this.attemptAdminPasswordUpdate(newPassword, session.user.id);
    if (result3.success) {
      return result3;
    }
    console.log('❌ [AuthService] Strategy 3 failed:', result3.error);
    
    // Hepsi başarısız olursa
    return { 
      success: false, 
      error: 'Şifre güncellenemedi. Lütfen uygulamayı yeniden başlatıp tekrar deneyin.' 
    };
  }

  /**
   * Strateji 1: Normal şifre güncelleme
   */
  private static async attemptNormalPasswordUpdate(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        console.error('🔴 [Strategy 1] Update error:', error);
        return { success: false, error: error.message };
      }
      
      if (!data.user) {
        return { success: false, error: 'Kullanıcı bilgisi alınamadı' };
      }
      
      console.log('✅ [Strategy 1] Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('🔴 [Strategy 1] Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' };
    }
  }

  /**
   * Strateji 2: Session refresh + update
   */
  private static async attemptRefreshAndUpdate(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Session'ı refresh et
      console.log('🔄 [Strategy 2] Refreshing session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('🔴 [Strategy 2] Refresh error:', refreshError);
        return { success: false, error: 'Session yenilenemedi' };
      }
      
      if (!refreshData.session) {
        return { success: false, error: 'Session yenileme sonrası session bulunamadı' };
      }
      
      console.log('✅ [Strategy 2] Session refreshed, attempting update...');
      
      // Kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Şifre güncelleme
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        console.error('🔴 [Strategy 2] Update after refresh error:', error);
        return { success: false, error: error.message };
      }
      
      if (!data.user) {
        return { success: false, error: 'Kullanıcı bilgisi alınamadı' };
      }
      
      console.log('✅ [Strategy 2] Password updated after refresh');
      return { success: true };
    } catch (error) {
      console.error('🔴 [Strategy 2] Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Refresh stratejisi başarısız' };
    }
  }

  /**
   * Strateji 3: Admin API ile güncelleme (Edge Function gerekli)
   */
  private static async attemptAdminPasswordUpdate(newPassword: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [Strategy 3] Attempting admin password update...');
      
      // Edge Function çağrısı
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Session bulunamadı' };
      }
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-password-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔴 [Strategy 3] Admin update error:', errorData);
        return { success: false, error: 'Admin güncelleme başarısız' };
      }
      
      const result = await response.json();
      console.log('✅ [Strategy 3] Admin password update successful');
      return { success: true };
    } catch (error) {
      console.error('🔴 [Strategy 3] Exception:', error);
      return { success: false, error: 'Admin stratejisi kullanılamıyor' };
    }
  }

  /**
   * Debug için session bilgilerini logla
   */
  static async debugSessionInfo(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔍 [Debug] Session Info:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        accessToken: session?.access_token ? 'EXISTS' : 'MISSING',
        refreshToken: session?.refresh_token ? 'EXISTS' : 'MISSING',
        expiresAt: session?.expires_at,
        tokenType: session?.token_type,
        error: error?.message
      });
      
      if (session?.user) {
        console.log('🔍 [Debug] User Info:', {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          emailConfirmed: session.user.email_confirmed_at,
          phoneConfirmed: session.user.phone_confirmed_at,
          recoverySent: session.user.recovery_sent_at,
          lastSignIn: session.user.last_sign_in_at,
          createdAt: session.user.created_at
        });
      }
    } catch (error) {
      console.error('🔴 [Debug] Session debug error:', error);
    }
  }

  /**
   * Şifre karmaşıklığını doğrula (güncellenmiş)
   */
  private static validatePasswordComplexity(password: string): { isValid: boolean; error?: string } {
    if (!password || password.trim().length === 0) {
      return { isValid: false, error: 'Şifre boş olamaz.' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Şifre en az 8 karakter olmalıdır.' };
    }
    
    if (password.length > 128) {
      return { isValid: false, error: 'Şifre en fazla 128 karakter olabilir.' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Şifre en az bir büyük harf içermelidir.' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Şifre en az bir küçük harf içermelidir.' };
    }
    
    if (!/\d/.test(password)) {
      return { isValid: false, error: 'Şifre en az bir rakam içermelidir.' };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)) {
      return { isValid: false, error: 'Şifre en az bir özel karakter içermelidir (!@#$%^&* vb.).' };
    }
    
    // Yaygın zayıf şifreleri kontrol et
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return { isValid: false, error: 'Lütfen daha güvenli bir şifre seçin.' };
    }
    
    return { isValid: true };
  }

  /**
   * Token-based login (password reset için)
   */
  static async loginWithToken(access_token: string, refresh_token: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🟡 [AuthService] Attempting token-based login...');
      
      // Session'ı token'lar ile ayarla
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      
      if (error) {
        console.error('🔴 [AuthService] Token login error:', error);
        return { success: false, error: error.message };
      }
      
      if (!data.session) {
        console.error('🔴 [AuthService] No session after token login');
        return { success: false, error: 'Token ile giriş başarısız' };
      }
      
      // Session'ı refresh et
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('🔴 [AuthService] Session refresh error:', refreshError);
        return { success: false, error: refreshError.message };
      }
      
      console.log('🟢 [AuthService] Token-based login successful');
      return { success: true };
    } catch (error) {
      console.error('🔴 [AuthService] Error in loginWithToken:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Token login hatası' };
    }
  }

  /**
   * URL'den token'ları parse et
   */
  static parseTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
    try {
      console.log('🟡 [AuthService] Parsing tokens from URL:', url);
      
      // Supabase URL formatını düzelt (# -> ?)
      let parsedUrl = url;
      if (url.includes("#")) {
        parsedUrl = url.replace("#", "?");
      }
      
      // URL'yi parse et
      const urlObj = new URL(parsedUrl);
      const access_token = urlObj.searchParams.get('access_token');
      const refresh_token = urlObj.searchParams.get('refresh_token');
      
      console.log('🔍 [AuthService] Parsed tokens:', { 
        hasAccessToken: !!access_token, 
        hasRefreshToken: !!refresh_token 
      });
      
      return { access_token: access_token || undefined, refresh_token: refresh_token || undefined };
    } catch (error) {
      console.error('🔴 [AuthService] Error parsing tokens from URL:', error);
      return {};
    }
  }
} 