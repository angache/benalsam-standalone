import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Crown, Star, Zap, Eye, MessageSquare, Camera, TrendingUp, FileText, Users, Shield, Sparkles, X } from 'lucide-react';
import { getPlanFeatures, getUserActivePlan, getUserMonthlyUsage, createSubscription } from '@/services/premiumService';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';

const PremiumModal = ({ isOpen, onOpenChange, feature, currentUsage }) => {
  const { currentUser } = useAuthStore();
  const [plans] = useState(getPlanFeatures());
  const [userPlan, setUserPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadUserData();
    }
  }, [isOpen, currentUser]);

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
    if (!currentUser) return;
    
    setUpgrading(planSlug);
    
    // Gerçek ödeme sistemi entegrasyonu burada olacak
    toast({ 
      title: "🚧 Ödeme Sistemi Yakında!", 
      description: "Premium üyelik sistemi geliştirme aşamasında. Çok yakında sizlerle! 🚀",
      duration: 5000
    });
    
    // Demo amaçlı - gerçekte ödeme sonrası çalışacak
    // const result = await createSubscription(currentUser.id, planSlug);
    // if (result) {
    //   onOpenChange(false);
    //   await loadUserData();
    // }
    
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Premium Planlar
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Daha fazla özellik ve sınırsız kullanım için Premium'a geçin
          </DialogDescription>
        </DialogHeader>

        {/* Mevcut kullanım bilgisi */}
        {usage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-muted/50 rounded-lg mb-6"
          >
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Bu Ay Kullanımınız
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Teklifler:</span>
                <span className="ml-2 font-semibold">{usage.offers_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mesajlar:</span>
                <span className="ml-2 font-semibold">{usage.messages_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Öne Çıkan:</span>
                <span className="ml-2 font-semibold">{usage.featured_offers_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plan:</span>
                <span className="ml-2 font-semibold">{userPlan?.plan_name || 'Temel Plan'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plan kartları */}
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
                            Planı Seç
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

        {/* Kampanya bilgisi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-blue-400">🎁 Özel Kampanyalar</h4>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• İlk ay %50 indirim</li>
            <li>• 3 ay premium al, 1 ay hediye</li>
            <li>• Yıllık üyelikte %20 indirim</li>
            <li>• İlk teklifin öne çıkarılması ücretsiz</li>
          </ul>
        </motion.div>

        {/* Kapatma butonu */}
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;