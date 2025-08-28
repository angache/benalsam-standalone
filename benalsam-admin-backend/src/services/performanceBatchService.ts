import { redis } from '../config/redis';

interface PerformanceBatch {
  route: string;
  timestamp: string;
  userCount: number;
  metrics: {
    lcp: number[];
    fcp: number[];
    cls: number[];
    inp: number[];
    ttfb: number[];
  };
}

class PerformanceBatchService {
  private batchQueue: Map<string, PerformanceBatch> = new Map();
  private batchInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_BATCH_SIZE = 100;

  constructor() {
    this.startBatchProcessor();
  }

  // Add performance data to batch
  async addToBatch(route: string, metrics: any, userId: string = 'web-app') {
    const batchKey = `${route}:${Math.floor(Date.now() / this.BATCH_INTERVAL)}`;
    
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, {
        route,
        timestamp: new Date().toISOString(),
        userCount: 0,
        metrics: {
          lcp: [],
          fcp: [],
          cls: [],
          inp: [],
          ttfb: []
        }
      });
    }

    const batch = this.batchQueue.get(batchKey)!;
    batch.userCount++;
    
    // Add metrics to arrays
    if (metrics.LCP?.value) batch.metrics.lcp.push(metrics.LCP.value);
    if (metrics.FCP?.value) batch.metrics.fcp.push(metrics.FCP.value);
    if (metrics.CLS?.value) batch.metrics.cls.push(metrics.CLS.value);
    if (metrics.INP?.value) batch.metrics.inp.push(metrics.INP.value);
    if (metrics.TTFB?.value) batch.metrics.ttfb.push(metrics.TTFB.value);

    // Process batch if it's full
    if (batch.userCount >= this.MAX_BATCH_SIZE) {
      await this.processBatch(batchKey);
    }
  }

  // Process batch and save to Redis
  private async processBatch(batchKey: string) {
    const batch = this.batchQueue.get(batchKey);
    if (!batch) return;

    try {
      // Calculate averages
      const avgMetrics = {
        lcp: this.calculateAverage(batch.metrics.lcp),
        fcp: this.calculateAverage(batch.metrics.fcp),
        cls: this.calculateAverage(batch.metrics.cls),
        inp: this.calculateAverage(batch.metrics.inp),
        ttfb: this.calculateAverage(batch.metrics.ttfb)
      };

      // Calculate score
      const score = this.calculateBatchScore(avgMetrics);

      // Save batch analysis
      const batchAnalysis = {
        id: `batch:${Date.now()}:${batch.route}`,
        route: batch.route,
        timestamp: batch.timestamp,
        userCount: batch.userCount,
        metrics: avgMetrics,
        score,
        type: 'batch',
        severity: score >= 90 ? 'low' : score >= 70 ? 'medium' : 'high'
      };

      // Save to Redis
      const key = `performance:batch:${batch.route}:${Date.now()}`;
      await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(batchAnalysis));

      console.log(`📊 Processed batch for ${batch.route}: ${batch.userCount} users, score: ${score}`);

      // Remove from queue
      this.batchQueue.delete(batchKey);

    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  // Calculate average of array
  private calculateAverage(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  // Calculate score for batch metrics
  private calculateBatchScore(metrics: any): number {
    let score = 100;
    
    if (metrics.lcp > 4000) score -= 30;
    else if (metrics.lcp > 2500) score -= 15;
    
    if (metrics.fcp > 3000) score -= 25;
    else if (metrics.fcp > 1800) score -= 12;
    
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 12;
    
    if (metrics.inp > 500) score -= 20;
    else if (metrics.inp > 200) score -= 10;
    
    if (metrics.ttfb > 1800) score -= 15;
    else if (metrics.ttfb > 800) score -= 8;
    
    return Math.max(0, Math.round(score));
  }

  // Start batch processor
  private startBatchProcessor() {
    this.batchInterval = setInterval(async () => {
      for (const [batchKey] of this.batchQueue) {
        await this.processBatch(batchKey);
      }
    }, this.BATCH_INTERVAL);
  }

  // Stop batch processor
  stop() {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }
  }
}

export const performanceBatchService = new PerformanceBatchService();
