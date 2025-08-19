import React, { useEffect, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster.jsx';
import { toast } from '@/components/ui/use-toast.js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button.jsx';
import { ThemeContext } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { useAuthStore } from '@/stores';
import AppRoutes from '@/components/AppRoutes.jsx';
import AppErrorBoundary from '@/components/ErrorBoundaries/AppErrorBoundary';
import { usePreload } from '@/hooks/usePreload.js';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor.js';
import useRoutePerformance from '@/hooks/useRoutePerformance.js';
import usePerformance from '@/hooks/usePerformance.js';
import ImageOptimizationDebug from '@/components/ImageOptimizationDebug';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils.js';

function App() {
  
  // 🚀 Hot reload test - bu yorum değişikliği otomatik yansımalı
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isConversationPage = location.pathname.startsWith('/mesajlar/');
  
  const { currentUser, loading: loadingAuth, initialize } = useAuthStore();
  
  // Auth store automatically initializes on mount
  // No need to call initialize() manually

  // Stabilize currentUser to prevent unnecessary re-renders
  const stableCurrentUser = useMemo(() => currentUser, [currentUser?.id]);
  
  // Code splitting preload strategy
  usePreload(stableCurrentUser);
  
  // Performance monitoring (only initialize once)
  usePerformanceMonitor();
  
  // Route-based performance tracking
  useRoutePerformance();
  
  // Core Web Vitals and performance monitoring
  usePerformance();

  useEffect(() => {
    console.log('🔐 Auth Store State:', { currentUser: !!currentUser, loadingAuth });
  }, [currentUser, loadingAuth]);
  

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (loadingAuth) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <UserPreferencesProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <div className="pattern-dots fixed inset-0 opacity-20 pointer-events-none -z-10"></div>
          
          {!isConversationPage && (
            <Header 
              onCreateClick={() => navigate('/ilan-olustur')}
              currentUser={stableCurrentUser}
              onLogout={() => useAuthStore.getState().signOut()}
              onLoginClick={() => navigate('/auth?action=login')}
              onRegisterClick={() => navigate('/auth?action=register')}
            />
          )}

          <main className={cn(
            "relative z-10 flex-grow flex flex-col",
            !isConversationPage && "pt-16 sm:pt-20"
          )}>
            <AnimatePresence mode="wait">
              <AppRoutes currentUser={stableCurrentUser} />
            </AnimatePresence>
          </main>

          {!isConversationPage && <Footer />}
          <Toaster />
          <ImageOptimizationDebug />
          {/* Performance Monitor - Only in development */}
          {import.meta.env.DEV && <PerformanceMonitor showDetails={true} />}
        </div>
      </UserPreferencesProvider>
    </AppErrorBoundary>
  );
}

export default App;// Test değişikliği Sun Aug 10 10:52:36 +03 2025
// Hot reload test Sun Aug 10 10:57:49 +03 2025
