import { apiClient } from './api';

/**
 * Two-Factor Authentication Service for Admin UI
 * Handles 2FA setup, verification, and management
 */

export interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  setupComplete: boolean;
  lastVerified?: string;
}

export class TwoFactorService {
  /**
   * Setup 2FA for a user
   * @param userId User ID
   * @returns Setup data with QR code and backup codes
   */
  static async setupTwoFactor(userId: string): Promise<{ success: boolean; data?: TwoFactorSetupData; error?: string }> {
    try {
      console.log('🔐 Starting 2FA setup for user', { userId });

      const response = await apiClient.post('/2fa/setup', { userId });

      if (response.data.success) {
        console.log('🔐 2FA setup data generated', {
          hasQrCode: !!response.data.data.qrCode,
          hasBackupCodes: !!response.data.data.backupCodes,
          backupCodesCount: response.data.data.backupCodes?.length || 0
        });

        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || '2FA setup failed'
        };
      }
    } catch (error: any) {
      console.error('🔐 2FA setup failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '2FA setup failed'
      };
    }
  }

  /**
   * Enable 2FA for a user
   * @param userId User ID
   * @param secret 2FA secret
   * @param verificationCode Verification code from authenticator app
   * @returns Result
   */
  static async enableTwoFactor(userId: string, secret: string, verificationCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔐 Enabling 2FA for user', { userId });

      const response = await apiClient.post('/2fa/enable', {
        userId,
        secret,
        verificationCode
      });

      if (response.data.success) {
        console.log('🔐 2FA enabled successfully', { userId });
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to enable 2FA'
        };
      }
    } catch (error: any) {
      console.error('🔐 Enable 2FA failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to enable 2FA'
      };
    }
  }

  /**
   * Disable 2FA for a user
   * @param userId User ID
   * @param verificationCode Current 2FA code for confirmation
   * @returns Result
   */
  static async disableTwoFactor(userId: string, verificationCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔐 Disabling 2FA for user', { userId });

      const response = await apiClient.post('/2fa/disable', {
        userId,
        verificationCode
      });

      if (response.data.success) {
        console.log('🔐 2FA disabled successfully', { userId });
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to disable 2FA'
        };
      }
    } catch (error: any) {
      console.error('🔐 Disable 2FA failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to disable 2FA'
      };
    }
  }

  /**
   * Verify 2FA code during login
   * @param userId User ID
   * @param code 2FA code
   * @returns Result
   */
  static async verifyTwoFactor(userId: string, code: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔐 Verifying 2FA code', { userId });

      const response = await apiClient.post('/2fa/verify', {
        userId,
        token: code
      });

      if (response.data.success) {
        console.log('🔐 2FA verification successful', { userId });
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Invalid 2FA code'
        };
      }
    } catch (error: any) {
      console.error('🔐 2FA verification failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || '2FA verification failed'
      };
    }
  }

  /**
   * Get 2FA status for a user
   * @param userId User ID
   * @returns 2FA status
   */
  static async getTwoFactorStatus(userId: string): Promise<{ success: boolean; data?: TwoFactorStatus; error?: string }> {
    try {
      const response = await apiClient.get('/2fa/status');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to get 2FA status'
        };
      }
    } catch (error: any) {
      console.error('🔐 Get 2FA status failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get 2FA status'
      };
    }
  }

  /**
   * Regenerate backup codes
   * @param userId User ID
   * @param verificationCode Current 2FA code for confirmation
   * @returns New backup codes
   */
  static async regenerateBackupCodes(userId: string, verificationCode: string): Promise<{ success: boolean; data?: { backupCodes: string[] }; error?: string }> {
    try {
      console.log('🔐 Regenerating backup codes for user', { userId });

      const response = await apiClient.post('/2fa/backup-codes/regenerate', {
        userId,
        verificationCode
      });

      if (response.data.success) {
        console.log('🔐 Backup codes regenerated successfully', { userId });
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to regenerate backup codes'
        };
      }
    } catch (error: any) {
      console.error('🔐 Regenerate backup codes failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to regenerate backup codes'
      };
    }
  }
}

// Export the class instance
export default TwoFactorService;
