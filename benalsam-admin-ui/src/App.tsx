import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { CategoryAttributesPage } from './pages/CategoryAttributesPage';
import { CategoryEditPage } from './pages/CategoryEditPage';
import { UsersPage } from './pages/UsersPage';
import AdminManagementPage from './pages/AdminManagementPage';
import ElasticsearchDashboardPage from './pages/ElasticsearchDashboardPage';
import RealTimeAnalyticsPage from './pages/RealTimeAnalyticsPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import DataExportPage from './pages/DataExportPage';
import PerformanceTestPage from './pages/PerformanceTestPage';
import UserJourneyPage from './pages/UserJourneyPage';
import AlertSystemPage from './pages/AlertSystemPage';
import SessionAnalyticsPage from './pages/SessionAnalyticsPage';
import SessionJourneyPage from './pages/SessionJourneyPage';
import CacheDashboardPage from './pages/CacheDashboardPage';
import SentryDashboardPage from './pages/SentryDashboardPage';
import HybridMonitoringPage from './pages/HybridMonitoringPage';
import HealthCheckPage from './pages/HealthCheckPage';
import SecurityDashboardPage from './pages/SecurityDashboardPage';
import PerformanceBaselinePage from './pages/PerformanceBaselinePage';
import { useAuthStore } from './stores/authStore';
import { CustomThemeProvider } from './contexts/ThemeContext';

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
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ListingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ListingDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoriesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:path"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoryDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:path/attributes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoryAttributesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:path/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoryEditPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UsersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/elasticsearch"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ElasticsearchDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/real-time-analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RealTimeAnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RealTimeAnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnalyticsDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-export"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataExportPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance-test"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PerformanceTestPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-journey"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserJourneyPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AlertSystemPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/session-analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SessionAnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/session-journey/:sessionId?"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SessionJourneyPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cache-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CacheDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sentry-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SentryDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
                <Route
      path="/hybrid-monitoring"
      element={
        <ProtectedRoute>
          <Layout>
            <HybridMonitoringPage />
          </Layout>
        </ProtectedRoute>
      }
    />
        <Route
      path="/health-check"
      element={
        <ProtectedRoute>
          <Layout>
            <HealthCheckPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/security-dashboard"
      element={
        <ProtectedRoute>
          <Layout>
            <SecurityDashboardPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-baseline"
      element={
        <ProtectedRoute>
          <Layout>
            <PerformanceBaselinePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CustomThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
// Test değişikliği Sun Aug 10 10:52:23 +03 2025
// Hot reload test Sun Aug 10 10:53:18 +03 2025
// Hot reload test Sun Aug 10 10:57:31 +03 2025
