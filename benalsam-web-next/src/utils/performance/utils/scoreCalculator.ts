// ===========================
// SCORE CALCULATOR UTILITY
// ===========================

import { PerformanceMetrics, PerformanceScore } from '../types';
import { CORE_WEB_VITALS_THRESHOLDS, SCORE_WEIGHTS } from './config';

class ScoreCalculator {
  // Calculate overall performance score
  calculateScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // LCP scoring (0-2500ms = good, 2500-4000ms = needs-improvement, >4000ms = poor)
    if (metrics.LCP) {
      if (metrics.LCP > 4000) score -= 30;
      else if (metrics.LCP > 2500) score -= 15;
      else if (metrics.LCP > 2000) score -= 5;
    }
    
    // FCP scoring (0-1800ms = good, 1800-3000ms = needs-improvement, >3000ms = poor)
    if (metrics.FCP) {
      if (metrics.FCP > 3000) score -= 25;
      else if (metrics.FCP > 1800) score -= 12;
      else if (metrics.FCP > 1000) score -= 5;
    }
    
    // CLS scoring (0-0.1 = good, 0.1-0.25 = needs-improvement, >0.25 = poor)
    if (metrics.CLS) {
      if (metrics.CLS > 0.25) score -= 25;
      else if (metrics.CLS > 0.1) score -= 12;
      else if (metrics.CLS > 0.05) score -= 5;
    }
    
    // INP scoring (0-200ms = good, 200-500ms = needs-improvement, >500ms = poor)
    if (metrics.INP) {
      if (metrics.INP > 500) score -= 20;
      else if (metrics.INP > 200) score -= 10;
      else if (metrics.INP > 100) score -= 3;
    }
    
    // TTFB scoring (0-800ms = good, 800-1800ms = needs-improvement, >1800ms = poor)
    if (metrics.TTFB) {
      if (metrics.TTFB > 1800) score -= 15;
      else if (metrics.TTFB > 800) score -= 8;
      else if (metrics.TTFB > 400) score -= 3;
    }
    
    return Math.max(0, Math.round(score));
  }

  // Get detailed score breakdown
  getScoreBreakdown(metrics: PerformanceMetrics): PerformanceScore {
    const breakdown = {
      lcp: this.calculateMetricScore('LCP', metrics.LCP),
      fcp: this.calculateMetricScore('FCP', metrics.FCP),
      cls: this.calculateMetricScore('CLS', metrics.CLS),
      inp: this.calculateMetricScore('INP', metrics.INP),
      ttfb: this.calculateMetricScore('TTFB', metrics.TTFB),
    };

    const totalScore = this.calculateScore(metrics);
    const rating = this.getRating(totalScore);

    return {
      score: totalScore,
      rating,
      breakdown,
    };
  }

  // Calculate score for individual metric
  private calculateMetricScore(metricName: string, value: number | null): { score: number; rating: string } {
    if (value === null) {
      return { score: 0, rating: 'unknown' };
    }

    const thresholds = CORE_WEB_VITALS_THRESHOLDS[metricName as keyof typeof CORE_WEB_VITALS_THRESHOLDS];
    const weight = SCORE_WEIGHTS[metricName as keyof typeof SCORE_WEIGHTS] || 0;

    let score = weight;
    let rating: string;

    if (value <= thresholds.good) {
      rating = 'good';
    } else if (value <= thresholds.needsImprovement) {
      score = Math.max(0, weight * 0.5);
      rating = 'needs-improvement';
    } else {
      score = 0;
      rating = 'poor';
    }

    return { score: Math.round(score), rating };
  }

  // Get rating based on score
  getRating(score: number): 'good' | 'needs-improvement' | 'poor' {
    if (score >= 90) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }

  // Get rating for specific metric
  getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = CORE_WEB_VITALS_THRESHOLDS[name as keyof typeof CORE_WEB_VITALS_THRESHOLDS];
    
    if (!thresholds) {
      return 'unknown' as any;
    }

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  // Calculate weighted average score
  calculateWeightedScore(metrics: PerformanceMetrics): number {
    const metricScores = [
      { name: 'LCP', value: metrics.LCP, weight: SCORE_WEIGHTS.LCP },
      { name: 'FCP', value: metrics.FCP, weight: SCORE_WEIGHTS.FCP },
      { name: 'CLS', value: metrics.CLS, weight: SCORE_WEIGHTS.CLS },
      { name: 'INP', value: metrics.INP, weight: SCORE_WEIGHTS.INP },
      { name: 'TTFB', value: metrics.TTFB, weight: SCORE_WEIGHTS.TTFB },
    ];

    let totalWeight = 0;
    let weightedSum = 0;

    metricScores.forEach(({ name, value, weight }) => {
      if (value !== null) {
        const rating = this.getMetricRating(name, value);
        const score = rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
        
        weightedSum += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // Get performance insights
  getPerformanceInsights(metrics: PerformanceMetrics): string[] {
    const insights: string[] = [];
    const breakdown = this.getScoreBreakdown(metrics);

    Object.entries(breakdown.breakdown).forEach(([metric, data]) => {
      if (data.rating === 'poor') {
        insights.push(`${metric.toUpperCase()} needs immediate attention (${data.rating})`);
      } else if (data.rating === 'needs-improvement') {
        insights.push(`${metric.toUpperCase()} could be improved (${data.rating})`);
      }
    });

    if (insights.length === 0) {
      insights.push('All Core Web Vitals are performing well');
    }

    return insights;
  }

  // Get optimization suggestions
  getOptimizationSuggestions(metrics: PerformanceMetrics): string[] {
    const suggestions: string[] = [];

    if (metrics.LCP && metrics.LCP > 2500) {
      suggestions.push('Optimize Largest Contentful Paint: Reduce image sizes, use lazy loading, optimize critical rendering path');
    }

    if (metrics.FCP && metrics.FCP > 1800) {
      suggestions.push('Improve First Contentful Paint: Minimize render-blocking resources, optimize server response time');
    }

    if (metrics.CLS && metrics.CLS > 0.1) {
      suggestions.push('Fix Cumulative Layout Shift: Set explicit dimensions for images and ads, avoid inserting content above existing content');
    }

    if (metrics.INP && metrics.INP > 200) {
      suggestions.push('Enhance Interaction to Next Paint: Optimize event handlers, reduce JavaScript execution time');
    }

    if (metrics.TTFB && metrics.TTFB > 800) {
      suggestions.push('Reduce Time to First Byte: Optimize server response time, use CDN, improve database queries');
    }

    return suggestions;
  }

  // Compare scores
  compareScores(score1: number, score2: number): { difference: number; improvement: boolean } {
    const difference = score2 - score1;
    return {
      difference,
      improvement: difference > 0,
    };
  }

  // Calculate trend
  calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 2) return 'stable';

    const recentScores = scores.slice(-3); // Last 3 scores
    const average = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const previousAverage = scores.length > 3 
      ? scores.slice(-6, -3).reduce((sum, score) => sum + score, 0) / 3
      : scores[0];

    const difference = average - previousAverage;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }
}

export default new ScoreCalculator();
