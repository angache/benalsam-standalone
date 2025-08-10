import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './tabs/OverviewTab';
import UsageTab from './tabs/UsageTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import FeaturesTab from './tabs/FeaturesTab';

const DashboardTabs = ({ userPlan, usage, stats, activities, categoryStats, performanceMetrics }) => {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
        <TabsTrigger value="usage">Kullanım</TabsTrigger>
        <TabsTrigger value="analytics">Analitik</TabsTrigger>
        <TabsTrigger value="features">Özellikler</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab 
          stats={stats} 
          activities={activities} 
          performanceMetrics={performanceMetrics} 
        />
      </TabsContent>

      <TabsContent value="usage" className="space-y-6">
        <UsageTab userPlan={userPlan} usage={usage} />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsTab 
          stats={stats} 
          categoryStats={categoryStats} 
          performanceMetrics={performanceMetrics} 
        />
      </TabsContent>

      <TabsContent value="features" className="space-y-6">
        <FeaturesTab userPlan={userPlan} usage={usage} />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;