import React from 'react';
import { Zap, MessageSquare, Star, Camera, FileText, Award } from 'lucide-react';
import UsageCard from '../components/UsageCard';

const UsageTab = ({ userPlan, usage }) => {
  return (
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
  );
};

export default UsageTab;