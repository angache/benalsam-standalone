import React from 'react';
import { Crown, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PlanInfoCard = ({ userPlan }) => {
  if (!userPlan) return null;

  const isPremiumUser = userPlan.plan_slug !== 'basic';

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPremiumUser ? (
              <Crown className="w-5 h-5 text-yellow-500" />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="font-semibold">{userPlan.plan_name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {userPlan.limits?.offers_per_month === -1 
              ? 'Sınırsız teklif' 
              : `${userPlan.limits?.offers_per_month || 10} teklif/ay`
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanInfoCard;