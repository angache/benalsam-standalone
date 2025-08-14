import { supabase } from '../lib/supabaseClient';

/**
 * Two-Factor Authentication Service for Web
 * Handles 2FA setup, verification, and management
 */

class TwoFactorService {
  /**
   * Get current user's Supabase token
   * @returns {Promise<string>} User token
   */
  static async getCurrentUserToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found');
      }
      
      return session.access_token;
    } catch (error) {
      console.error('🔐 Get user token failed', error);
      throw error;
    }
  }

  /**
   * Setup 2FA for a user
   * @param {string} userId User ID
   * @returns {Promise<Object>} Setup data with QR code and backup codes
   */
  static async setupTwoFactor(userId) {
    try {
      console.log('🔐 Starting 2FA setup for user', { userId });

      // Get current user's token
      const token = await this.getCurrentUserToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '2FA setup failed');
      }

      console.log('🔐 2FA setup data generated', {
        hasQrCode: !!data.data.qrCode,
        hasBackupCodes: !!data.data.backupCodes,
        backupCodesCount: data.data.backupCodes?.length || 0
      });

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('🔐 2FA setup failed', error);
      return {
        success: false,
        error: error.message || '2FA setup failed'
      };
    }
  }

  /**
   * Enable 2FA for a user
   * @param {string} userId User ID
   * @param {string} secret 2FA secret
   * @param {string} verificationCode Verification code from authenticator app
   * @returns {Promise<Object>} Result
   */
  static async enableTwoFactor(userId, secret, verificationCode) {
    try {
      console.log('🔐 Enabling 2FA for user', { userId });

      // Get current user's token
      const token = await this.getCurrentUserToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          secret,
          verificationCode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to enable 2FA');
      }

      console.log('🔐 2FA enabled successfully', { userId });

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('🔐 Enable 2FA failed', error);
      return {
        success: false,
        error: error.message || 'Failed to enable 2FA'
      };
    }
  }

  /**
   * Disable 2FA for a user
   * @param {string} userId User ID
   * @param {string} verificationCode Current 2FA code for confirmation
   * @returns {Promise<Object>} Result
   */
  static async disableTwoFactor(userId, verificationCode) {
    try {
      console.log('🔐 Disabling 2FA for user', { userId });

      // Get current user's token
      const token = await this.getCurrentUserToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          verificationCode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to disable 2FA');
      }

      console.log('🔐 2FA disabled successfully', { userId });

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('🔐 Disable 2FA failed', error);
      return {
        success: false,
        error: error.message || 'Failed to disable 2FA'
      };
    }
  }

  /**
   * Verify 2FA code during login
   * @param {string} userId User ID
   * @param {string} code 2FA code
   * @returns {Promise<Object>} Result
   */
  static async verifyTwoFactor(userId, code) {
    try {
      console.log('🔐 Verifying 2FA code', { userId });

      // Get current user's token
      const token = await this.getCurrentUserToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          code
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Invalid 2FA code');
      }

      console.log('🔐 2FA verification successful', { userId });

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('🔐 2FA verification failed', error);
      return {
        success: false,
        error: error.message || '2FA verification failed'
      };
    }
  }

  /**
   * Get 2FA status for a user
   * @param {string} userId User ID
   * @returns {Promise<Object>} 2FA status
   */
  static async getTwoFactorStatus(userId) {
    try {
      // Get current user's token
      const token = await this.getCurrentUserToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get 2FA status');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('🔐 Get 2FA status failed', error);
      return {
        success: false,
        error: error.message || 'Failed to get 2FA status'
      };
    }
  }

  /**
   * Regenerate backup codes
   * @param {string} userId User ID
   * @param {string} verificationCode Current 2FA code for confirmation
   * @returns {Promise<Object>} New backup codes
   */
  static async regenerateBackupCodes(userId, verificationCode) {
    try {
      console.log('🔐 Regenerating backup codes for user', { userId });

      // Get current user's token
      const token = await this.getCurrentUserToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/backup-codes/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          verificationCode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to regenerate backup codes');
      }

      console.log('🔐 Backup codes regenerated successfully', { userId });

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('🔐 Regenerate backup codes failed', error);
      return {
        success: false,
        error: error.message || 'Failed to regenerate backup codes'
      };
    }
  }
}

export default TwoFactorService;
