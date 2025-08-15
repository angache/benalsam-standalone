import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { useAuthStore } from './stores/authStore';
import { CustomThemeProvider } from './contexts/ThemeContext';
import PerformanceMonitor from './components/PerformanceMonitor';

// Lazy loaded components
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const ListingsPage = lazy(() => import('./pages/ListingsPage').then(module => ({ default: module.ListingsPage })));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage').then(module => ({ default: module.ListingDetailPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(module => ({ default: module.CategoriesPage })));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage').then(module => ({ default: module.CategoryDetailPage })));
const CategoryAttributesPage = lazy(() => import('./pages/CategoryAttributesPage').then(module => ({ default: module.CategoryAttributesPage })));
const CategoryEditPage = lazy(() => import('./pages/CategoryEditPage').then(module => ({ default: module.CategoryEditPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(module => ({ default: module.UsersPage })));
const AdminManagementPage = lazy(() => import('./pages/AdminManagementPage'));
const ElasticsearchDashboardPage = lazy(() => import('./pages/ElasticsearchDashboardPage'));
const RealTimeAnalyticsPage = lazy(() => import('./pages/RealTimeAnalyticsPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'));
const DataExportPage = lazy(() => import('./pages/DataExportPage'));
const PerformanceTestPage = lazy(() => import('./pages/PerformanceTestPage'));
const UserJourneyPage = lazy(() => import('./pages/UserJourneyPage'));
const AlertSystemPage = lazy(() => import('./pages/AlertSystemPage'));
const SessionAnalyticsPage = lazy(() => import('./pages/SessionAnalyticsPage'));
const SessionJourneyPage = lazy(() => import('./pages/SessionJourneyPage'));
const CacheDashboardPage = lazy(() => import('./pages/CacheDashboardPage'));
const SentryDashboardPage = lazy(() => import('./pages/SentryDashboardPage'));
const HybridMonitoringPage = lazy(() => import('./pages/HybridMonitoringPage'));
const HealthCheckPage = lazy(() => import('./pages/HealthCheckPage'));
const SecurityDashboardPage = lazy(() => import('./pages/SecurityDashboardPage'));
const PerformanceBaselinePage = lazy(() => import('./pages/PerformanceBaselinePage'));
const BackupDashboardPage = lazy(() => import('./pages/BackupDashboardPage'));
const SchedulingDashboardPage = lazy(() => import('./pages/SchedulingDashboardPage'));
const ProgressDashboardPage = lazy(() => import('./pages/ProgressDashboardPage'));
const TwoFactorSetupPage = lazy(() => import('./pages/TwoFactorSetupPage'));
const TwoFactorVerifyPage = lazy(() => import('./pages/TwoFactorVerifyPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Loading component for Suspense fallback
const PageLoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '4px solid #f3f3f3', 
      borderTop: '4px solid #1976d2', 
      borderRadius: '50%', 
      animation: 'spin 1s linear infinite' 
    }} />
    <div style={{ color: '#666', fontSize: '14px' }}>Sayfa yükleniyor...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  // 🚀 Hot reload test - bu yorum değişikliği otomatik yansımalı
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <Router basename={import.meta.env.DEV ? undefined : '/admin'}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <DashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <ListingsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <ListingDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <CategoriesPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:path"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <CategoryDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:path/attributes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <CategoryAttributesPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:path/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <CategoryEditPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <UsersPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <AdminManagementPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/elasticsearch"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <ElasticsearchDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/real-time-analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <RealTimeAnalyticsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <RealTimeAnalyticsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <AnalyticsDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-export"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <DataExportPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance-test"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PerformanceTestPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-journey"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <UserJourneyPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <AlertSystemPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/session-analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SessionAnalyticsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/session-journey/:sessionId?"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SessionJourneyPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cache-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <CacheDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sentry-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SentryDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hybrid-monitoring"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <HybridMonitoringPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/health-check"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <HealthCheckPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SecurityDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance-baseline"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PerformanceBaselinePage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backup-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <BackupDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduling-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <SchedulingDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <ProgressDashboardPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/2fa-setup"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <TwoFactorSetupPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/2fa-verify"
              element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <TwoFactorVerifyPage />
                </Suspense>
              }
            />
                <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <PerformanceMonitor showDetails={import.meta.env.DEV} />
        </Router>
      </CustomThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
// Test değişikliği Sun Aug 10 10:52:23 +03 2025
// Hot reload test Sun Aug 10 10:53:18 +03 2025
// Hot reload test Sun Aug 10 10:57:31 +03 2025
