import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Eye, MessageSquare, Camera, TrendingUp, FileText, Users, Shield, Sparkles, Check, X, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { 
  getUserActivePlan, 
  getUserMonthlyUsage, 
  getPlanFeatures, 
  createSubscription 
} from '@/services/premiumService';

const PremiumSettings = () => {
  const { currentUser } = useAuthStore();
  const [userPlan, setUserPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [plans] = useState(getPlanFeatures());
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [planData, usageData] = await Promise.all([
        getUserActivePlan(currentUser.id),
        getUserMonthlyUsage(currentUser.id)
      ]);
      setUserPlan(planData);
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planSlug) => {
    setUpgrading(planSlug);
    
    // Gerçek ödeme sistemi entegrasyonu burada olacak
    toast({ 
      title: "🚧 Ödeme Sistemi Yakında!", 
      description: "Premium üyelik sistemi geliştirme aşamasında. Çok yakında sizlerle! 🚀",
      duration: 5000
    });
    
    setUpgrading(null);
  };

  const getFeatureIcon = (featureName) => {
    if (featureName.includes('teklif')) return <Zap className="w-4 h-4" />;
    if (featureName.includes('resim') || featureName.includes('fotoğraf')) return <Camera className="w-4 h-4" />;
    if (featureName.includes('mesaj')) return <MessageSquare className="w-4 h-4" />;
    if (featureName.includes('öne çıkar')) return <Star className="w-4 h-4" />;
    if (featureName.includes('vitrin') || featureName.includes('görüntüleme')) return <Eye className="w-4 h-4" />;
    if (featureName.includes('dosya')) return <FileText className="w-4 h-4" />;
    if (featureName.includes('AI') || featureName.includes('Yapay')) return <Sparkles className="w-4 h-4" />;
    if (featureName.includes('destek')) return <Shield className="w-4 h-4" />;
    if (featureName.includes('kurumsal') || featureName.includes('rozet')) return <Users className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  const getCurrentPlanSlug = () => {
    return userPlan?.plan_slug || 'basic';
  };

  const isCurrentPlan = (planSlug) => {
    return getCurrentPlanSlug() === planSlug;
  };

  const canUpgrade = (planSlug) => {
    const currentSlug = getCurrentPlanSlug();
    const planOrder = ['basic', 'advanced', 'corporate'];
    return planOrder.indexOf(planSlug) > planOrder.indexOf(currentSlug);
  };

  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Sınırsız
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          Premium Üyelik
        </h2>
        <p className="text-muted-foreground">
          Daha fazla özellik ve sınırsız kullanım için Premium'a geçin
        </p>
      </div>

      {/* Mevcut plan ve kullanım */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mevcut Plan */}
        <Card className={`${
          getCurrentPlanSlug() !== 'basic' 
            ? 'border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10' 
            : ''
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCurrentPlanSlug() === 'corporate' && <Crown className="w-5 h-5 text-yellow-400" />}
              {getCurrentPlanSlug() === 'advanced' && <Star className="w-5 h-5 text-blue-400" />}
              {getCurrentPlanSlug() === 'basic' && <Shield className="w-5 h-5 text-gray-400" />}
              Mevcut Planınız
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{userPlan?.plan_name || 'Temel Plan'}</h3>
                <p className="text-sm text-muted-foreground">
                  {getCurrentPlanSlug() === 'basic' ? 'Ücretsiz' : `₺${plans[getCurrentPlanSlug()]?.price}/ay`}
                </p>
              </div>
              
              {getCurrentPlanSlug() !== 'basic' && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Sonraki ödeme: 15 Şubat 2024</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>
                  {getCurrentPlanSlug() === 'basic' 
                    ? 'Ödeme yöntemi yok' 
                    : 'Visa ****1234'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanım İstatistikleri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Bu Ay Kullanımınız
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usage && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Teklifler</span>
                    <span>
                      {usage.offers_count || 0} / {
                        userPlan?.limits?.offers_per_month === -1 
                          ? '∞' 
                          : userPlan?.limits?.offers_per_month || 10
                      }
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(
                      usage.offers_count || 0, 
                      userPlan?.limits?.offers_per_month || 10
                    )} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mesajlar</span>
                    <span>
                      {usage.messages_count || 0} / {
                        userPlan?.limits?.messages_per_month === -1 
                          ? '∞' 
                          : userPlan?.limits?.messages_per_month || 50
                      }
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(
                      usage.messages_count || 0, 
                      userPlan?.limits?.messages_per_month || 50
                    )} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Öne Çıkan Teklifler</span>
                    <span>
                      {usage.featured_offers_count || 0} / {
                        userPlan?.limits?.featured_offers_per_day === -1 
                          ? '∞' 
                          : (userPlan?.limits?.featured_offers_per_day || 0) * 30
                      }
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(
                      usage.featured_offers_count || 0, 
                      (userPlan?.limits?.featured_offers_per_day || 0) * 30
                    )} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Karşılaştırması */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-center">Planları Karşılaştırın</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([planSlug, plan], index) => (
            <motion.div
              key={planSlug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${
                plan.popular 
                  ? 'border-2 border-primary shadow-lg' 
                  : isCurrentPlan(planSlug)
                  ? 'border-2 border-green-500'
                  : 'border border-border'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Önerilen
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan(planSlug) && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      Mevcut Plan
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                      {planSlug === 'corporate' && <Crown className="w-5 h-5 text-yellow-400" />}
                      {planSlug === 'advanced' && <Star className="w-5 h-5 text-blue-400" />}
                      {planSlug === 'basic' && <Shield className="w-5 h-5 text-gray-400" />}
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <span className="text-2xl font-bold text-green-500">Ücretsiz</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">₺{plan.price}</span>
                          <span className="text-muted-foreground">/{plan.period}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <div className="mt-0.5">
                          {getFeatureIcon(feature)}
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isCurrentPlan(planSlug) ? (
                      <Button disabled className="w-full" variant="outline">
                        <Check className="w-4 h-4 mr-2" />
                        Mevcut Planınız
                      </Button>
                    ) : canUpgrade(planSlug) ? (
                      <Button 
                        onClick={() => handleUpgrade(planSlug)}
                        disabled={upgrading === planSlug}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        {upgrading === planSlug ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Yükseltiliyor...
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Yükselt
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button disabled className="w-full" variant="outline">
                        Mevcut Planınızdan Düşük
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Kampanya Bilgisi */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-blue-400">🎁 Özel Kampanyalar</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li>• İlk ay %50 indirim</li>
              <li>• 3 ay premium al, 1 ay hediye</li>
            </ul>
            <ul className="space-y-2">
              <li>• Yıllık üyelikte %20 indirim</li>
              <li>• İlk teklifin öne çıkarılması ücretsiz</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumSettings;