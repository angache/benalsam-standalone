import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, Star, Zap, Eye, MessageSquare, Camera, FileText, Users, Award, Calendar, BarChart3, Target, Sparkles, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { 
  getUserActivePlan, 
  getUserMonthlyUsage, 
  checkUserPremiumStatus 
} from '@/services/premiumService';

const PremiumDashboard = () => {
  const { currentUser } = useAuthStore();
  const [userPlan, setUserPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState({
    totalOffers: 0,
    acceptedOffers: 0,
    totalViews: 0,
    responseRate: 0,
    avgResponseTime: 0,
    successRate: 0
  });

  useEffect(() => {
    if (currentUser?.id && !isInitialized) {
      loadDashboardData();
    }
  }, [currentUser?.id, isInitialized]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [planData, usageData, premiumStatus] = await Promise.all([
        getUserActivePlan(currentUser.id),
        getUserMonthlyUsage(currentUser.id),
        checkUserPremiumStatus(currentUser.id)
      ]);
      
      setUserPlan(planData);
      setUsage(usageData);
      setIsPremium(premiumStatus);
      setIsInitialized(true);
      
      // Mock istatistik verileri - gerçek uygulamada API'den gelecek
      setStats({
        totalOffers: 45,
        acceptedOffers: 12,
        totalViews: 1250,
        responseRate: 85,
        avgResponseTime: 2.5,
        successRate: 26.7
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Veri Yükleme Hatası",
        description: "Dashboard verileri yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Sınırsız
    return Math.min((current / limit) * 100, 100);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendValue, color = "text-primary" }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full bg-primary/10 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            {trend === 'up' ? (
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {trendValue}%
            </span>
            <span className="text-muted-foreground ml-1">geçen aya göre</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const UsageCard = ({ title, current, limit, icon: Icon, color = "bg-primary" }) => {
    const percentage = getUsagePercentage(current, limit);
    const isUnlimited = limit === -1;
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}/10`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  {current} / {isUnlimited ? '∞' : limit}
                </p>
              </div>
            </div>
            {isUnlimited && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                Sınırsız
              </Badge>
            )}
          </div>
          {!isUnlimited && (
            <div className="space-y-2">
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                %{percentage.toFixed(1)} kullanıldı
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="text-center py-12">
          <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Premium Dashboard</h2>
          <p className="text-muted-foreground mb-6">
            Bu özellik sadece Premium üyeler için kullanılabilir.
          </p>
          <Button 
            onClick={() => window.location.href = '/ayarlar/premium'}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            Premium'a Geç
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Başlık */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Premium Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground">
          Premium özelliklerinizi ve performansınızı takip edin
        </p>
      </div>

      {/* Plan Bilgisi */}
      <Card className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{userPlan?.plan_name || 'Premium Plan'}</h3>
                <p className="text-sm text-muted-foreground">
                  Aktif üyelik • Sonraki ödeme: 15 Şubat 2024
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1">
              Aktif
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="usage">Kullanım</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="features">Özellikler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Ana İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Zap}
              title="Toplam Teklif"
              value={stats.totalOffers}
              subtitle="Bu ay"
              trend="up"
              trendValue="12"
              color="text-blue-500"
            />
            <StatCard
              icon={Target}
              title="Kabul Edilen"
              value={stats.acceptedOffers}
              subtitle={`%${stats.successRate} başarı oranı`}
              trend="up"
              trendValue="8"
              color="text-green-500"
            />
            <StatCard
              icon={Eye}
              title="Toplam Görüntülenme"
              value={stats.totalViews.toLocaleString()}
              subtitle="Tüm teklifler"
              trend="up"
              trendValue="15"
              color="text-purple-500"
            />
            <StatCard
              icon={MessageSquare}
              title="Yanıt Oranı"
              value={`%${stats.responseRate}`}
              subtitle={`Ort. ${stats.avgResponseTime}h yanıt süresi`}
              trend="up"
              trendValue="5"
              color="text-orange-500"
            />
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
                {[
                  { action: 'Yeni teklif gönderildi', item: 'iPhone 14 Pro', time: '2 saat önce', type: 'offer' },
                  { action: 'Teklif kabul edildi', item: 'MacBook Air M2', time: '5 saat önce', type: 'success' },
                  { action: 'Mesaj alındı', item: 'Samsung Galaxy S23', time: '1 gün önce', type: 'message' },
                  { action: 'Teklif öne çıkarıldı', item: 'iPad Pro 11"', time: '2 gün önce', type: 'featured' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-100 text-green-600' :
                      activity.type === 'featured' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'message' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'success' && <Target className="w-4 h-4" />}
                      {activity.type === 'featured' && <Star className="w-4 h-4" />}
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4" />}
                      {activity.type === 'offer' && <Zap className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.item}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UsageCard
              title="Aylık Teklifler"
              current={usage?.offers_count || 0}
              limit={userPlan?.limits?.offers_per_month || 10}
              icon={Zap}
              color="bg-blue-500"
            />
            <UsageCard
              title="Aylık Mesajlar"
              current={usage?.messages_count || 0}
              limit={userPlan?.limits?.messages_per_month || 50}
              icon={MessageSquare}
              color="bg-green-500"
            />
            <UsageCard
              title="Öne Çıkan Teklifler"
              current={usage?.featured_offers_count || 0}
              limit={(userPlan?.limits?.featured_offers_per_day || 0) * 30}
              icon={Star}
              color="bg-yellow-500"
            />
            <UsageCard
              title="Resim Ekleme"
              current={userPlan?.limits?.images_per_offer || 2}
              limit={userPlan?.limits?.images_per_offer || 2}
              icon={Camera}
              color="bg-purple-500"
            />
            <UsageCard
              title="Dosya Ekleme"
              current={userPlan?.limits?.files_per_offer || 0}
              limit={userPlan?.limits?.files_per_offer || 0}
              icon={FileText}
              color="bg-orange-500"
            />
            <UsageCard
              title="Aylık İlanlar"
              current={usage?.listings_count || 0}
              limit={userPlan?.limits?.listings_per_month || 3}
              icon={Award}
              color="bg-red-500"
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teklif Performansı */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Teklif Performansı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gönderilen Teklifler</span>
                    <span className="font-semibold">{stats.totalOffers}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Görüntülenen Teklifler</span>
                    <span className="font-semibold">{Math.round(stats.totalOffers * 0.8)}</span>
                  </div>
                  <Progress value={80} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Yanıtlanan Teklifler</span>
                    <span className="font-semibold">{Math.round(stats.totalOffers * 0.4)}</span>
                  </div>
                  <Progress value={40} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kabul Edilen Teklifler</span>
                    <span className="font-semibold">{stats.acceptedOffers}</span>
                  </div>
                  <Progress value={stats.successRate} className="h-2" />
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
                  {[
                    { category: 'Elektronik', count: 18, percentage: 40 },
                    { category: 'Ev & Yaşam', count: 12, percentage: 27 },
                    { category: 'Moda', count: 8, percentage: 18 },
                    { category: 'Spor', count: 4, percentage: 9 },
                    { category: 'Diğer', count: 3, percentage: 6 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="font-semibold">{item.count} teklif</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Star,
                title: 'Öne Çıkarma',
                description: 'Tekliflerinizi öne çıkararak daha fazla görünürlük kazanın',
                status: 'active',
                usage: `${usage?.featured_offers_count || 0}/${(userPlan?.limits?.featured_offers_per_day || 0) * 30}`
              },
              {
                icon: Sparkles,
                title: 'AI Teklif Önerileri',
                description: 'Yapay zeka ile optimize edilmiş teklif önerileri alın',
                status: userPlan?.plan_slug === 'corporate' ? 'active' : 'locked',
                usage: 'Sınırsız'
              },
              {
                icon: FileText,
                title: 'Dosya Ekleme',
                description: 'Tekliflerinize dosya ve döküman ekleyin',
                status: userPlan?.limits?.files_per_offer > 0 ? 'active' : 'locked',
                usage: `${userPlan?.limits?.files_per_offer || 0} dosya`
              },
              {
                icon: Users,
                title: 'Kurumsal Rozet',
                description: 'Güvenilir tedarikçi rozeti ile öne çıkın',
                status: userPlan?.plan_slug === 'corporate' ? 'active' : 'locked',
                usage: 'Aktif'
              },
              {
                icon: BarChart3,
                title: 'Detaylı Raporlar',
                description: 'Gelişmiş analitik ve performans raporları',
                status: userPlan?.plan_slug === 'corporate' ? 'active' : 'locked',
                usage: 'Haftalık'
              },
              {
                icon: MessageSquare,
                title: 'Öncelikli Destek',
                description: 'Premium müşteri desteği ve canlı yardım',
                status: 'active',
                usage: '7/24'
              }
            ].map((feature, index) => (
              <Card key={index} className={`${
                feature.status === 'locked' ? 'opacity-60' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      feature.status === 'active' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                          {feature.status === 'active' ? 'Aktif' : 'Kilitli'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {feature.description}
                      </p>
                      <p className="text-xs font-medium">
                        Kullanım: {feature.usage}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default memo(PremiumDashboard);