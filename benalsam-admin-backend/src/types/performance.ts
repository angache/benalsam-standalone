// Performance Types for Admin Backend
// Enterprise-grade type definitions for performance monitoring

export interface CoreWebVitals {
  LCP?: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  FCP?: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  CLS?: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  INP?: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  TTFB?: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
}

export interface PerformanceMetrics extends CoreWebVitals {
  route: string;
  duration: number;
  score: number;
  issues: PerformanceIssue[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number;
    rtt: number;
  };
}

export interface PerformanceIssue {
  id: string;
  type: 'lcp' | 'fcp' | 'cls' | 'inp' | 'ttfb' | 'memory' | 'cpu' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'image-optimization' | 'css-optimization' | 'js-optimization' | 'network-optimization' | 'server-optimization';
  estimatedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}

export interface AIRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'image-optimization' | 'css-optimization' | 'js-optimization' | 'network-optimization' | 'server-optimization';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  implementation?: {
    steps: string[];
    code?: string;
    resources?: string[];
  };
}

export interface PerformanceAnalysisRequest {
  route: string;
  duration: number;
  metrics: CoreWebVitals;
  score?: number;
  issues?: PerformanceIssue[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  trend?: 'improving' | 'stable' | 'degrading';
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number;
    rtt: number;
  };
}

export interface PerformanceAnalysisResponse {
  success: boolean;
  data: {
    calculatedScore: number;
    aiInsights: string[];
    aiRecommendations: AIRecommendation[];
    performanceTrend: {
      current: number;
      previous: number;
      change: number;
      trend: 'improving' | 'stable' | 'degrading';
    };
    optimizationScore: {
      overall: number;
      lcp: number;
      fcp: number;
      cls: number;
      inp: number;
      ttfb: number;
    };
    nextSteps: string[];
  };
  message?: string;
}

export interface PerformanceThresholds {
  LCP: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  FCP: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  CLS: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  INP: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  TTFB: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

export interface PerformanceScoreWeights {
  LCP: number;
  FCP: number;
  CLS: number;
  INP: number;
  TTFB: number;
}

export interface PerformanceTrend {
  route: string;
  period: '1h' | '24h' | '7d' | '30d';
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'stable' | 'degrading';
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface PerformanceAlert {
  id: string;
  route: string;
  type: 'threshold' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold?: number;
  currentValue: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

// Constants
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
    poor: 4000
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
    poor: 3000
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
    poor: 0.25
  },
  INP: {
    good: 200,
    needsImprovement: 500,
    poor: 500
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
    poor: 1800
  }
};

export const PERFORMANCE_SCORE_WEIGHTS: PerformanceScoreWeights = {
  LCP: 0.3,
  FCP: 0.2,
  CLS: 0.25,
  INP: 0.15,
  TTFB: 0.1
};

export const PERFORMANCE_CATEGORIES = {
  IMAGE_OPTIMIZATION: 'image-optimization',
  CSS_OPTIMIZATION: 'css-optimization',
  JS_OPTIMIZATION: 'js-optimization',
  NETWORK_OPTIMIZATION: 'network-optimization',
  SERVER_OPTIMIZATION: 'server-optimization'
} as const;

export const PERFORMANCE_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const PERFORMANCE_TREND = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  DEGRADING: 'degrading'
} as const;

// Type guards
export const isCoreWebVitals = (obj: unknown): obj is CoreWebVitals => {
  return typeof obj === 'object' && obj !== null && (
    'LCP' in obj || 'FCP' in obj || 'CLS' in obj || 'INP' in obj || 'TTFB' in obj
  );
};

export const isPerformanceMetrics = (obj: unknown): obj is PerformanceMetrics => {
  return typeof obj === 'object' && obj !== null && 
    'route' in obj && 
    'duration' in obj && 
    'score' in obj &&
    'timestamp' in obj;
};

export const isPerformanceIssue = (obj: unknown): obj is PerformanceIssue => {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'severity' in obj &&
    'title' in obj &&
    'description' in obj;
};
