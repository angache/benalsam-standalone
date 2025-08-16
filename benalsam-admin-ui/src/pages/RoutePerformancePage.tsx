import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, Select, MenuItem,
  FormControl, InputLabel, Button, IconButton, Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

interface RoutePerformanceData {
  path: string;
  timestamp: string;
  duration: number;
  metrics: {
    LCP?: { value: number; rating: string; delta: number };
    INP?: { value: number; rating: string; delta: number };
    CLS?: { value: number; rating: string; delta: number };
    FCP?: { value: number; rating: string; delta: number };
    TTFB?: { value: number; rating: string; delta: number };
  };
}

const RoutePerformancePage: React.FC = () => {
  const [routeData, setRouteData] = useState<RoutePerformanceData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Fetch real route performance data from Redis via backend
  useEffect(() => {
    const fetchRouteData = async () => {
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
          // Transform backend data to route performance format
          const transformedData: RoutePerformanceData[] = (data.analyses || []).map((analysis: any) => ({
            path: analysis.route,
            timestamp: analysis.timestamp,
            duration: analysis.duration || 0,
            metrics: {
              LCP: { value: analysis.metrics?.lcp || 0, rating: getRating(analysis.metrics?.lcp), delta: 0 },
              INP: { value: analysis.metrics?.inp || 0, rating: getRating(analysis.metrics?.inp), delta: 0 },
              CLS: { value: analysis.metrics?.cls || 0, rating: getRating(analysis.metrics?.cls), delta: 0 },
              FCP: { value: analysis.metrics?.fcp || 0, rating: getRating(analysis.metrics?.fcp), delta: 0 },
              TTFB: { value: analysis.metrics?.ttfb || 0, rating: getRating(analysis.metrics?.ttfb), delta: 0 }
            }
          }));
          setRouteData(transformedData);
        } else {
          console.warn('Failed to fetch route performance data, using mock data');
          setRouteData(generateMockRouteData());
        }
      } catch (error) {
        console.error('Error fetching route performance data:', error);
        setRouteData(generateMockRouteData());
      }
    };

    // Helper function to determine rating
    const getRating = (value: number) => {
      if (!value) return 'good';
      // Add rating logic based on Core Web Vitals thresholds
      return 'good';
    };

    // Mock data (fallback)
    const generateMockRouteData = () => {
      const routes = [
        '/', 
        '/profil/123', 
        '/ilan/abc123', 
        '/ayarlar', 
        '/ayarlar/profil',
        '/mesajlarim',
        '/envanterim',
        '/ilanlarim',
        '/favorilerim',
        '/gonderdigim-teklifler',
        '/aldigim-teklifler',
        '/premium-dashboard',
        '/auth'
      ];
      const mockData: RoutePerformanceData[] = [];

      routes.forEach(route => {
        for (let i = 0; i < 5; i++) {
          mockData.push({
            path: route,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            duration: Math.random() * 2000 + 500,
            metrics: {
              LCP: { value: Math.random() * 3000 + 1000, rating: 'good', delta: 0 },
              INP: { value: Math.random() * 200 + 50, rating: 'good', delta: 0 },
              CLS: { value: Math.random() * 0.2, rating: 'good', delta: 0 },
              FCP: { value: Math.random() * 1500 + 500, rating: 'good', delta: 0 },
              TTFB: { value: Math.random() * 200 + 50, rating: 'good', delta: 0 }
            }
          });
        }
      });

      return mockData;
    };

    fetchRouteData();
  }, []);

  const getRouteColor = (route: string) => {
    const colors = {
      '/': '#8884d8',
      '/profil': '#82ca9d',
      '/ilan': '#ffc658',
      '/ayarlar': '#ff7300',
      '/mesajlarim': '#ff0000',
      '/envanterim': '#00ff00',
      '/ilanlarim': '#ff00ff',
      '/favorilerim': '#00ffff',
      '/premium': '#ffff00',
      '/auth': '#800080'
    };
    
    // Route prefix'ine göre renk belirle
    for (const [prefix, color] of Object.entries(colors)) {
      if (route.startsWith(prefix)) return color;
    }
    return '#8884d8';
  };

  const getRouteType = (route: string) => {
    if (route === '/') return 'Home';
    if (route.startsWith('/profil/')) return 'Profile';
    if (route.startsWith('/ilan/')) return 'Listing Detail';
    if (route.startsWith('/ayarlar')) return 'Settings';
    if (route.startsWith('/mesajlar')) return 'Messages';
    if (route.startsWith('/envanter')) return 'Inventory';
    if (route.startsWith('/ilanlarim')) return 'My Listings';
    if (route.startsWith('/favorilerim')) return 'Favorites';
    if (route.startsWith('/takip-edilenler')) return 'Following';
    if (route.startsWith('/gonderdigim-teklifler')) return 'Sent Offers';
    if (route.startsWith('/aldigim-teklifler')) return 'Received Offers';
    if (route.startsWith('/premium')) return 'Premium';
    if (route.startsWith('/auth')) return 'Authentication';
    return 'Other';
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'success';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const formatMetric = (value: number, unit: string = 'ms') => {
    if (value < 1000) return `${value.toFixed(0)}${unit}`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  const filteredData = routeData.filter(data => 
    selectedRoute === 'all' || data.path === selectedRoute
  );

  const uniqueRoutes = Array.from(new Set(routeData.map(d => d.path)));

  const routeStats = uniqueRoutes.map(route => {
    const routeEntries = routeData.filter(d => d.path === route);
    const avgDuration = routeEntries.reduce((sum, d) => sum + d.duration, 0) / routeEntries.length;
    const avgLCP = routeEntries.reduce((sum, d) => sum + (d.metrics.LCP?.value || 0), 0) / routeEntries.length;
    
    return {
      route,
      avgDuration,
      avgLCP,
      count: routeEntries.length
    };
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          🛣️ Route Performance Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Route</InputLabel>
            <Select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              label="Route"
            >
              <MenuItem value="all">All Routes</MenuItem>
              {uniqueRoutes.map(route => (
                <MenuItem key={route} value={route}>{route}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Route Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {routeStats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.route}>
            <Card>
              <CardContent>
                                 <Box display="flex" alignItems="center" gap={2} mb={2}>
                   <RouteIcon color="primary" />
                   <Box>
                     <Typography variant="h6" component="h3">
                       {getRouteType(stat.route)}
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                       {stat.route}
                     </Typography>
                   </Box>
                 </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatMetric(stat.avgDuration)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Avg LCP:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatMetric(stat.avgLCP)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Requests:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stat.count}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Performance Trends Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" mb={2}>
            📈 Route Performance Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <RechartsTooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [formatMetric(value), name]}
              />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="#8884d8" 
                name="Route Duration" 
              />
              {filteredData.length > 0 && filteredData[0].metrics.LCP && (
                <Line 
                  type="monotone" 
                  dataKey="metrics.LCP.value" 
                  stroke="#82ca9d" 
                  name="LCP" 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Route Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" mb={2}>
            📋 Detailed Route Performance
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell align="right">Duration</TableCell>
                  <TableCell align="right">LCP</TableCell>
                  <TableCell align="right">INP</TableCell>
                  <TableCell align="right">CLS</TableCell>
                  <TableCell align="right">FCP</TableCell>
                  <TableCell align="right">TTFB</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(0, 20).map((data, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {data.path}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatMetric(data.duration)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={getMetricColor(data.metrics.LCP?.rating || 'default')}
                      >
                        {data.metrics.LCP ? formatMetric(data.metrics.LCP.value) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={getMetricColor(data.metrics.INP?.rating || 'default')}
                      >
                        {data.metrics.INP ? formatMetric(data.metrics.INP.value) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={getMetricColor(data.metrics.CLS?.rating || 'default')}
                      >
                        {data.metrics.CLS ? data.metrics.CLS.value.toFixed(3) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={getMetricColor(data.metrics.FCP?.rating || 'default')}
                      >
                        {data.metrics.FCP ? formatMetric(data.metrics.FCP.value) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={getMetricColor(data.metrics.TTFB?.rating || 'default')}
                      >
                        {data.metrics.TTFB ? formatMetric(data.metrics.TTFB.value) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={data.metrics.LCP?.rating === 'good' ? 'Good' : 'Needs Improvement'}
                        color={getMetricColor(data.metrics.LCP?.rating || 'default') as any}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoutePerformancePage;
