import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Users,
  Package,
  FolderOpen,
  TrendingUp,
  Eye,
  Heart,
  AlertTriangle,
  CheckCircle,
  Server,
  Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, icon, color, trend }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUp
                size={16}
                color={trend >= 0 ? '#4caf50' : '#f44336'}
                style={{ marginRight: 4 }}
              />
              <Typography
                variant="body2"
                color={trend >= 0 ? 'success.main' : 'error.main'}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: servicesHealth, isLoading: servicesLoading } = useQuery({
    queryKey: ['services-health'],
    queryFn: () => apiService.getServicesHealth(),
    staleTime: 30 * 1000, // 30 seconds - more frequent updates
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  // Use real data from API, fallback to zeros if not available
  const data = stats || {
    totalUsers: 0,
    totalListings: 0,
    totalCategories: 0,
    totalRevenue: 0,
    activeListings: 0,
    pendingModeration: 0,
    newUsersToday: 0,
    newListingsToday: 0,
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Sistem genel durumu ve istatistikler
      </Typography>

      <Grid container spacing={3}>
        {/* Main Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Kullanıcı"
            value={data.totalUsers.toLocaleString()}
            icon={<Users size={24} color="white" />}
            color="#1976d2"
            trend={12}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam İlan"
            value={data?.totalListings?.toLocaleString() || '0'}
            icon={<Package size={24} color="white" />}
            color="#388e3c"
            trend={8}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kategoriler"
            value={data?.totalCategories || '0'}
            icon={<FolderOpen size={24} color="white" />}
            color="#f57c00"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Gelir"
            value={`₺${data?.totalRevenue?.toLocaleString() || '0'}`}
            icon={<TrendingUp size={24} color="white" />}
            color="#7b1fa2"
            trend={15}
          />
        </Grid>

        {/* Secondary Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktif İlanlar"
            value={data?.activeListings?.toLocaleString() || '0'}
            icon={<CheckCircle size={24} color="white" />}
            color="#388e3c"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Moderasyon Bekleyen"
            value={data?.pendingModeration || '0'}
            icon={<AlertTriangle size={24} color="white" />}
            color="#f57c00"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bugün Yeni Kullanıcı"
            value={data?.newUsersToday || '0'}
            icon={<Users size={24} color="white" />}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bugün Yeni İlan"
            value={data?.newListingsToday || '0'}
            icon={<Package size={24} color="white" />}
            color="#388e3c"
          />
        </Grid>
      </Grid>

      {/* System Status Card */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Server size={24} style={{ marginRight: 12 }} />
                <Typography variant="h6" component="h2">
                  Sistem Durumu
                </Typography>
              </Box>
              
              {servicesLoading ? (
                <LinearProgress />
              ) : servicesHealth?.data ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Chip
                      icon={
                        servicesHealth.data.overall === 'healthy' ? (
                          <CheckCircle size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )
                      }
                      label={
                        servicesHealth.data.overall === 'healthy'
                          ? 'Tüm Servisler Sağlıklı'
                          : `${servicesHealth.data.unhealthy} Servis Sorunlu`
                      }
                      color={servicesHealth.data.overall === 'healthy' ? 'success' : 'warning'}
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {servicesHealth.data.healthy}/{servicesHealth.data.total} servis çalışıyor
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {servicesHealth.data.services.map((service) => (
                      <Grid item xs={12} sm={6} md={4} key={service.name}>
                        <Box
                          sx={{
                            p: 2,
                            border: `1px solid ${
                              service.healthy ? '#4caf50' : '#f44336'
                            }`,
                            borderRadius: 2,
                            bgcolor: service.healthy
                              ? 'rgba(76, 175, 80, 0.05)'
                              : 'rgba(244, 67, 54, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Activity
                              size={20}
                              color={service.healthy ? '#4caf50' : '#f44336'}
                              style={{ marginRight: 8 }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {service.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {service.responseTime}ms
                              </Typography>
                            </Box>
                          </Box>
                          {service.healthy ? (
                            <CheckCircle size={20} color="#4caf50" />
                          ) : (
                            <AlertTriangle size={20} color="#f44336" />
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Servis durumu yükleniyor...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Hızlı İşlemler
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Chip
              label="Moderasyon Bekleyen İlanları Görüntüle"
              color="warning"
              variant="outlined"
              clickable
            />
          </Grid>
          <Grid item>
            <Chip
              label="Yeni Kullanıcıları İncele"
              color="primary"
              variant="outlined"
              clickable
            />
          </Grid>
          <Grid item>
            <Chip
              label="Sistem Ayarlarını Düzenle"
              color="secondary"
              variant="outlined"
              clickable
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 