/**
 * Admin Dashboard Component
 * Main dashboard for admin operations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Activity
} from 'lucide-react';
import { adminAuthService } from '@/services/adminAuthService';
import { AdminAnalyticsService } from '@/services/adminAnalyticsService';
import { errorHandler } from '@/lib/errorHandler';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalOffers: number;
  totalConversations: number;
  activeListings: number;
  pendingListings: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    listings: number;
    offers: number;
  };
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'user' | 'listing' | 'offer' | 'conversation';
    action: string;
    details: string;
    timestamp: string;
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color = 'blue' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className={`text-${color}-600`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change !== undefined && (
        <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}% from last month
        </p>
      )}
    </CardContent>
  </Card>
);

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'user' | 'listing' | 'offer' | 'conversation';
    action: string;
    details: string;
    timestamp: string;
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'listing': return <FileText className="h-4 w-4" />;
      case 'offer': return <MessageSquare className="h-4 w-4" />;
      case 'conversation': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'listing': return 'bg-green-100 text-green-800';
      case 'offer': return 'bg-purple-100 text-purple-800';
      case 'conversation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-4 p-3 border rounded-lg">
      <div className={`p-2 rounded-full ${getBadgeColor(activity.type)}`}>
        {getIcon(activity.type)}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{activity.action}</p>
        <p className="text-xs text-gray-500">{activity.details}</p>
      </div>
      <div className="text-xs text-gray-400">
        {new Date(activity.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await AdminAnalyticsService.getDashboardStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        errorHandler.handleApiError(response.error, 'loadDashboardStats');
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'loadDashboardStats');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardStats();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'moderate':
        // Navigate to moderation panel
        window.location.href = '/admin/moderation';
        break;
      case 'users':
        // Navigate to user management
        window.location.href = '/admin/users';
        break;
      case 'analytics':
        // Navigate to analytics
        window.location.href = '/admin/analytics';
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Dashboard verileri yüklenemedi</h3>
        <Button onClick={handleRefresh}>Tekrar Dene</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Sistem genel durumu ve istatistikler</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <Activity className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers.toLocaleString()}
          change={stats.monthlyGrowth.users}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          title="Aktif İlanlar"
          value={stats.activeListings.toLocaleString()}
          change={stats.monthlyGrowth.listings}
          icon={<FileText className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          title="Toplam Teklif"
          value={stats.totalOffers.toLocaleString()}
          change={stats.monthlyGrowth.offers}
          icon={<MessageSquare className="h-4 w-4" />}
          color="purple"
        />
        <StatCard
          title="Toplam Gelir"
          value={`₺${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          color="yellow"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
          <TabsTrigger value="quick-actions">Hızlı İşlemler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Listings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Bekleyen İlanlar</span>
                  <Badge variant="secondary">{stats.pendingListings}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Onay Bekleyen</span>
                    <span className="font-semibold">{stats.pendingListings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aktif İlanlar</span>
                    <span className="font-semibold text-green-600">{stats.activeListings}</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleQuickAction('moderate')}
                >
                  Moderasyon Paneli
                </Button>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Popüler Kategoriler</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topCategories.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{category.category}</span>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 10).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => handleQuickAction('moderate')}>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-2">İlan Moderasyonu</h3>
                <p className="text-sm text-gray-600">Bekleyen ilanları incele ve onayla</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleQuickAction('users')}>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-2">Kullanıcı Yönetimi</h3>
                <p className="text-sm text-gray-600">Kullanıcıları yönet ve rolleri düzenle</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleQuickAction('analytics')}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-2">Detaylı Analitik</h3>
                <p className="text-sm text-gray-600">Sistem performansını incele</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard; 