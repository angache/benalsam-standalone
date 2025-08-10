import React from 'react';
import { Star, Sparkles, FileText, Users, BarChart3, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FeaturesTab = ({ userPlan, usage }) => {
  const features = [
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
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
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
  );
};

export default FeaturesTab;