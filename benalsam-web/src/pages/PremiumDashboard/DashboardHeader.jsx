import React from 'react';
import { Crown } from 'lucide-react';

const DashboardHeader = () => {
  return (
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
  );
};

export default DashboardHeader;