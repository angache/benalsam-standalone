import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import '@/index.css';
import 'leaflet/dist/leaflet.css';
import 'cropperjs/dist/cropper.css';
import { useAuthStore } from '@/stores';
import { queryClient } from '@/lib/queryClient';
import { initPerformanceTracking } from '@/utils/performance';

function AuthGate({ children }) {
  const { loading, initialized } = useAuthStore();
  
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return children;
}

// Initialize performance tracking
initPerformanceTracking();

// Prefetch critical data
const prefetchCriticalData = async () => {
  try {
    // Prefetch categories and other critical data
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => fetch('/api/categories').then(res => res.json()),
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  } catch (error) {
    console.log('Critical data prefetch failed:', error);
  }
};

// Start prefetching in background
prefetchCriticalData();

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthGate>
          <App />
        </AuthGate>
      </Router>
    </ThemeProvider>
  </QueryClientProvider>
);