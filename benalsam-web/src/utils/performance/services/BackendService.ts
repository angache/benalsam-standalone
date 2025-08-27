// ===========================
// BACKEND SERVICE
// ===========================

import { PerformanceData, BackendServiceConfig } from '../types';
import { BACKEND_SERVICE_CONFIG } from '../utils/config';

class BackendService {
  private config: BackendServiceConfig;
  private retryCount: number = 0;

  constructor(config: BackendServiceConfig = BACKEND_SERVICE_CONFIG) {
    this.config = config;
  }

  // Send performance data to backend
  async send(data: PerformanceData): Promise<boolean> {
    if (!this.isEnabled()) {
      console.log('📊 Backend service disabled, skipping data send');
      return false;
    }

    try {
      console.log('📤 Sending performance data to backend');

      const response = await this.makeRequest(data);

      if (response.ok) {
        console.log('✅ Performance data sent to backend successfully');
        this.retryCount = 0; // Reset retry count on success
        return true;
      } else {
        console.warn(`⚠️ Failed to send performance data to backend: ${response.status}`);
        return await this.handleRetry(data);
      }

    } catch (error) {
      console.error('❌ Error sending performance data to backend:', error);
      return await this.handleRetry(data);
    }
  }

  // Make HTTP request with timeout and retry logic
  private async makeRequest(data: PerformanceData): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.url}${this.config.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Handle retry logic
  private async handleRetry(data: PerformanceData): Promise<boolean> {
    if (this.retryCount >= this.config.retryAttempts) {
      console.error(`❌ Max retry attempts (${this.config.retryAttempts}) reached`);
      return false;
    }

    this.retryCount++;
    console.log(`🔄 Retrying performance data send (attempt ${this.retryCount}/${this.config.retryAttempts})`);

    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1);
    
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.send(data);
  }

  // Check if backend service is enabled
  isEnabled(): boolean {
    return this.config.url && this.config.endpoint;
  }

  // Get service configuration
  getConfig(): BackendServiceConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(config: Partial<BackendServiceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📊 Backend service config updated:', this.config);
  }

  // Test backend connection
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Backend service disabled' };
    }

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return { success: true, latency };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }

    } catch (error: any) {
      return { 
        success: false, 
        error: error.name === 'AbortError' ? 'Timeout' : error.message 
      };
    }
  }

  // Get service status
  getStatus(): {
    enabled: boolean;
    url: string;
    endpoint: string;
    retryCount: number;
    maxRetries: number;
  } {
    return {
      enabled: this.isEnabled(),
      url: this.config.url,
      endpoint: this.config.endpoint,
      retryCount: this.retryCount,
      maxRetries: this.config.retryAttempts,
    };
  }

  // Reset retry count
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  // Batch send multiple performance data entries
  async sendBatch(dataArray: PerformanceData[]): Promise<{ success: number; failed: number }> {
    if (!this.isEnabled()) {
      console.log('📊 Backend service disabled, skipping batch send');
      return { success: 0, failed: dataArray.length };
    }

    console.log(`📤 Sending batch of ${dataArray.length} performance data entries`);

    const results = await Promise.allSettled(
      dataArray.map(data => this.send(data))
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - success;

    console.log(`📊 Batch send completed: ${success} success, ${failed} failed`);

    return { success, failed };
  }

  // Validate performance data before sending
  validateData(data: PerformanceData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.route) {
      errors.push('Missing route');
    }

    if (!data.timestamp) {
      errors.push('Missing timestamp');
    }

    if (!data.metrics) {
      errors.push('Missing metrics');
    } else {
      const { lcp, fid, cls, ttfb, fcp } = data.metrics;
      
      if (typeof lcp !== 'number' || lcp < 0) errors.push('Invalid LCP value');
      if (typeof fid !== 'number' || fid < 0) errors.push('Invalid FID value');
      if (typeof cls !== 'number' || cls < 0) errors.push('Invalid CLS value');
      if (typeof ttfb !== 'number' || ttfb < 0) errors.push('Invalid TTFB value');
      if (typeof fcp !== 'number' || fcp < 0) errors.push('Invalid FCP value');
    }

    if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
      errors.push('Invalid score value');
    }

    if (!data.userAgent) {
      errors.push('Missing user agent');
    }

    if (!data.viewport || typeof data.viewport.width !== 'number' || typeof data.viewport.height !== 'number') {
      errors.push('Invalid viewport data');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default new BackendService();
