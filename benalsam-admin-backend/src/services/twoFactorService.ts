import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import logger from '../config/logger';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  success: boolean;
  message: string;
  backupCodeUsed?: boolean;
}

export class TwoFactorService {
  private readonly issuer = 'Benalsam';
  private readonly algorithm = 'sha1';
  private readonly digits = 6;
  private readonly period = 30;

  /**
   * Generate new TOTP secret and QR code
   */
  async generateSetup(userId: string, email: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret();
      
      // Generate QR code
      const otpauth = authenticator.keyuri(email, this.issuer, secret);
      const qrCode = await QRCode.toDataURL(otpauth);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Store secret and backup codes in database
      await this.storeTwoFactorData(userId, secret, backupCodes);
      
      logger.info('2FA setup generated', { userId, email });
      
      return {
        secret,
        qrCode,
        backupCodes
      };
    } catch (error) {
      logger.error('Failed to generate 2FA setup', { error, userId });
      throw new Error('Failed to generate 2FA setup');
    }
  }

  /**
   * Verify TOTP token
   */
  async verifyToken(userId: string, token: string): Promise<TwoFactorVerifyResult> {
    try {
      // Get user's 2FA data - check both admin_users and profiles tables
      let user = null;
      let error = null;

      // First try admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('totp_secret, backup_codes, is_2fa_enabled')
        .eq('id', userId)
        .single();

      if (adminUser) {
        user = adminUser;
      } else {
        // Fallback to profiles table for regular users
        const { data: profileUser, error: profileError } = await supabase
          .from('profiles')
          .select('totp_secret, backup_codes, is_2fa_enabled')
          .eq('id', userId)
          .single();
        
        user = profileUser;
        error = profileError;
      }

      if (error || !user) {
        throw new Error('User not found');
      }

      if (!user.is_2fa_enabled) {
        return {
          success: false,
          message: '2FA is not enabled for this user'
        };
      }

      // Check if token is a backup code
      const backupCodes = user.backup_codes || [];
      const isBackupCode = backupCodes.includes(token);

      if (isBackupCode) {
        // Remove used backup code
        const updatedBackupCodes = backupCodes.filter((code: string) => code !== token);
        await this.updateBackupCodes(userId, updatedBackupCodes);
        
        logger.info('Backup code used', { userId });
        
        return {
          success: true,
          message: 'Backup code verified successfully',
          backupCodeUsed: true
        };
      }

      // Verify TOTP token
      const isValid = authenticator.verify({
        token,
        secret: user.totp_secret
      });

      if (isValid) {
        logger.info('2FA token verified', { userId });
        return {
          success: true,
          message: 'Token verified successfully'
        };
      } else {
        logger.warn('Invalid 2FA token', { userId });
        return {
          success: false,
          message: 'Invalid token'
        };
      }
    } catch (error) {
      logger.error('Failed to verify 2FA token', { error, userId });
      throw new Error('Failed to verify token');
    }
  }

  /**
   * Verify TOTP code with secret
   */
  private verifyTOTP(secret: string, token: string): boolean {
    try {
      return authenticator.verify({
        token,
        secret
      });
    } catch (error) {
      logger.error('TOTP verification failed', { error });
      return false;
    }
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string, secret: string, verificationCode: string): Promise<void> {
    try {
      // Verify the code first
      const isValid = this.verifyTOTP(secret, verificationCode);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Try admin_users table first
      const { error: adminError } = await supabase
        .from('admin_users')
        .update({ 
          is_2fa_enabled: true,
          totp_secret: secret
        })
        .eq('id', userId);

      if (!adminError) {
        logger.info('2FA enabled for admin user', { userId });
        return;
      }

      // Fallback to profiles table for regular users
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_2fa_enabled: true,
          totp_secret: secret
        })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      logger.info('2FA enabled for regular user', { userId });
    } catch (error) {
      logger.error('Failed to enable 2FA', { error, userId });
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string): Promise<void> {
    try {
      // Try admin_users table first
      const { error: adminError } = await supabase
        .from('admin_users')
        .update({ 
          is_2fa_enabled: false,
          totp_secret: null,
          backup_codes: null
        })
        .eq('id', userId);

      if (!adminError) {
        logger.info('2FA disabled for admin user', { userId });
        return;
      }

      // Fallback to profiles table for regular users
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_2fa_enabled: false,
          totp_secret: null,
          backup_codes: null
        })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      logger.info('2FA disabled for regular user', { userId });
    } catch (error) {
      logger.error('Failed to disable 2FA', { error, userId });
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();
      
      await this.updateBackupCodes(userId, backupCodes);
      
      logger.info('Backup codes regenerated', { userId });
      
      return backupCodes;
    } catch (error) {
      logger.error('Failed to regenerate backup codes', { error, userId });
      throw new Error('Failed to regenerate backup codes');
    }
  }

  /**
   * Check if 2FA is enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      // Try admin_users table first
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('is_2fa_enabled')
        .eq('id', userId)
        .single();

      if (adminUser) {
        return adminUser.is_2fa_enabled || false;
      }

      // Fallback to profiles table for regular users
      const { data: profileUser, error: profileError } = await supabase
        .from('profiles')
        .select('is_2fa_enabled')
        .eq('id', userId)
        .single();

      if (profileError || !profileUser) {
        return false;
      }

      return profileUser.is_2fa_enabled || false;
    } catch (error) {
      logger.error('Failed to check 2FA status', { error, userId });
      return false;
    }
  }

  /**
   * Store 2FA data
   */
  private async storeTwoFactorData(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    // Try admin_users table first
    const { error: adminError } = await supabase
      .from('admin_users')
      .update({
        totp_secret: secret,
        backup_codes: backupCodes
      })
      .eq('id', userId);

    if (!adminError) {
      return; // Successfully updated admin_users
    }

    // Fallback to profiles table for regular users
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        totp_secret: secret,
        backup_codes: backupCodes
      })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }
  }

  /**
   * Update backup codes
   */
  private async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    // Try admin_users table first
    const { error: adminError } = await supabase
      .from('admin_users')
      .update({ backup_codes: backupCodes })
      .eq('id', userId);

    if (!adminError) {
      return; // Successfully updated admin_users
    }

    // Fallback to profiles table for regular users
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ backup_codes: backupCodes })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomInt(10000000, 99999999).toString();
      codes.push(code);
    }
    
    return codes;
  }
}

export const twoFactorService = new TwoFactorService();
