import { useState, useEffect, useCallback } from 'react';
import performanceService from '../services/performanceService';

// Performance thresholds and scoring
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 200, poor: 600 }
};

// Route-specific performance patterns
const ROUTE_PATTERNS = {
  '/': { expectedLCP: 2000, expectedFCP: 1500, description: 'Ana sayfa - hızlı yüklenmeli' },
  '/profil': { expectedLCP: 3000, expectedFCP: 2000, description: 'Profil sayfası - kullanıcı bilgileri' },
  '/ilan': { expectedLCP: 3500, expectedFCP: 2500, description: 'İlan detayı - resimler ve içerik' },
  '/ayarlar': { expectedLCP: 2500, expectedFCP: 1800, description: 'Ayarlar sayfası - form elemanları' },
  '/mesajlar': { expectedLCP: 2000, expectedFCP: 1500, description: 'Mesajlar - dinamik içerik' },
  '/envanter': { expectedLCP: 3000, expectedFCP: 2000, description: 'Envanter - liste görünümü' },
  '/premium': { expectedLCP: 2500, expectedFCP: 1800, description: 'Premium - özel içerik' }
};

// AI Analysis Engine
class PerformanceAnalyzer {
  constructor() {
    this.analysisHistory = [];
    this.patterns = new Map();
  }

  // Ana analiz fonksiyonu
  analyzeMetrics(metrics, routePath, routeDuration) {
    const analysis = {
      timestamp: new Date().toISOString(),
      route: routePath,
      duration: routeDuration,
      metrics,
      score: this.calculateOverallScore(metrics),
      issues: this.identifyIssues(metrics, routePath),
      recommendations: [],
      severity: 'low',
      trend: this.analyzeTrend(routePath, metrics),
      insights: []
    };

    // Akıllı öneriler oluştur
    analysis.recommendations = this.generateRecommendations(analysis);
    analysis.severity = this.calculateSeverity(analysis.issues);
    analysis.insights = this.generateInsights(analysis);

    // Analizi kaydet
    this.analysisHistory.push(analysis);
    this.updatePatterns(routePath, metrics);

    return analysis;
  }

  // Genel performans skoru hesapla
  calculateOverallScore(metrics) {
    const scores = {
      LCP: this.getMetricScore(metrics.LCP, PERFORMANCE_THRESHOLDS.LCP),
      INP: this.getMetricScore(metrics.INP, PERFORMANCE_THRESHOLDS.INP),
      CLS: this.getMetricScore(metrics.CLS, PERFORMANCE_THRESHOLDS.CLS),
      FCP: this.getMetricScore(metrics.FCP, PERFORMANCE_THRESHOLDS.FCP),
      TTFB: this.getMetricScore(metrics.TTFB, PERFORMANCE_THRESHOLDS.TTFB)
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore / Object.keys(scores).length);
  }

  // Metrik skoru hesapla (0-100)
  getMetricScore(value, thresholds) {
    if (!value || value === 0) return 0;
    
    if (value <= thresholds.good) return 100;
    if (value >= thresholds.poor) return 0;
    
    // Linear interpolation
    const range = thresholds.poor - thresholds.good;
    const position = value - thresholds.good;
    return Math.round(100 - (position / range) * 100);
  }

  // Sorunları tespit et
  identifyIssues(metrics, routePath) {
    const issues = [];
    const routePattern = ROUTE_PATTERNS[this.getRoutePrefix(routePath)];

    // LCP analizi
    if (metrics.LCP > PERFORMANCE_THRESHOLDS.LCP.poor) {
      issues.push({
        type: 'critical',
        metric: 'LCP',
        value: metrics.LCP,
        message: 'LCP çok yüksek - kullanıcı deneyimi ciddi şekilde etkileniyor',
        impact: 'high'
      });
    } else if (metrics.LCP > PERFORMANCE_THRESHOLDS.LCP.good) {
      issues.push({
        type: 'warning',
        metric: 'LCP',
        value: metrics.LCP,
        message: 'LCP iyileştirilmeli - yavaş sayfa yükleme',
        impact: 'medium'
      });
    }

    // Route-specific LCP analizi
    if (routePattern && metrics.LCP > routePattern.expectedLCP * 1.5) {
      issues.push({
        type: 'warning',
        metric: 'LCP',
        value: metrics.LCP,
        message: `${routePattern.description} için beklenenden yavaş`,
        impact: 'medium'
      });
    }

    // INP analizi
    if (metrics.INP > PERFORMANCE_THRESHOLDS.INP.poor) {
      issues.push({
        type: 'critical',
        metric: 'INP',
        value: metrics.INP,
        message: 'Kullanıcı etkileşimleri çok yavaş',
        impact: 'high'
      });
    }

    // CLS analizi
    if (metrics.CLS > PERFORMANCE_THRESHOLDS.CLS.poor) {
      issues.push({
        type: 'critical',
        metric: 'CLS',
        value: metrics.CLS,
        message: 'Layout kayması çok fazla - görsel karışıklık',
        impact: 'high'
      });
    }

    // TTFB analizi
    if (metrics.TTFB > PERFORMANCE_THRESHOLDS.TTFB.poor) {
      issues.push({
        type: 'critical',
        metric: 'TTFB',
        value: metrics.TTFB,
        message: 'Sunucu yanıt süresi çok yüksek',
        impact: 'high'
      });
    }

    return issues;
  }

  // Akıllı öneriler oluştur
  generateRecommendations(analysis) {
    const recommendations = [];
    const { metrics, issues, route } = analysis;

    // LCP önerileri
    if (metrics.LCP > PERFORMANCE_THRESHOLDS.LCP.good) {
      if (route.includes('/ilan/')) {
        recommendations.push({
          priority: 'high',
          category: 'image-optimization',
          title: 'İlan Resimlerini Optimize Et',
          description: 'WebP formatı kullan, lazy loading ekle, responsive images uygula',
          impact: 'LCP 30-50% iyileşebilir',
          code: 'next/image veya OptimizedImage component kullan'
        });
      } else if (route === '/') {
        recommendations.push({
          priority: 'high',
          category: 'critical-resources',
          title: 'Critical CSS Optimize Et',
          description: 'Above-the-fold CSS inline et, non-critical CSS defer et',
          impact: 'LCP 20-40% iyileşebilir',
          code: 'Critical CSS extraction tool kullan'
        });
      }
    }

    // INP önerileri
    if (metrics.INP > PERFORMANCE_THRESHOLDS.INP.good) {
      recommendations.push({
        priority: 'medium',
        category: 'javascript-optimization',
        title: 'JavaScript Bundle Optimize Et',
        description: 'Code splitting uygula, unused code eliminate et',
        impact: 'INP 25-40% iyileşebilir',
        code: 'React.lazy ve dynamic imports kullan'
      });
    }

    // CLS önerileri
    if (metrics.CLS > PERFORMANCE_THRESHOLDS.CLS.good) {
      recommendations.push({
        priority: 'high',
        category: 'layout-stability',
        title: 'Layout Shift Prevention',
        description: 'Image dimensions belirt, font loading optimize et',
        impact: 'CLS 50-80% iyileşebilir',
        code: 'width/height attributes ekle, font-display: swap kullan'
      });
    }

    // TTFB önerileri
    if (metrics.TTFB > PERFORMANCE_THRESHOLDS.TTFB.good) {
      recommendations.push({
        priority: 'critical',
        category: 'server-optimization',
        title: 'Sunucu Performansını İyileştir',
        description: 'Database queries optimize et, caching uygula',
        impact: 'TTFB 40-60% iyileşebilir',
        code: 'Redis cache, query optimization'
      });
    }

    // Route-specific öneriler
    if (route.includes('/ayarlar')) {
      recommendations.push({
        priority: 'low',
        category: 'ux-optimization',
        title: 'Form Validation Optimize Et',
        description: 'Client-side validation ekle, real-time feedback',
        impact: 'Kullanıcı deneyimi iyileşir',
        code: 'React Hook Form veya Formik kullan'
      });
    }

    return recommendations;
  }

  // Trend analizi
  analyzeTrend(routePath, currentMetrics) {
    const routeHistory = this.analysisHistory
      .filter(analysis => analysis.route === routePath)
      .slice(-5); // Son 5 analiz

    if (routeHistory.length < 2) return 'insufficient-data';

    const recentAvg = this.calculateAverageMetrics(routeHistory.slice(-2));
    const previousAvg = this.calculateAverageMetrics(routeHistory.slice(-4, -2));

    const lcpTrend = recentAvg.LCP - previousAvg.LCP;
    const inpTrend = recentAvg.INP - previousAvg.INP;

    if (lcpTrend < -500 && inpTrend < -50) return 'improving';
    if (lcpTrend > 500 || inpTrend > 50) return 'degrading';
    return 'stable';
  }

  // Ortalama metrikler hesapla
  calculateAverageMetrics(analyses) {
    const totals = { LCP: 0, INP: 0, CLS: 0, FCP: 0, TTFB: 0 };
    const count = analyses.length;

    analyses.forEach(analysis => {
      Object.keys(totals).forEach(metric => {
        totals[metric] += analysis.metrics[metric] || 0;
      });
    });

    return Object.keys(totals).reduce((avg, metric) => {
      avg[metric] = Math.round(totals[metric] / count);
      return avg;
    }, {});
  }

  // Severity hesapla
  calculateSeverity(issues) {
    const criticalCount = issues.filter(issue => issue.type === 'critical').length;
    const warningCount = issues.filter(issue => issue.type === 'warning').length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 2) return 'high';
    if (warningCount > 0) return 'medium';
    return 'low';
  }

  // İçgörüler oluştur
  generateInsights(analysis) {
    const insights = [];
    const { metrics, route, score } = analysis;

    // Genel performans içgörüsü
    if (score >= 90) {
      insights.push('🎉 Mükemmel performans! Kullanıcı deneyimi optimal.');
    } else if (score >= 70) {
      insights.push('👍 İyi performans, bazı iyileştirmeler yapılabilir.');
    } else {
      insights.push('⚠️ Performans iyileştirme gerekli. Kullanıcı deneyimi etkilenebilir.');
    }

    // Route-specific içgörüler
    if (route.includes('/ilan/') && metrics.LCP > 3000) {
      insights.push('🖼️ İlan sayfalarında resim optimizasyonu öncelikli.');
    }

    if (route.includes('/ayarlar') && metrics.INP > 200) {
      insights.push('⚡ Ayarlar sayfasında JavaScript optimizasyonu gerekli.');
    }

    // Trend içgörüsü
    if (analysis.trend === 'improving') {
      insights.push('📈 Performans trendi iyileşiyor - optimizasyonlar etkili.');
    } else if (analysis.trend === 'degrading') {
      insights.push('📉 Performans trendi kötüleşiyor - acil müdahale gerekli.');
    }

    return insights;
  }

  // Route prefix al
  getRoutePrefix(routePath) {
    const segments = routePath.split('/');
    if (segments.length > 1) {
      return `/${segments[1]}`;
    }
    return routePath;
  }

  // Pattern'ları güncelle
  updatePatterns(routePath, metrics) {
    const prefix = this.getRoutePrefix(routePath);
    if (!this.patterns.has(prefix)) {
      this.patterns.set(prefix, []);
    }
    this.patterns.get(prefix).push(metrics);
  }

  // Son analizleri al
  getRecentAnalyses(limit = 10) {
    return this.analysisHistory.slice(-limit);
  }

  // Route'a göre analiz geçmişi
  getRouteHistory(routePath) {
    return this.analysisHistory.filter(analysis => analysis.route === routePath);
  }
}

// Global analyzer instance
const performanceAnalyzer = new PerformanceAnalyzer();

// React Hook
export const useAIPerformanceAnalysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Yeni analiz ekle
  const addAnalysis = useCallback(async (metrics, routePath, routeDuration) => {
    setIsAnalyzing(true);
    
    try {
      const analysis = performanceAnalyzer.analyzeMetrics(metrics, routePath, routeDuration);
      
      // Redis'e kaydet (Admin Backend üzerinden)
      try {
        await performanceService.saveAnalysis(analysis);
        console.log('✅ Performance analysis saved to Redis');
      } catch (error) {
        console.warn('⚠️ Failed to save to Redis, keeping in memory only:', error);
      }
      
      setAnalyses(prev => {
        const newAnalyses = [...prev, analysis];
        // Son 50 analizi tut
        return newAnalyses.slice(-50);
      });

      // Development modunda console'da göster
      if (import.meta.env.DEV) {
        console.group('🤖 AI Performance Analysis');
        console.log('Route:', routePath);
        console.log('Score:', analysis.score);
        console.log('Severity:', analysis.severity);
        console.log('Issues:', analysis.issues.length);
        console.log('Recommendations:', analysis.recommendations.length);
        console.log('Insights:', analysis.insights);
        console.groupEnd();
      }

      return analysis;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Son analizleri al
  const getRecentAnalyses = useCallback((limit = 10) => {
    return analyses.slice(-limit);
  }, [analyses]);

  // Route'a göre analiz geçmişi
  const getRouteHistory = useCallback((routePath) => {
    return analyses.filter(analysis => analysis.route === routePath);
  }, [analyses]);

  // Genel istatistikler
  const getStatistics = useCallback(() => {
    if (analyses.length === 0) return null;

    const totalRoutes = new Set(analyses.map(a => a.route)).size;
    const avgScore = Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length);
    const criticalIssues = analyses.reduce((sum, a) => sum + a.issues.filter(i => i.type === 'critical').length, 0);
    const improvingTrends = analyses.filter(a => a.trend === 'improving').length;

    return {
      totalAnalyses: analyses.length,
      totalRoutes,
      averageScore: avgScore,
      criticalIssues,
      improvingTrends,
      lastAnalysis: analyses[analyses.length - 1]
    };
  }, [analyses]);

  return {
    addAnalysis,
    getRecentAnalyses,
    getRouteHistory,
    getStatistics,
    isAnalyzing,
    analyses
  };
};

export default useAIPerformanceAnalysis;
