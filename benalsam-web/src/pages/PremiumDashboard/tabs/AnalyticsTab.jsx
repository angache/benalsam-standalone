import React from 'react';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const AnalyticsTab = ({ stats, categoryStats, performanceMetrics }) => {
  // Teklif performans verileri
  const offerPerformance = [
    {
      label: 'Gönderilen Teklifler',
      value: stats?.total_offers || 0,
      percentage: 100,
      color: 'bg-blue-500'
    },
    {
      label: 'Görüntülenen Teklifler',
      value: Math.round((stats?.total_offers || 0) * 0.85),
      percentage: 85,
      color: 'bg-purple-500'
    },
    {
      label: 'Yanıtlanan Teklifler',
      value: (stats?.accepted_offers || 0) + (stats?.rejected_offers || 0),
      percentage: performanceMetrics?.responseRate || 0,
      color: 'bg-orange-500'
    },
    {
      label: 'Kabul Edilen Teklifler',
      value: stats?.accepted_offers || 0,
      percentage: performanceMetrics?.successRate || 0,
      color: 'bg-green-500'
    }
  ];

  return (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 xl:gap-5 2xl:gap-4">
      {/* Teklif Performansı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Teklif Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {offerPerformance.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  %{item.percentage}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kategori Dağılımı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Kategori Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.length > 0 ? (
              categoryStats.slice(0, 6).map((item, index) => {
                const maxCount = Math.max(...categoryStats.map(cat => cat.offer_count));
                const percentage = maxCount > 0 ? (item.offer_count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <div className="text-right">
                        <span className="font-semibold">{item.offer_count} teklif</span>
                        <div className="text-xs text-muted-foreground">
                          %{item.success_percentage} başarı
                        </div>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz kategori verisi bulunmuyor</p>
                <p className="text-sm">Teklifler gönderdikçe veriler burada görünecek</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detaylı Metrikler */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Detaylı Performans Metrikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.total_offers || 0}</div>
              <div className="text-sm text-muted-foreground">Toplam Teklif</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">%{performanceMetrics?.successRate || 0}</div>
              <div className="text-sm text-muted-foreground">Başarı Oranı</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics?.viewsPerOffer || 0}</div>
              <div className="text-sm text-muted-foreground">Ort. Görüntülenme</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats?.avg_response_time_hours || 0}h</div>
              <div className="text-sm text-muted-foreground">Ort. Yanıt Süresi</div>
            </div>
          </div>
          
          {/* Ek İstatistikler */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 xl:gap-3 2xl:gap-2">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <div className="font-semibold">{stats?.pending_offers || 0}</div>
                <div className="text-sm text-muted-foreground">Bekleyen Teklif</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Target className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-semibold">{stats?.accepted_offers || 0}</div>
                <div className="text-sm text-muted-foreground">Kabul Edilen</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <div>
                <div className="font-semibold">{stats?.rejected_offers || 0}</div>
                <div className="text-sm text-muted-foreground">Reddedilen</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;