// Shared Rate Limit Service Client for Web
// Communicates with backend Redis-based rate limiting

// Type-only import to avoid server-only modules
type RateLimitResult = {
  allowed: boolean;
  timeRemaining: number;
  attempts: number;
  message?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || 'http://localhost:3002';
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
      
      // Fallback to allow on network error
      if (endpoint === '/check') {
        return {
          allowed: true,
          timeRemaining: 0,
          attempts: 0,
          message: 'Network error - allowing request'
        };
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
      // Don't throw - this is not critical for user flow
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
      // Don't throw - this is not critical for user flow
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
      return {
        attempts: 0,
        blocked: false,
        timeRemaining: 0,
        nextResetTime: 0
      };
    }
  }
}

export { SharedRateLimitService };
export const sharedRateLimitService = new SharedRateLimitService();