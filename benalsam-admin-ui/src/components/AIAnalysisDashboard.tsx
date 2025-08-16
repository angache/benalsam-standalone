import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Alert, AlertTitle,
  List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary,
  AccordionDetails, Button, IconButton, Tooltip, Badge, Divider,
  LinearProgress, Paper
} from '@mui/material';
import {
  Psychology as PsychologyIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Warning as WarningIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon,
  Lightbulb as LightbulbIcon, Code as CodeIcon, Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon, Refresh as RefreshIcon, Analytics as AnalyticsIcon,
  BugReport as BugReportIcon, Build as BuildIcon, Storage as StorageIcon,
  Image as ImageIcon, Code as CodeIcon2, Settings as SettingsIcon
} from '@mui/icons-material';

interface AIAnalysis {
  timestamp: string;
  route: string;
  duration: number;
  metrics: {
    LCP?: number;
    INP?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  };
  score: number;
  issues: Array<{
    type: 'critical' | 'warning';
    metric: string;
    value: number;
    message: string;
    impact: string;
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
    code: string;
  }>;
  severity: 'critical' | 'high' | 'medium' | 'low';
  trend: 'improving' | 'degrading' | 'stable' | 'insufficient-data';
  insights: string[];
}

const AIAnalysisDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  // Fetch real performance analysis data from Redis via backend
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        // Get auth token from Zustand store
        const { token } = useAuthStore.getState();
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('http://localhost:3002/api/v1/performance-analysis/analyses', {
          headers
        });
        if (response.ok) {
          const data = await response.json();
          // Transform backend data to match AIAnalysis interface
          const transformedData = (data.analyses || []).map((analysis: any) => ({
            id: analysis.id,
            route: analysis.route,
            timestamp: analysis.timestamp,
            duration: analysis.duration || 0,
            metrics: {
              lcp: analysis.metrics?.LCP?.value || 0,
              fcp: analysis.metrics?.FCP?.value || 0,
              cls: analysis.metrics?.CLS?.value || 0,
              inp: analysis.metrics?.INP?.value || 0,
              ttfb: analysis.metrics?.TTFB?.value || 0
            },
            score: analysis.score || 0,
            issues: analysis.issues || [],
            recommendations: analysis.recommendations || [],
            severity: analysis.severity || 'low',
            trend: analysis.trend || 'stable',
            insights: analysis.insights || []
          }));
          setAnalyses(transformedData);
        } else {
          console.warn('Failed to fetch performance analyses, using mock data');
          // Fallback to mock data if API fails
          setAnalyses(generateMockAnalyses());
        }
      } catch (error) {
        console.error('Error fetching performance analyses:', error);
        // Fallback to mock data
        setAnalyses(generateMockAnalyses());
      }
    };

    // Mock AI analysis data (fallback)
    const generateMockAnalyses = (): AIAnalysis[] => {
      return [
        {
          timestamp: new Date().toISOString(),
          route: '/profil/123',
          duration: 1500,
          metrics: {
            LCP: 3900,
            INP: 189,
            CLS: 0.182,
            FCP: 1200,
            TTFB: 167
          },
          score: 45,
          issues: [
            {
              type: 'critical',
              metric: 'LCP',
              value: 3900,
              message: 'LCP çok yüksek - kullanıcı deneyimi ciddi şekilde etkileniyor',
              impact: 'high'
            },
            {
              type: 'critical',
              metric: 'CLS',
              value: 0.182,
              message: 'Layout kayması çok fazla - görsel karışıklık',
              impact: 'high'
            }
          ],
          recommendations: [
            {
              priority: 'high',
              category: 'image-optimization',
              title: 'İlan Resimlerini Optimize Et',
              description: 'WebP formatı kullan, lazy loading ekle, responsive images uygula',
              impact: 'LCP 30-50% iyileşebilir',
              code: 'next/image veya OptimizedImage component kullan'
            },
            {
              priority: 'high',
              category: 'layout-stability',
              title: 'Layout Shift Prevention',
              description: 'Image dimensions belirt, font loading optimize et',
              impact: 'CLS 50-80% iyileşebilir',
              code: 'width/height attributes ekle, font-display: swap kullan'
            }
          ],
          severity: 'critical',
          trend: 'degrading',
          insights: [
            '⚠️ Performans iyileştirme gerekli. Kullanıcı deneyimi etkilenebilir.',
            '🖼️ İlan sayfalarında resim optimizasyonu öncelikli.',
            '📉 Performans trendi kötüleşiyor - acil müdahale gerekli.'
          ]
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          route: '/',
          duration: 635,
          metrics: {
            LCP: 2300,
            INP: 74,
            CLS: 0.061,
            FCP: 801,
            TTFB: 68
          },
          score: 85,
          issues: [
            {
              type: 'warning',
              metric: 'LCP',
              value: 2300,
              message: 'LCP iyileştirilmeli - yavaş sayfa yükleme',
              impact: 'medium'
            }
          ],
          recommendations: [
            {
              priority: 'high',
              category: 'critical-resources',
              title: 'Critical CSS Optimize Et',
              description: 'Above-the-fold CSS inline et, non-critical CSS defer et',
              impact: 'LCP 20-40% iyileşebilir',
              code: 'Critical CSS extraction tool kullan'
            }
          ],
          severity: 'medium',
          trend: 'stable',
          insights: [
            '👍 İyi performans, bazı iyileştirmeler yapılabilir.',
            '📈 Performans trendi iyileşiyor - optimizasyonlar etkili.'
          ]
        }
      ];
    };

    fetchAnalyses();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <CheckCircleIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon color="success" />;
      case 'degrading': return <TrendingDownIcon color="error" />;
      case 'stable': return <TrendingUpIcon color="info" />;
      default: return <TrendingUpIcon color="disabled" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image-optimization': return <ImageIcon />;
      case 'javascript-optimization': return <CodeIcon />;
      case 'layout-stability': return <BuildIcon />;
      case 'server-optimization': return <StorageIcon />;
      case 'critical-resources': return <SpeedIcon />;
      case 'ux-optimization': return <SettingsIcon />;
      default: return <CodeIcon2 />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatMetric = (value: number, unit: string = 'ms') => {
    if (value < 1000) return `${value.toFixed(0)}${unit}`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  const handleIssueToggle = (issueId: string) => {
    setExpandedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const overallStats = analyses.reduce((stats, analysis) => {
    stats.totalAnalyses++;
    stats.totalScore += analysis.score;
    stats.criticalIssues += analysis.issues.filter(i => i.type === 'critical').length;
    stats.warningIssues += analysis.issues.filter(i => i.type === 'warning').length;
    if (analysis.trend === 'improving') stats.improvingTrends++;
    if (analysis.trend === 'degrading') stats.degradingTrends++;
    return stats;
  }, {
    totalAnalyses: 0,
    totalScore: 0,
    criticalIssues: 0,
    warningIssues: 0,
    improvingTrends: 0,
    degradingTrends: 0
  });

  const averageScore = overallStats.totalAnalyses > 0 
    ? Math.round(overallStats.totalScore / overallStats.totalAnalyses) 
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <PsychologyIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              🤖 AI Performance Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Akıllı performans analizi ve öneriler
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh Analysis
        </Button>
      </Box>

      {/* Overall Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AnalyticsIcon color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {averageScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={averageScore} 
                sx={{ mt: 2 }}
                color={averageScore >= 80 ? 'success' : averageScore >= 60 ? 'warning' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BugReportIcon color="error" />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {overallStats.criticalIssues}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Issues
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success">
                    {overallStats.improvingTrends}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Improving Trends
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingDownIcon color="error" />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {overallStats.degradingTrends}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Degrading Trends
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Analysis Results */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" mb={3}>
                📊 AI Analysis Results
              </Typography>
              
              {analyses.map((analysis, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {/* Analysis Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {analysis.route}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(analysis.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        icon={getSeverityIcon(analysis.severity)}
                        label={analysis.severity.toUpperCase()}
                        color={getSeverityColor(analysis.severity)}
                        size="small"
                      />
                      {getTrendIcon(analysis.trend)}
                    </Box>
                  </Box>

                  {/* Score and Metrics */}
                  <Box display="flex" gap={2} mb={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold" color={analysis.score >= 80 ? 'success' : analysis.score >= 60 ? 'warning' : 'error'}>
                        {analysis.score}
                      </Typography>
                      <Typography variant="caption">Score</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Metrics:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {Object.entries(analysis.metrics).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${formatMetric(value)}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  {/* Issues */}
                  {analysis.issues.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        🚨 Issues Found:
                      </Typography>
                      <List dense>
                        {analysis.issues.map((issue, issueIndex) => (
                          <ListItem key={issueIndex} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              {issue.type === 'critical' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={issue.message}
                              secondary={`${issue.metric}: ${formatMetric(issue.value)} (${issue.impact} impact)`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        💡 AI Recommendations:
                      </Typography>
                      <List dense>
                        {analysis.recommendations.map((rec, recIndex) => (
                          <ListItem key={recIndex} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              {getCategoryIcon(rec.category)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  {rec.title}
                                  <Chip
                                    label={rec.priority}
                                    size="small"
                                    color={getPriorityColor(rec.priority)}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2">{rec.description}</Typography>
                                  <Typography variant="caption" color="success.main">
                                    Impact: {rec.impact}
                                  </Typography>
                                  <Typography variant="caption" display="block" fontFamily="monospace" bgcolor="grey.100" p={0.5} borderRadius={0.5}>
                                    {rec.code}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Insights */}
                  {analysis.insights.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        🧠 AI Insights:
                      </Typography>
                      <List dense>
                        {analysis.insights.map((insight, insightIndex) => (
                          <ListItem key={insightIndex} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              <LightbulbIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={insight} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" mb={3}>
                📈 Analysis Summary
              </Typography>
              
              <Box mb={3}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                  Overall Statistics:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Total Analyses" 
                      secondary={overallStats.totalAnalyses}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Critical Issues" 
                      secondary={overallStats.criticalIssues}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Warning Issues" 
                      secondary={overallStats.warningIssues}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Improving Trends" 
                      secondary={overallStats.improvingTrends}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Degrading Trends" 
                      secondary={overallStats.degradingTrends}
                    />
                  </ListItem>
                </List>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                  🎯 Priority Actions:
                </Typography>
                <List dense>
                  {analyses
                    .flatMap(a => a.recommendations)
                    .filter(r => r.priority === 'critical' || r.priority === 'high')
                    .slice(0, 5)
                    .map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getCategoryIcon(rec.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.title}
                          secondary={rec.impact}
                        />
                      </ListItem>
                    ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAnalysisDashboard;
