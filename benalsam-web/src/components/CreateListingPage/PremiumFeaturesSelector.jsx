import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Star, Eye, Info, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { checkUserPremiumStatus } from '@/services/premiumService';
import { useAuthStore } from '@/stores';

const premiumFeatures = [
  {
    id: 'is_featured',
    name: 'Öne Çıkar',
    icon: Star,
    price: '₺15',
    duration: '7 gün',
    description: 'İlanınız arama sonuçlarında en üstte görünür',
    benefits: ['Arama sonuçlarında öncelik', '3x daha fazla görüntülenme', 'Daha hızlı satış']
  },
  {
    id: 'is_urgent_premium',
    name: 'Acil İlan',
    icon: Zap,
    price: '₺10',
    duration: '3 gün',
    description: 'İlanınız "ACİL" etiketi ile öne çıkar',
    benefits: ['Kırmızı "ACİL" etiketi', 'Kategori sayfasında öncelik', 'Hızlı dikkat çekme']
  },
  {
    id: 'is_showcase',
    name: 'Vitrin',
    icon: Eye,
    price: '₺25',
    duration: '14 gün',
    description: 'Ana sayfada özel vitrin alanında gösterilir',
    benefits: ['Ana sayfa vitrini', 'Premium görsel tasarım', 'Maksimum görünürlük']
  }
];

const PremiumFeaturesSelector = ({ 
  selectedFeatures, 
  onFeatureChange, 
  disabled = false 
}) => {
  const { currentUser } = useAuthStore();
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (currentUser?.id) {
        setIsLoading(true);
        const premiumStatus = await checkUserPremiumStatus(currentUser.id);
        setIsPremiumUser(premiumStatus);
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [currentUser]);

  const handleFeatureToggle = (featureId, enabled) => {
    if (!isPremiumUser && enabled) {
      toast({
        title: "🌟 Premium Özellik",
        description: "Bu özellik sadece Premium üyeler için kullanılabilir. Premium'a geçerek tüm özelliklerin keyfini çıkarın!",
        duration: 6000
      });
      return;
    }

    onFeatureChange(featureId, enabled);
  };

  const calculateTotalCost = () => {
    return premiumFeatures.reduce((total, feature) => {
      if (selectedFeatures[feature.id]) {
        const price = parseInt(feature.price.replace('₺', ''));
        return total + price;
      }
      return total;
    }, 0);
  };

  const totalCost = calculateTotalCost();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Premium Özellikler
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Premium Özellikler
        </h3>
        {!isPremiumUser && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Premium Gerekli
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        {premiumFeatures.map((feature) => {
          const Icon = feature.icon;
          const isSelected = selectedFeatures[feature.id];
          const canUse = isPremiumUser || isSelected;

          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`relative transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${!canUse ? 'opacity-60' : ''}`}>
                {!isPremiumUser && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {feature.price}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {feature.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                      disabled={disabled || (!isPremiumUser && !isSelected)}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">
                    {feature.description}
                  </CardDescription>
                  
                  <div className="space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {totalCost > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Toplam Premium Maliyet</p>
              <p className="text-sm text-muted-foreground">Seçilen özellikler için</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">₺{totalCost}</p>
              <p className="text-xs text-muted-foreground">Tek seferlik</p>
            </div>
          </div>
        </motion.div>
      )}

      {!isPremiumUser && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Premium Üyelik Gerekli
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Bu özellikleri kullanabilmek için Premium üyeliğe sahip olmanız gerekiyor. 
                Premium ile sınırsız ilan, teklif ve mesaj hakkının yanı sıra bu özel özelliklere de erişim sağlayabilirsiniz.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
                onClick={() => {
                  toast({
                    title: "🚧 Premium Sistemi Yakında!",
                    description: "Premium üyelik sistemi geliştirme aşamasında. Çok yakında sizlerle! 🚀",
                    duration: 5000
                  });
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium'a Geç
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumFeaturesSelector;