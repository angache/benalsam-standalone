import { supabase } from './supabaseClient';
import { generateSecret, generateTOTP, verifyTOTP, generateQRCodeURL, formatSecretForDisplay } from '../utils/totp';
import { DebugLogger } from './debugLogger';
import type { User } from '../types';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  formattedSecret: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  setupComplete: boolean;
  lastVerified?: string;
}

export interface TwoFactorVerification {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
}

/**
 * Two-Factor Authentication Service
 * Handles TOTP setup, verification, and user management
 */
export class TwoFactorService {
  /**
   * Setup 2FA for a user
   * @param userId User ID
   * @returns Setup data including secret and QR code
   */
  static async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    try {
      DebugLogger.info('Starting 2FA setup for user', { userId });
      
      // Generate secure secret
      const secret = await generateSecret(32);
      DebugLogger.info('Generated 2FA secret', { secretLength: secret.length });
      
      // Get user profile for QR code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      
      DebugLogger.info('Profile fetch result', { 
        hasProfile: !!profile, 
        profileError: profileError?.message,
        userId 
      });
      
      if (profileError) {
        DebugLogger.error('Profile fetch error', profileError);
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
      }
      
      if (!profile) {
        DebugLogger.warn('User profile not found, attempting to create profile', { userId });
        
        // Try to create a basic profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: userId, // Fallback
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('username')
          .single();
        
        if (createError) {
          DebugLogger.error('Failed to create profile', createError);
          throw new Error(`Failed to create user profile: ${createError.message}`);
        }
        
        DebugLogger.info('Profile created successfully', { userId });
        return {
          secret,
          qrCodeUrl: generateQRCodeURL(secret, newProfile.username || userId),
          formattedSecret: formatSecretForDisplay(secret)
        };
      }
      
      // Generate QR code URL
      const accountName = profile.username || userId;
      const qrCodeUrl = generateQRCodeURL(secret, accountName);
      const formattedSecret = formatSecretForDisplay(secret);
      
      DebugLogger.info('QR code generated', { 
        accountName,
        hasUsername: !!profile.username
      });
      
      DebugLogger.info('2FA setup data generated', { 
        hasQRCode: !!qrCodeUrl,
        secretLength: secret.length,
        formattedSecretLength: formattedSecret.length
      });
      
      return {
        secret,
        qrCodeUrl,
        formattedSecret
      };
    } catch (error) {
      DebugLogger.error('2FA setup failed', error);
      throw error;
    }
  }
  
  /**
   * Enable 2FA for a user
   * @param userId User ID
   * @param secret 2FA secret
   * @param verificationCode Verification code to confirm setup
   * @returns Success status
   */
  static async enableTwoFactor(
    userId: string,
    secret: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      DebugLogger.info('Enabling 2FA for user', { userId });
      
      // Verify the code first with wider time window
      const isValid = await verifyTOTP(verificationCode, { secret }, 2); // 2 time windows = 60 seconds
      
      if (!isValid) {
        DebugLogger.warn('Invalid verification code provided', { userId });
        return { success: false, error: 'Invalid verification code' };
      }
      
      // Update user profile with 2FA settings using the new database structure
      const { error: updateError } = await supabase
        .rpc('update_2fa_secret', {
          user_uuid: userId,
          new_secret: secret,
          new_backup_codes: [] // Empty backup codes for now
        });
      
      if (updateError) {
        DebugLogger.error('Failed to update user profile with 2FA', updateError);
        return { success: false, error: 'Failed to enable 2FA' };
      }
      
      DebugLogger.info('2FA enabled successfully', { userId });
      return { success: true };
    } catch (error) {
      DebugLogger.error('Enable 2FA failed', error);
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }
  
  /**
   * Disable 2FA for a user
   * @param userId User ID
   * @param verificationCode Current 2FA code for confirmation
   * @returns Success status
   */
  static async disableTwoFactor(
    userId: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      DebugLogger.info('Disabling 2FA for user', { userId });
      
      // Get current 2FA secret
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('totp_secret')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile?.totp_secret) {
        return { success: false, error: '2FA not enabled for this user' };
      }
      
      // Verify the code
      const isValid = await verifyTOTP(verificationCode, { secret: profile.totp_secret });
      
      if (!isValid) {
        DebugLogger.warn('Invalid verification code for 2FA disable', { userId });
        return { success: false, error: 'Invalid verification code' };
      }
      
      // Disable 2FA using the new database structure
      const { error: updateError } = await supabase
        .rpc('disable_2fa', {
          user_uuid: userId
        });
      
      if (updateError) {
        DebugLogger.error('Failed to disable 2FA', updateError);
        return { success: false, error: 'Failed to disable 2FA' };
      }
      
      DebugLogger.info('2FA disabled successfully', { userId });
      return { success: true };
    } catch (error) {
      DebugLogger.error('Disable 2FA failed', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }
  
  /**
   * Verify 2FA code during login
   * @param userId User ID
   * @param code 2FA code
   * @returns Verification result
   */
  static async verifyTwoFactor(
    userId: string,
    code: string
  ): Promise<TwoFactorVerification> {
    try {
      DebugLogger.info('Verifying 2FA code', { userId });
      
      // Get user's 2FA secret
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('totp_secret, is_2fa_enabled')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) {
        DebugLogger.error('Failed to fetch user profile for 2FA verification', profileError);
        return { success: false, error: 'User not found' };
      }
      
      if (!profile.is_2fa_enabled || !profile.totp_secret) {
        DebugLogger.warn('2FA not enabled for user', { userId });
        return { success: false, error: '2FA not enabled' };
      }
      
      // Verify the code
      const isValid = await verifyTOTP(code, { secret: profile.totp_secret });
      
      if (!isValid) {
        DebugLogger.warn('Invalid 2FA code provided', { userId });
        return { success: false, error: 'Invalid 2FA code' };
      }
      
      // Update last verification time
      await supabase
        .from('profiles')
        .update({
          last_2fa_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      DebugLogger.info('2FA verification successful', { userId });
      return { success: true };
    } catch (error) {
      DebugLogger.error('2FA verification failed', error);
      return { success: false, error: 'Verification failed' };
    }
  }
  
  /**
   * Get 2FA status for a user
   * @param userId User ID
   * @returns 2FA status
   */
  static async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_2fa_enabled, totp_secret, last_2fa_used')
        .eq('id', userId)
        .single();
      
      if (error || !profile) {
        DebugLogger.warn('Failed to fetch 2FA status', error);
        return { enabled: false, setupComplete: false };
      }
      
      return {
        enabled: profile.is_2fa_enabled || false,
        setupComplete: !!(profile.is_2fa_enabled && profile.totp_secret),
        lastVerified: profile.last_2fa_used
      };
    } catch (error) {
      DebugLogger.error('Get 2FA status failed', error);
      return { enabled: false, setupComplete: false };
    }
  }
  
  /**
   * Generate current TOTP code for testing
   * @param userId User ID
   * @returns Current TOTP code
   */
  static async generateCurrentCode(userId: string): Promise<{ code: string; remainingTime: number } | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('totp_secret')
        .eq('id', userId)
        .single();
      
      if (error || !profile?.totp_secret) {
        return null;
      }
      
      const result = await generateTOTP({ secret: profile.totp_secret });
      return {
        code: result.code,
        remainingTime: result.remainingTime
      };
    } catch (error) {
      DebugLogger.error('Generate current code failed', error);
      return null;
    }
  }
  
  /**
   * Check if user requires 2FA verification
   * @param userId User ID
   * @returns True if 2FA is required
   */
  static async requiresTwoFactor(userId: string): Promise<boolean> {
    try {
      const status = await this.getTwoFactorStatus(userId);
      return status.enabled && status.setupComplete;
    } catch (error) {
      DebugLogger.error('Check 2FA requirement failed', error);
      return false;
    }
  }

  /**
   * Enterprise 2FA verification with session creation
   * @param userId User ID
   * @param code 2FA code
   * @param email User email for re-login
   * @param password User password for re-login
   * @returns Verification result with user data
   */
  static async verify2FA(
    userId: string,
    code: string,
    email?: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      DebugLogger.info('Enterprise 2FA verification attempt', { userId });
      
      // Use backend rate limiting for 2FA verification
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3002/api/v1';
      
      const response = await fetch(`${API_URL}/2fa/verify`, {
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
        DebugLogger.error('Backend 2FA verification failed', result);
        return { success: false, error: result.message || '2FA verification failed' };
      }

      // 2FA verification successful, now create session
      DebugLogger.info('2FA verification successful, creating session...');
      
      if (email && password) {
        const { supabase } = await import('./supabaseClient');
        
        // Re-login to create session
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          DebugLogger.error('Login after 2FA failed', loginError);
          return { success: false, error: 'Failed to create session after 2FA verification' };
        }

        if (loginData.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', loginData.user.id)
            .single();

          if (profile) {
            const user = {
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

            DebugLogger.info('Enterprise 2FA session created successfully', { 
              userId: user.id, 
              userEmail: user.email 
            });
            
            return { success: true, user };
          }
        }
      }

      return { success: false, error: 'Failed to create user session' };
    } catch (error) {
      DebugLogger.error('Enterprise 2FA verification error', error);
      return { success: false, error: '2FA verification failed' };
    }
  }
} 