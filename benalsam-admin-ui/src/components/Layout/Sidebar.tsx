import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import {
  Home,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Package,
  Folder,
  Shield,
  Database,
  FileDown,
  Activity,
  Route,
  Bell,
  HardDrive,
  Bug,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import type { SidebarProps } from '../../types';

const navigationItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/',
    icon: Home,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    id: 'listings',
    title: 'İlan Yönetimi',
    path: '/listings',
    icon: Package,
    permission: PERMISSIONS.LISTINGS_VIEW,
  },
  {
    id: 'categories',
    title: 'Kategori Yönetimi',
    path: '/categories',
    icon: Folder,
    permission: PERMISSIONS.CATEGORIES_VIEW,
  },
  {
    id: 'users',
    title: 'Kullanıcı Yönetimi',
    path: '/users',
    icon: Users,
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    id: 'admin-management',
    title: 'Admin Yönetimi',
    path: '/admin-management',
    icon: Shield,
    permission: PERMISSIONS.ADMINS_VIEW,
  },
  {
    id: 'elasticsearch',
    title: 'Elasticsearch',
    path: '/elasticsearch',
    icon: Database,
    permission: PERMISSIONS.ADMINS_VIEW,
  },
  {
    id: 'analytics',
    title: 'Real-Time Analytics',
    path: '/analytics',
    icon: BarChart3,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    path: '/analytics-dashboard',
    icon: BarChart3,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'session-analytics',
    title: 'Session Analytics',
    path: '/session-analytics',
    icon: BarChart3,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'session-journey',
    title: 'Session Journey',
    path: '/session-journey',
    icon: Route,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'cache-dashboard',
    title: 'Cache Dashboard',
    path: '/cache-dashboard',
    icon: HardDrive,
    permission: PERMISSIONS.ADMINS_VIEW,
  },
  {
    id: 'data-export',
    title: 'Data Export',
    path: '/data-export',
    icon: FileDown,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'performance-test',
    title: 'Performance Test',
    path: '/performance-test',
    icon: Activity,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'user-journey',
    title: 'User Journey',
    path: '/user-journey',
    icon: Route,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'alerts',
    title: 'Alert System',
    path: '/alerts',
    icon: Bell,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'sentry-dashboard',
    title: 'Sentry Dashboard',
    path: '/sentry-dashboard',
    icon: Bug,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    path: '/settings',
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant = 'temporary' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const logout = useAuthStore((state) => state.logout);
  const { hasPermission } = usePermissions();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant={variant}
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: theme.spacing(35),
          boxSizing: 'border-box',
          background: mode === 'light' 
            ? 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)'
            : 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
          borderRight: 'none',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box 
        sx={{ 
          height: 64, // Normal header ile aynı yükseklik
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          background: mode === 'light' 
            ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
            : 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            fontSize: '1.25rem',
            textAlign: 'center',
            color: 'white',
          }}
        >
          BenAlsam Admin
        </Typography>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {navigationItems
          .filter(item => !item.permission || hasPermission(item.permission))
          .map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    background: mode === 'light' 
                      ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                      : 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
                    color: 'white',
                    boxShadow: mode === 'light' 
                      ? '0 4px 15px rgba(25, 118, 210, 0.3)'
                      : '0 4px 15px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      background: mode === 'light' 
                        ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                        : 'linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    minWidth: 40,
                  }}
                >
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.95rem',
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <List sx={{ pt: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              mx: 1,
              borderRadius: 2,
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText 
              primary="Çıkış Yap" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}; 