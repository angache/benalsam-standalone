import React from 'react';
import { Zap, Target, Eye, MessageSquare, Activity, Star, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '../components/StatCard';
import { calculateTrend } from '@/services/premiumService';

const OverviewTab = ({ stats, activities, performanceMetrics }) => {
  // Trend hesaplamaları (geçen ay verileri simüle edildi)
  const trends = {
    offers: calculateTrend(stats?.total_offers || 0, Math.max(0, (stats?.total_offers || 0) - 5)),
    accepted: calculateTrend(stats?.accepted_offers || 0, Math.max(0, (stats?.accepted_offers || 0) - 2)),
    views: calculateTrend(stats?.total_views || 0, Math.max(0, (stats?.total_views || 0) - 150)),
    response: calculateTrend(performanceMetrics?.responseRate || 0, Math.max(0, (performanceMetrics?.responseRate || 0) - 5))
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'offer_accepted': return Target;
      case 'offer_featured': return Star;
      case 'message_sent': 
      case 'message_received': return MessageSquare;
      default: return Zap;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'offer_accepted': return 'bg-green-100 text-green-600';
      case 'offer_featured': return 'bg-yellow-100 text-yellow-600';
      case 'message_sent':
      case 'message_received': return 'bg-blue-100 text-blue-600';
      case 'offer_rejected': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Zap}
          title="Toplam Teklif"
          value={stats?.total_offers || 0}
          subtitle="Bu ay gönderilen"
          trend={trends.offers.trend}
          trendValue={trends.offers.value}
          color="text-blue-500"
        />
        <StatCard
          icon={Target}
          title="Kabul Edilen"
          value={stats?.accepted_offers || 0}
          subtitle={`%${performanceMetrics?.successRate || 0} başarı oranı`}
          trend={trends.accepted.trend}
          trendValue={trends.accepted.value}
          color="text-green-500"
        />
        <StatCard
          icon={Eye}
          title="Toplam Görüntülenme"
          value={(stats?.total_views || 0).toLocaleString()}
          subtitle="Tüm teklifler"
          trend={trends.views.trend}
          trendValue={trends.views.value}
          color="text-purple-500"
        />
        <StatCard
          icon={MessageSquare}
          title="Yanıt Oranı"
          value={`%${performanceMetrics?.responseRate || 0}`}
          subtitle={`Ort. ${stats?.avg_response_time_hours || 0}h yanıt süresi`}
          trend={trends.response.trend}
          trendValue={trends.response.value}
          color="text-orange-500"
        />
      </div>

      {/* Ek Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-indigo-100">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ortalama Görüntülenme</p>
                <p className="text-2xl font-bold">{performanceMetrics?.viewsPerOffer || 0}</p>
                <p className="text-xs text-muted-foreground">teklif başına</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-pink-100">
                <Clock className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ortalama Yanıt Süresi</p>
                <p className="text-2xl font-bold">{stats?.avg_response_time_hours || 0}h</p>
                <p className="text-xs text-muted-foreground">mesajlara yanıt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-emerald-100">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Mesaj</p>
                <p className="text-2xl font-bold">{(stats?.total_messages_sent || 0) + (stats?.total_messages_received || 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.total_messages_sent || 0} gönderilen, {stats?.total_messages_received || 0} alınan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Son Aktiviteler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.activity_type);
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.activity_title}</p>
                      {activity.activity_description && (
                        <p className="text-xs text-muted-foreground">{activity.activity_description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time_ago}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz aktivite bulunmuyor</p>
                <p className="text-sm">İlk teklifinizi göndererek başlayın!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default OverviewTab;