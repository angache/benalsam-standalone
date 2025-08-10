import React, { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
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
  };

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
      className="container mx-auto px-4 py-8"
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

export default PremiumDashboard;