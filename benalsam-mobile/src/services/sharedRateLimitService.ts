// Shared Rate Limit Service Client for Mobile
// Communicates with backend Redis-based rate limiting

import type { RateLimitResult } from 'benalsam-shared-types';
import { rateLimitService } from './rateLimitService';

const API_BASE_URL = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL || 'http://192.168.1.4:3002';
const RATE_LIMIT_API = `${API_BASE_URL}/api/v1/rate-limit`;

class SharedRateLimitService {
  
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${RATE_LIMIT_API}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }

      return data.data || data;
    } catch (error) {
      console.error('🔴 [SharedRateLimit] API Error:', error);
      
      // Fallback to local rate limit service on network error
      if (endpoint === '/check') {
        console.log('🔄 [SharedRateLimit] Falling back to local rate limit service');
        return await rateLimitService.checkRateLimit(options.body ? JSON.parse(options.body as string).email : '');
      }
      
      throw error;
    }
  }

  async checkRateLimit(email: string): Promise<RateLimitResult> {
    console.log('🛡️ [SharedRateLimit] Checking rate limit for:', email);
    
    const result = await this.makeRequest('/check', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    console.log('🛡️ [SharedRateLimit] Check result:', result);
    return result;
  }

  async recordFailedAttempt(email: string): Promise<void> {
    console.log('🚨 [SharedRateLimit] Recording failed attempt for:', email);
    
    try {
      await this.makeRequest('/record-failed', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      console.log('🚨 [SharedRateLimit] Failed attempt recorded');
    } catch (error) {
      console.error('🔴 [SharedRateLimit] Failed to record attempt:', error);
      // Fallback to local rate limit service
      console.log('🔄 [SharedRateLimit] Falling back to local rate limit service for recording');
      await rateLimitService.recordFailedAttempt(email);
    }
  }

  async resetRateLimit(email: string): Promise<void> {
    console.log('✅ [SharedRateLimit] Resetting rate limit for:', email);
    
    try {
      await this.makeRequest('/reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      console.log('✅ [SharedRateLimit] Rate limit reset');
    } catch (error) {
      console.error('🔴 [SharedRateLimit] Failed to reset:', error);
      // Fallback to local rate limit service
      console.log('🔄 [SharedRateLimit] Falling back to local rate limit service for reset');
      await rateLimitService.resetRateLimit(email);
    }
  }

  async getRateLimitStatus(email: string): Promise<{
    attempts: number;
    blocked: boolean;
    timeRemaining: number;
    nextResetTime: number;
  }> {
    try {
      const result = await this.makeRequest(`/status/${encodeURIComponent(email)}`);
      return result;
    } catch (error) {
      console.error('🔴 [SharedRateLimit] Failed to get status:', error);
      // Fallback to local rate limit service
      console.log('🔄 [SharedRateLimit] Falling back to local rate limit service for status');
      const localStatus = await rateLimitService.getRateLimitStatus(email);
      return {
        attempts: localStatus.attempts,
        blocked: localStatus.blocked,
        timeRemaining: localStatus.timeRemaining || 0,
        nextResetTime: Date.now() + (localStatus.timeRemaining || 0) * 1000
      };
    }
  }
}

export const sharedRateLimitService = new SharedRateLimitService();