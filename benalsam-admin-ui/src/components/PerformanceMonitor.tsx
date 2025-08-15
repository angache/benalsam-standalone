import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, Speed, Warning, CheckCircle } from '@mui/icons-material';
import { usePerformanceMonitoring } from '../utils/performance';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { metrics, isGood, score } = usePerformanceMonitoring();
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Show monitor after 3 seconds
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle />;
    if (score >= 70) return <Warning />;
    return <Warning />;
  };

  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value}${unit}`;
  };

  const getMetricColor = (name: string, value: number | null) => {
    if (value === null) return 'default';
    
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      INP: { good: 200, needsImprovement: 500 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
    };
    
    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'default';
    
    if (value <= threshold.good) return 'success';
    if (value <= threshold.needsImprovement) return 'warning';
    return 'error';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1300,
        maxWidth: 320,
      }}
      className={className}
    >
      <Card elevation={3}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Performance Monitor
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={getScoreIcon(score)}
                label={`${score}`}
                color={getScoreColor(score)}
                size="small"
                variant="outlined"
              />
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ ml: 1 }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={expanded || showDetails}>
            <Box sx={{ mt: 1, space: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  LCP:
                </Typography>
                <Chip
                  label={formatMetric(metrics.LCP)}
                  color={getMetricColor('LCP', metrics.LCP)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  INP:
                </Typography>
                <Chip
                  label={formatMetric(metrics.INP)}
                  color={getMetricColor('INP', metrics.INP)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  CLS:
                </Typography>
                <Chip
                  label={formatMetric(metrics.CLS, '')}
                  color={getMetricColor('CLS', metrics.CLS)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  FCP:
                </Typography>
                <Chip
                  label={formatMetric(metrics.FCP)}
                  color={getMetricColor('FCP', metrics.FCP)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  TTFB:
                </Typography>
                <Chip
                  label={formatMetric(metrics.TTFB)}
                  color={getMetricColor('TTFB', metrics.TTFB)}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Collapse>

          <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Status:
              </Typography>
              <Chip
                label={isGood ? 'Good' : 'Needs Improvement'}
                color={isGood ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceMonitor;
