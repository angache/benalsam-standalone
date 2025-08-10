import { Listing } from './listing';
import { UserProfile } from './user';

// ===========================
// ADMIN PANEL TYPES
// ===========================

export interface AdminListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  views: number;
  favorites: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  images: string[];
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  role: string;
  is_active: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  created_at: string;
  updated_at: string;
  last_login?: string;
  lastLoginAt?: string;
  roleDetails?: any;
  userPermissions?: any[];
  permissions?: any[];
}

export interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnalyticsData {
  totalListings: number;
  totalUsers: number;
  totalRevenue: number;
  pendingListings: number;
  activeListings: number;
  rejectedListings: number;
  monthlyStats: {
    month: string;
    listings: number;
    users: number;
    revenue: number;
  }[];
}

// ===========================
// ADMIN MANAGEMENT TYPES
// ===========================

export interface Role {
  id: string;
  name: string;
  display_name: string;
  displayName?: string; // For backward compatibility
  description?: string;
  level: number;
  is_active: boolean;
  isActive?: boolean; // For backward compatibility
  created_at: string;
  createdAt?: string; // For backward compatibility
  updated_at: string;
  updatedAt?: string; // For backward compatibility
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// REAL-TIME ANALYTICS TYPES
// ===========================

export interface RealTimeMetrics {
  activeUsers: number;
  totalSessions: number;
  pageViews: number;
  avgResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  bundleSize: number;
  apiCalls: number;
}

export interface RealTimeUserActivity {
  id: string;
  userId: string;
  username: string;
  action: string;
  screen: string;
  timestamp: string;
  duration?: number;
  deviceInfo: {
    platform: string;
    model: string;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
} 