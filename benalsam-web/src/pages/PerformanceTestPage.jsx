import React, { useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '@/utils/performance';

const PerformanceTestPage = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const performanceData = usePerformanceMonitoring();

  useEffect(() => {
    // Simulate different loading scenarios
    const simulateLoading = async () => {
      setIsLoading(true);
      
      // Simulate LCP delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate CLS by changing layout
      const testElement = document.getElementById('test-content');
      if (testElement) {
        testElement.style.height = '400px';
        testElement.style.backgroundColor = '#f0f0f0';
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoading(false);
    };

    simulateLoading();
  }, []);

  const triggerUserInteraction = () => {
    // Simulate INP by user interaction
    const button = document.getElementById('test-button');
    if (button) {
      // Daha belirgin animasyon
      button.style.transform = 'scale(1.2)';
      button.style.backgroundColor = '#ff6b35';
      button.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = '';
      }, 300);
      
      console.log('👆 User interaction simulated for INP measurement');
    }
  };

  const simulateLayoutShift = () => {
    const content = document.getElementById('test-content');
    if (content) {
      // Daha belirgin layout shift
      const currentHeight = content.style.height;
      const newHeight = currentHeight === '600px' ? '200px' : '600px';
      content.style.height = newHeight;
      
      // Renk değişikliği
      const currentColor = content.style.backgroundColor;
      const newColor = currentColor === 'rgb(255, 0, 0)' ? '#ffffff' : '#ff0000';
      content.style.backgroundColor = newColor;
      
      // Padding değişikliği
      content.style.padding = currentHeight === '600px' ? '1rem' : '3rem';
      
      console.log('🎨 Layout shift simulated:', { height: newHeight, color: newColor });
      
      // Manuel CLS tetikleme - performance tracking'e bildir
      if (window.performance && window.performance.mark) {
        window.performance.mark('layout-shift-simulated');
        console.log('📊 Manual CLS trigger sent to performance tracking');
      }
      
      // Global CLS değişkenini güncelle (test amaçlı)
      if (window.simulatedCLS === undefined) {
        window.simulatedCLS = 0;
      }
      window.simulatedCLS += 0.1;
      console.log('📊 Simulated CLS value:', window.simulatedCLS);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
              <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6">
        <h1 className="text-3xl font-bold mb-8">Performance Metrics Test Page</h1>
        
        {/* Performance Data Display */}
        <div className="bg-card p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded">
              <div className="text-sm text-muted-foreground">LCP</div>
              <div className="text-2xl font-bold">
                {performanceData.metrics.LCP > 0 ? `${performanceData.metrics.LCP}ms` : 'Loading...'}
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <div className="text-sm text-muted-foreground">FCP</div>
              <div className="text-2xl font-bold">
                {performanceData.metrics.FCP > 0 ? `${performanceData.metrics.FCP}ms` : 'Loading...'}
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <div className="text-sm text-muted-foreground">CLS</div>
              <div className="text-2xl font-bold">
                {performanceData.metrics.CLS > 0 ? performanceData.metrics.CLS.toFixed(3) : 'Loading...'}
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <div className="text-sm text-muted-foreground">INP</div>
              <div className="text-2xl font-bold">
                {performanceData.metrics.INP > 0 ? `${performanceData.metrics.INP}ms` : 'Loading...'}
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <div className="text-sm text-muted-foreground">TTFB</div>
              <div className="text-2xl font-bold">
                {performanceData.metrics.TTFB > 0 ? `${performanceData.metrics.TTFB}ms` : 'Loading...'}
              </div>
            </div>
            <div className="bg-muted p-4 rounded">
              <div className="text-sm text-muted-foreground">Score</div>
              <div className="text-2xl font-bold">
                {performanceData.score}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Status: {performanceData.isComplete ? '✅ Complete' : '⏳ Collecting...'} | 
            Has Enough Data: {performanceData.hasEnoughData ? '✅ Yes' : '❌ No'}
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-card p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              id="test-button"
              onClick={triggerUserInteraction}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-all"
            >
              Trigger User Interaction (INP)
            </button>
            <button
              onClick={simulateLayoutShift}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Simulate Layout Shift (CLS)
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Reload Page (All Metrics)
            </button>
          </div>
        </div>

        {/* Test Content */}
        <div 
          id="test-content"
          className="bg-card p-6 rounded-lg mb-8 transition-all duration-500"
          style={{ height: '200px', backgroundColor: '#ffffff' }}
        >
          <h3 className="text-lg font-semibold mb-4">Test Content Area</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2">Loading test content...</span>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-4">
                This area is used to test layout shifts and content loading performance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-muted p-4 rounded">
                    <div className="h-4 bg-background rounded mb-2"></div>
                    <div className="h-3 bg-background rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Test Performance Metrics</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>LCP (Largest Contentful Paint):</strong> The largest content element loads. 
              Watch the console for LCP metrics.
            </div>
            <div>
              <strong>FCP (First Contentful Paint):</strong> First content appears on screen. 
              Should be measured early in page load.
            </div>
            <div>
              <strong>CLS (Cumulative Layout Shift):</strong> Click "Simulate Layout Shift" to trigger 
              layout changes and measure CLS.
            </div>
            <div>
              <strong>INP (Interaction to Next Paint):</strong> Click "Trigger User Interaction" to 
              simulate user interactions and measure INP.
            </div>
            <div>
              <strong>TTFB (Time to First Byte):</strong> Server response time. Measured automatically 
              on page load.
            </div>
            <div className="mt-4 p-3 bg-muted rounded">
              <strong>💡 Tip:</strong> Open browser DevTools → Console to see real-time performance metrics 
              being logged. Check the Network tab to see data being sent to the backend.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTestPage;
