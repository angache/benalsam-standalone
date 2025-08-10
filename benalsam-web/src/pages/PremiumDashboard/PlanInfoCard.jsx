import React from 'react';
import { Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PlanInfoCard = ({ userPlan }) => {
  return (
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
  );
};

export default PlanInfoCard;