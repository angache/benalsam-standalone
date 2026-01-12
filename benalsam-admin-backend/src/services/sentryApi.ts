/**
 * Sentry REST API Client
 * 
 * Service for interacting with Sentry REST API to fetch error tracking data
 * for the Admin Dashboard
 * 
 * Documentation: https://docs.sentry.io/api/
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

interface SentryApiConfig {
  orgSlug: string;
  projectSlug: string;
  authToken: string;
}

interface SentryError {
  id: string;
  title: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: string;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  metadata?: {
    filename?: string;
    function?: string;
    lineno?: number;
  };
  count: number;
  lastSeen: string;
  firstSeen: string;
}

interface SentryMetrics {
  errorRate: number;
  totalErrors: number;
  activeErrors: number;
  resolvedErrors: number;
  performanceScore: number;
  userImpact: number;
  releaseHealth: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface SentryPerformance {
  transaction: string;
  avgDuration: number;
  p95Duration: number;
  errorRate: number;
  throughput: number;
  timestamp: string;
}

interface SentryRelease {
  version: string;
  date: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  errorCount: number;
  userCount: number;
}

class SentryApiService {
  private client: AxiosInstance;
  private config: SentryApiConfig;
  private baseUrl = 'https://sentry.io/api/0';
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 250; // 250ms between requests (4 requests/second max)

  constructor(config: SentryApiConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for rate limiting and logging
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting: ensure minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          const waitTime = this.minRequestInterval - timeSinceLastRequest;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();

        logger.debug('[SentryApi] Request', {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error('[SentryApi] Request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and retry
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || error.response.headers['x-sentry-rate-limit-reset'];
          const waitTime = retryAfter ? (parseInt(retryAfter) * 1000) : 2000; // Default 2 seconds
          
          logger.warn('[SentryApi] Rate limit hit, waiting', {
            waitTime,
            retryAfter,
            url: config.url,
          });
          
          // Wait and retry once
          if (!config._retry) {
            config._retry = true;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.client(config);
          }
        }

        logger.error('[SentryApi] Response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get time range query parameter for Sentry API
   */
  private getTimeRangeQuery(timeRange: string): string {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return startTime.toISOString();
  }

  /**
   * Get Sentry metrics overview
   */
  async getMetrics(timeRange: string = '24h'): Promise<SentryMetrics> {
    try {
      const startTime = this.getTimeRangeQuery(timeRange);
      const orgSlug = this.config.orgSlug;
      const projectSlug = this.config.projectSlug;

      // Log query parameters for debugging
      logger.debug('[SentryApi] Getting metrics', {
        orgSlug,
        projectSlug,
        timeRange,
        startTime: startTime,
        query: 'is:unresolved error.type:error',
      });

      // Get project issues count (correct endpoint format: /projects/{org}/{project}/issues/)
      // Query: unresolved errors only (exclude resolved/archived)
      const issuesResponse = await this.client.get(
        `/projects/${orgSlug}/${projectSlug}/issues/`,
        {
          params: {
            statsPeriod: timeRange,
            query: 'is:unresolved error.type:error',
          },
        }
      );

      const totalIssues = issuesResponse.data?.length || 0;

      // Get resolved issues count
      const resolvedResponse = await this.client.get(
        `/projects/${orgSlug}/${projectSlug}/issues/`,
        {
          params: {
            statsPeriod: timeRange,
            query: 'is:resolved error.type:error',
          },
        }
      );

      const resolvedIssues = resolvedResponse.data?.length || 0;

      // Calculate metrics
      const metrics: SentryMetrics = {
        errorRate: 0, // Will be calculated from events
        totalErrors: totalIssues + resolvedIssues,
        activeErrors: totalIssues,
        resolvedErrors: resolvedIssues,
        performanceScore: 100, // Default, can be calculated from performance data
        userImpact: 0, // Will be calculated from events
        releaseHealth: {
          healthy: 0,
          degraded: 0,
          unhealthy: 0,
        },
      };

      return metrics;
    } catch (error) {
      logger.error('[SentryApi] Error getting metrics', error);
      throw error;
    }
  }

  /**
   * Get Sentry errors/issues
   */
  async getErrors(timeRange: string = '24h'): Promise<SentryError[]> {
    try {
      const orgSlug = this.config.orgSlug;
      const projectSlug = this.config.projectSlug;

      // Log query parameters for debugging
      logger.debug('[SentryApi] Getting errors', {
        orgSlug,
        projectSlug,
        timeRange,
        query: 'is:unresolved error.type:error',
      });

      const response = await this.client.get(
        `/projects/${orgSlug}/${projectSlug}/issues/`,
        {
          params: {
            statsPeriod: timeRange,
            // Query: unresolved errors only (exclude resolved/archived)
            query: 'is:unresolved error.type:error',
            // Sort parameter removed - Sentry API doesn't support '-lastSeen'
            // Results are returned in default order (most recent first)
            limit: 100,
          },
        }
      );

      // Sentry API may return paginated response or array directly
      const issues = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data || []);

      // Transform Sentry issues to our format
      const errors: SentryError[] = issues.map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        message: issue.culprit || issue.title,
        level: issue.level || 'error',
        timestamp: issue.lastSeen || issue.firstSeen,
        user: issue.user ? {
          id: issue.user.id,
          email: issue.user.email,
          username: issue.user.username,
        } : undefined,
        tags: issue.tags,
        metadata: issue.metadata,
        count: issue.count || 0,
        lastSeen: issue.lastSeen,
        firstSeen: issue.firstSeen,
      }));

      // Sort by lastSeen descending (most recent first)
      errors.sort((a, b) => {
        const dateA = new Date(a.lastSeen).getTime();
        const dateB = new Date(b.lastSeen).getTime();
        return dateB - dateA; // Descending order
      });

      return errors;
    } catch (error) {
      logger.error('[SentryApi] Error getting errors', error);
      throw error;
    }
  }

  /**
   * Get Sentry performance data
   */
  async getPerformance(timeRange: string = '24h'): Promise<SentryPerformance[]> {
    try {
      const orgSlug = this.config.orgSlug;
      const projectSlug = this.config.projectSlug;

      const response = await this.client.get(
        `/projects/${orgSlug}/${projectSlug}/events/`,
        {
          params: {
            statsPeriod: timeRange,
            query: 'transaction.duration:>0',
            sort: '-timestamp',
            limit: 50,
          },
        }
      );

      const events = response.data || [];

      // Group by transaction and calculate metrics
      const transactionMap = new Map<string, number[]>();

      events.forEach((event: any) => {
        const transaction = event.transaction || 'unknown';
        const duration = event.contexts?.trace?.duration || 0;

        if (!transactionMap.has(transaction)) {
          transactionMap.set(transaction, []);
        }
        transactionMap.get(transaction)!.push(duration);
      });

      const performance: SentryPerformance[] = Array.from(transactionMap.entries()).map(([transaction, durations]) => {
        const sorted = durations.sort((a, b) => a - b);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const p95Index = Math.floor(sorted.length * 0.95);
        const p95 = sorted[p95Index] || avg;

        return {
          transaction,
          avgDuration: avg,
          p95Duration: p95,
          errorRate: 0, // Can be calculated from error events
          throughput: durations.length,
          timestamp: new Date().toISOString(),
        };
      });

      return performance;
    } catch (error) {
      logger.error('[SentryApi] Error getting performance', error);
      throw error;
    }
  }

  /**
   * Get Sentry releases
   */
  async getReleases(): Promise<SentryRelease[]> {
    try {
      const orgSlug = this.config.orgSlug;
      const projectSlug = this.config.projectSlug;

      // Get project-specific releases
      const response = await this.client.get(
        `/projects/${orgSlug}/${projectSlug}/releases/`,
        {
          params: {
            // Query parameter removed - project-specific endpoint doesn't need it
            limit: 10,
          },
        }
      );

      // Sentry API may return paginated response or array directly
      const releases = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data || []);

      // Transform Sentry releases to our format
      const transformedReleases: SentryRelease[] = releases.map((release: any) => {
        // Determine health based on errors
        const errorCount = release.newGroups || 0;
        let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        
        if (errorCount > 10) {
          health = 'unhealthy';
        } else if (errorCount > 0) {
          health = 'degraded';
        }

        return {
          version: release.version,
          date: release.dateCreated || release.dateReleased || new Date().toISOString(),
          health,
          errorCount,
          userCount: release.adoption || 0,
        };
      });

      return transformedReleases;
    } catch (error) {
      logger.error('[SentryApi] Error getting releases', error);
      throw error;
    }
  }
}

// Create singleton instance
let sentryApiInstance: SentryApiService | null = null;

/**
 * Get or create Sentry API service instance
 */
export function getSentryApiService(): SentryApiService {
  if (sentryApiInstance) {
    return sentryApiInstance;
  }

  const orgSlug = process.env.SENTRY_ORG_SLUG;
  const projectSlug = process.env.SENTRY_PROJECT_SLUG;
  const authToken = process.env.SENTRY_AUTH_TOKEN;

  logger.debug('🔍 Sentry API Configuration Check', {
    orgSlug: orgSlug ? `${orgSlug.substring(0, 3)}...` : 'MISSING',
    projectSlug: projectSlug ? `${projectSlug.substring(0, 3)}...` : 'MISSING',
    authToken: authToken ? `${authToken.substring(0, 10)}...` : 'MISSING',
  });

  if (!orgSlug || !projectSlug || !authToken) {
    const missing = [];
    if (!orgSlug) missing.push('SENTRY_ORG_SLUG');
    if (!projectSlug) missing.push('SENTRY_PROJECT_SLUG');
    if (!authToken) missing.push('SENTRY_AUTH_TOKEN');
    
    logger.error('❌ Sentry API configuration is missing', {
      missing: missing.join(', '),
      orgSlug: !!orgSlug,
      projectSlug: !!projectSlug,
      authToken: !!authToken,
    });
    
    throw new Error(`Sentry API configuration is missing. Please set the following environment variables: ${missing.join(', ')}`);
  }

  try {
    sentryApiInstance = new SentryApiService({
      orgSlug,
      projectSlug,
      authToken,
    });

    logger.info('✅ Sentry API service initialized successfully', {
      orgSlug,
      projectSlug,
    });

    return sentryApiInstance;
  } catch (error) {
    logger.error('❌ Failed to initialize Sentry API service', error);
    throw error;
  }
}

// Export types
export type {
  SentryError,
  SentryMetrics,
  SentryPerformance,
  SentryRelease,
};

