import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const UsageCard = ({ title, current, limit, icon: Icon, color = "bg-primary" }) => {
  const getUsagePercentage = (current, limit) => {
    if (limit === -1) return 0; // Sınırsız
    return Math.min((current / limit) * 100, 100);
  };

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

export default UsageCard;