import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { 
  getUserActivePlan, 
  getUserMonthlyUsage, 
  checkUserPremiumStatus,
  getUserDashboardStats,
  getUserRecentActivities,
  getUserCategoryStats,
  calculatePerformanceMetrics,
  calculateTrend
} from '@/services/premiumService';
import DashboardHeader from './DashboardHeader';
import PlanInfoCard from './PlanInfoCard';
import DashboardTabs from './DashboardTabs';
import LoadingSpinner from './LoadingSpinner';
import NonPremiumView from './NonPremiumView';

const PremiumDashboard = () => {
  const { currentUser } = useAuthStore();
  const [userPlan, setUserPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  useEffect(() => {
    if (currentUser?.id && !isInitialized) {
      loadDashboardData();
    }
  }, [currentUser?.id, isInitialized]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        planData, 
        usageData, 
        premiumStatus, 
        dashboardStats, 
        recentActivities, 
        userCategoryStats
      ] = await Promise.all([
        getUserActivePlan(currentUser.id),
        getUserMonthlyUsage(currentUser.id),
        checkUserPremiumStatus(currentUser.id),
        getUserDashboardStats(currentUser.id),
        getUserRecentActivities(currentUser.id, 8),
        getUserCategoryStats(currentUser.id)
      ]);
      
      setUserPlan(planData);
      setUsage(usageData);
      setIsPremium(premiumStatus);
      setStats(dashboardStats);
      setActivities(recentActivities);
      setCategoryStats(userCategoryStats);
      
      // Performans metriklerini hesapla
      if (dashboardStats) {
        const metrics = calculatePerformanceMetrics(dashboardStats);
        setPerformanceMetrics(metrics);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Veri Yükleme Hatası",
        description: "Dashboard verileri yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isPremium) {
    return <NonPremiumView />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <DashboardHeader />
      <PlanInfoCard userPlan={userPlan} />
      <DashboardTabs 
        userPlan={userPlan}
        usage={usage}
        stats={stats}
        activities={activities}
        categoryStats={categoryStats}
        performanceMetrics={performanceMetrics}
      />
    </motion.div>
  );
};

export default memo(PremiumDashboard);