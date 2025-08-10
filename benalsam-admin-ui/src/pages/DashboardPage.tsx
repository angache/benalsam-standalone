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

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  // Mock data for demo
  const mockStats = {
    totalUsers: 1247,
    totalListings: 3421,
    totalCategories: 156,
    totalRevenue: 45230,
    activeListings: 2891,
    pendingModeration: 23,
    newUsersToday: 12,
    newListingsToday: 45,
  };

  const data = stats || mockStats;

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
            value={data.totalListings.toLocaleString()}
            icon={<Package size={24} color="white" />}
            color="#388e3c"
            trend={8}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kategoriler"
            value={data.totalCategories}
            icon={<FolderOpen size={24} color="white" />}
            color="#f57c00"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Gelir"
            value={`₺${data.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp size={24} color="white" />}
            color="#7b1fa2"
            trend={15}
          />
        </Grid>

        {/* Secondary Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktif İlanlar"
            value={data.activeListings.toLocaleString()}
            icon={<CheckCircle size={24} color="white" />}
            color="#388e3c"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Moderasyon Bekleyen"
            value={data.pendingModeration}
            icon={<AlertTriangle size={24} color="white" />}
            color="#f57c00"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bugün Yeni Kullanıcı"
            value={data.newUsersToday}
            icon={<Users size={24} color="white" />}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bugün Yeni İlan"
            value={data.newListingsToday}
            icon={<Package size={24} color="white" />}
            color="#388e3c"
          />
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