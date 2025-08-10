import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import axios from 'axios';
import { performance } from 'perf_hooks';

export interface LoadTestConfig {
  concurrentUsers: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  targetUrl: string;
  endpoints: string[];
  requestRate: number; // requests per second
}

export interface LoadTestResult {
  testId: string;
  config: LoadTestConfig;
  startTime: string;
  endTime: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: LoadTestError[];
  performanceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkIO: number;
  };
}

export interface LoadTestError {
  endpoint: string;
  error: string;
  count: number;
  timestamp: string;
}

export interface PerformanceBaseline {
  baselineId: string;
  timestamp: string;
  metrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  thresholds: {
    maxResponseTime: number;
    maxErrorRate: number;
    minRequestsPerSecond: number;
  };
}

class LoadTestingService {
  private client: Client;
  private resultsIndex: string = 'load_test_results';
  private baselineIndex: string = 'performance_baselines';
  private isRunning: boolean = false;
  private activeTests: Map<string, any> = new Map();

  constructor(
    node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
    username: string = process.env.ELASTICSEARCH_USERNAME || '',
    password: string = process.env.ELASTICSEARCH_PASSWORD || ''
  ) {
    this.client = new Client({ 
      node, 
      auth: username ? { username, password } : undefined 
    });
  }

  async initializeIndexes(): Promise<boolean> {
    try {
      // Load Test Results Index
      await this.client.indices.create({
        index: this.resultsIndex,
        body: {
          mappings: {
            properties: {
              testId: { type: 'keyword' },
              config: { type: 'object', dynamic: true },
              startTime: { type: 'date' },
              endTime: { type: 'date' },
              totalRequests: { type: 'long' },
              successfulRequests: { type: 'long' },
              failedRequests: { type: 'long' },
              averageResponseTime: { type: 'float' },
              minResponseTime: { type: 'float' },
              maxResponseTime: { type: 'float' },
              p95ResponseTime: { type: 'float' },
              p99ResponseTime: { type: 'float' },
              requestsPerSecond: { type: 'float' },
              errors: { type: 'object', dynamic: true },
              performanceMetrics: { type: 'object', dynamic: true }
            }
          }
        }
      });

      // Performance Baselines Index
      await this.client.indices.create({
        index: this.baselineIndex,
        body: {
          mappings: {
            properties: {
              baselineId: { type: 'keyword' },
              timestamp: { type: 'date' },
              metrics: { type: 'object', dynamic: true },
              thresholds: { type: 'object', dynamic: true }
            }
          }
        }
      });

      logger.info('✅ Load testing indexes initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize load testing indexes:', error);
      return false;
    }
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    const testId = `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info(`🚀 Starting load test: ${testId}`);

    this.isRunning = true;
    const startTime = new Date().toISOString();
    const results: any[] = [];
    const errors: LoadTestError[] = [];

    try {
      // Simulate concurrent users
      const userPromises = Array.from({ length: config.concurrentUsers }, (_, userIndex) =>
        this.simulateUser(config, userIndex, results, errors)
      );

      // Wait for all users to complete
      await Promise.all(userPromises);

      const endTime = new Date().toISOString();
      const testResult = this.calculateTestResults(testId, config, startTime, endTime, results, errors);

      // Save results to Elasticsearch
      await this.saveTestResults(testResult);

      logger.info(`✅ Load test completed: ${testId}`);
      return testResult;

    } catch (error) {
      logger.error('Load test failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async simulateUser(
    config: LoadTestConfig,
    userIndex: number,
    results: any[],
    errors: LoadTestError[]
  ): Promise<void> {
    const userStartTime = Date.now();
    const userEndTime = userStartTime + (config.duration * 1000);
    const requestInterval = 1000 / config.requestRate;

    while (Date.now() < userEndTime) {
      for (const endpoint of config.endpoints) {
        try {
          const requestStart = performance.now();
          const response = await axios.get(`${config.targetUrl}${endpoint}`, {
            timeout: 10000,
            headers: {
              'User-Agent': `LoadTest-User-${userIndex}`,
              'X-Load-Test': 'true'
            }
          });
          const requestEnd = performance.now();
          const responseTime = requestEnd - requestStart;

          results.push({
            endpoint,
            responseTime,
            statusCode: response.status,
            timestamp: new Date().toISOString(),
            userIndex
          });

        } catch (error: any) {
          const errorInfo: LoadTestError = {
            endpoint,
            error: error.message,
            count: 1,
            timestamp: new Date().toISOString()
          };

          const existingError = errors.find(e => e.endpoint === endpoint && e.error === error.message);
          if (existingError) {
            existingError.count++;
          } else {
            errors.push(errorInfo);
          }
        }

        // Wait before next request
        await this.sleep(requestInterval);
      }
    }
  }

  private calculateTestResults(
    testId: string,
    config: LoadTestConfig,
    startTime: string,
    endTime: string,
    results: any[],
    errors: LoadTestError[]
  ): LoadTestResult {
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;

    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
    const requestsPerSecond = totalRequests / duration;

    return {
      testId,
      config,
      startTime,
      endTime,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errors,
      performanceMetrics: {
        cpuUsage: 0, // Would be measured during test
        memoryUsage: 0, // Would be measured during test
        networkIO: 0 // Would be measured during test
      }
    };
  }

  private async saveTestResults(result: LoadTestResult): Promise<void> {
    try {
      await this.client.index({
        index: this.resultsIndex,
        id: result.testId,
        body: result
      });
      logger.info(`💾 Load test results saved: ${result.testId}`);
    } catch (error) {
      logger.error('Failed to save load test results:', error);
    }
  }

  async getLoadTestResults(testId?: string): Promise<LoadTestResult[]> {
    try {
      const query: any = {
        bool: {
          must: []
        }
      };

      if (testId) {
        query.bool.must.push({ term: { testId } });
      }

      const response = await this.client.search({
        index: this.resultsIndex,
        body: {
          query,
          sort: [{ startTime: { order: 'desc' } }],
          size: 100
        }
      });

      const hits = (response as any).hits.hits;
      return hits.map((hit: any) => hit._source);
    } catch (error) {
      logger.error('Failed to get load test results:', error);
      throw error;
    }
  }

  async createPerformanceBaseline(thresholds: PerformanceBaseline['thresholds']): Promise<PerformanceBaseline> {
    try {
      // Run a baseline load test
      const baselineConfig: LoadTestConfig = {
        concurrentUsers: 10,
        duration: 60,
        rampUpTime: 10,
        targetUrl: 'http://localhost:3002',
        endpoints: ['/api/v1/health', '/api/v1/performance/system'],
        requestRate: 5
      };

      const baselineResult = await this.runLoadTest(baselineConfig);

      const baseline: PerformanceBaseline = {
        baselineId: `baseline_${Date.now()}`,
        timestamp: new Date().toISOString(),
        metrics: {
          averageResponseTime: baselineResult.averageResponseTime,
          p95ResponseTime: baselineResult.p95ResponseTime,
          p99ResponseTime: baselineResult.p99ResponseTime,
          requestsPerSecond: baselineResult.requestsPerSecond,
          errorRate: (baselineResult.failedRequests / baselineResult.totalRequests) * 100
        },
        thresholds
      };

      // Save baseline
      await this.client.index({
        index: this.baselineIndex,
        id: baseline.baselineId,
        body: baseline
      });

      logger.info(`✅ Performance baseline created: ${baseline.baselineId}`);
      return baseline;

    } catch (error) {
      logger.error('Failed to create performance baseline:', error);
      throw error;
    }
  }

  async compareWithBaseline(testResult: LoadTestResult, baselineId: string): Promise<any> {
    try {
      const baselineResponse = await this.client.get({
        index: this.baselineIndex,
        id: baselineId
      });

      const baseline = (baselineResponse as any).body._source as PerformanceBaseline;
      const currentErrorRate = (testResult.failedRequests / testResult.totalRequests) * 100;

      const comparison = {
        testId: testResult.testId,
        baselineId,
        timestamp: new Date().toISOString(),
        metrics: {
          responseTime: {
            baseline: baseline.metrics.averageResponseTime,
            current: testResult.averageResponseTime,
            change: ((testResult.averageResponseTime - baseline.metrics.averageResponseTime) / baseline.metrics.averageResponseTime) * 100
          },
          errorRate: {
            baseline: baseline.metrics.errorRate,
            current: currentErrorRate,
            change: currentErrorRate - baseline.metrics.errorRate
          },
          throughput: {
            baseline: baseline.metrics.requestsPerSecond,
            current: testResult.requestsPerSecond,
            change: ((testResult.requestsPerSecond - baseline.metrics.requestsPerSecond) / baseline.metrics.requestsPerSecond) * 100
          }
        },
        thresholds: {
          responseTimeExceeded: testResult.averageResponseTime > baseline.thresholds.maxResponseTime,
          errorRateExceeded: currentErrorRate > baseline.thresholds.maxErrorRate,
          throughputBelow: testResult.requestsPerSecond < baseline.thresholds.minRequestsPerSecond
        }
      };

      logger.info(`📊 Performance comparison completed for test: ${testResult.testId}`);
      return comparison;

    } catch (error) {
      logger.error('Failed to compare with baseline:', error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }

  stopAllTests(): void {
    this.isRunning = false;
    this.activeTests.clear();
    logger.info('🛑 All load tests stopped');
  }
}

export default LoadTestingService; 