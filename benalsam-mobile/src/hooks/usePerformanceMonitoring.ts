import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager, AppState, Platform } from 'react-native';

export interface MobilePerformanceMetrics {
  componentName: string;
  appStartupTime: number;
  screenLoadTime: number;
  memoryUsage?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  networkType?: string;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    brand: string;
  };
  userInteractions: MobileUserInteraction[];
  timestamp: string;
}

export interface MobileUserInteraction {
  type: 'touch' | 'swipe' | 'scroll' | 'input' | 'navigation';
  target: string;
  timestamp: number;
  duration?: number;
  coordinates?: { x: number; y: number };
}

export interface AppStartupMetrics {
  coldStartTime: number;
  warmStartTime: number;
  hotStartTime: number;
  bundleLoadTime: number;
  jsBundleLoadTime: number;
}

class MobilePerformanceMonitor {
  private metrics: MobilePerformanceMetrics[] = [];
  private interactions: MobileUserInteraction[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;
  private appStartTime: number = Date.now();

  startMonitoring(componentName: string) {
    this.startTime = Date.now();
    this.isMonitoring = true;
    
    // App startup metrics
    this.captureAppStartupMetrics();
    
    // Screen load metrics
    this.captureScreenLoadMetrics();
    
    // Device info
    this.captureDeviceInfo();
    
    // User interaction tracking
    this.setupInteractionTracking();
    
    console.log(`🔍 Mobile performance monitoring started for: ${componentName}`);
  }

  stopMonitoring(componentName: string): MobilePerformanceMetrics {
    if (!this.isMonitoring) {
      throw new Error('Mobile performance monitoring not started');
    }

    const endTime = Date.now();
    const screenLoadTime = endTime - this.startTime;
    
    const metrics: MobilePerformanceMetrics = {
      componentName,
      appStartupTime: this.getAppStartupTime(),
      screenLoadTime,
      memoryUsage: this.getMemoryUsage(),
      batteryLevel: this.getBatteryLevel(),
      isCharging: this.getChargingStatus(),
      networkType: this.getNetworkType(),
      deviceInfo: this.getDeviceInfo(),
      userInteractions: [...this.interactions],
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metrics);
    this.isMonitoring = false;
    this.interactions = [];
    
    console.log(`✅ Mobile performance monitoring completed for: ${componentName}`, metrics);
    
    // Send metrics to backend (for now, just log)
    this.sendMetricsToBackend(metrics);
    
    return metrics;
  }

  private captureAppStartupMetrics() {
    // App startup time calculation
    const startupTime = Date.now() - this.appStartTime;
    console.log(`📱 App startup time: ${startupTime}ms`);
  }

  private captureScreenLoadMetrics() {
    // Screen load time will be calculated when stopMonitoring is called
    console.log('📱 Screen load metrics captured');
  }

  private captureDeviceInfo() {
    const deviceInfo = this.getDeviceInfo();
    console.log('📱 Device info:', deviceInfo);
  }

  private getAppStartupTime(): number {
    return Date.now() - this.appStartTime;
  }

  private getMemoryUsage(): number | undefined {
    // React Native doesn't provide direct memory access
    // This would need to be implemented with native modules
    // For now, return undefined
    return undefined;
  }

  private getBatteryLevel(): number | undefined {
    // This would need to be implemented with @react-native-community/battery
    // For now, return undefined
    return undefined;
  }

  private getChargingStatus(): boolean | undefined {
    // This would need to be implemented with @react-native-community/battery
    // For now, return undefined
    return undefined;
  }

  private getNetworkType(): string | undefined {
    // This would need to be implemented with @react-native-community/netinfo
    // For now, return undefined
    return undefined;
  }

  private getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Platform.OS === 'ios' ? 'iPhone' : 'Android',
      brand: Platform.OS === 'ios' ? 'Apple' : 'Google'
    };
  }

  private setupInteractionTracking() {
    // React Native interaction tracking would be implemented here
    // For now, we'll use a simple approach
    
    const trackInteraction = (type: MobileUserInteraction['type'], target: string, coordinates?: { x: number; y: number }) => {
      this.interactions.push({
        type,
        target,
        timestamp: Date.now(),
        coordinates
      });
    };

    // Note: In a real implementation, you would:
    // 1. Use React Native's PanResponder for touch tracking
    // 2. Use ScrollView onScroll for scroll tracking
    // 3. Use TextInput onChange for input tracking
    // 4. Use navigation events for navigation tracking
    
    console.log('📱 Interaction tracking setup completed');
  }

  private async sendMetricsToBackend(metrics: MobilePerformanceMetrics) {
    try {
      // For now, just log the metrics
      // In a real implementation, you would send this to your backend
      console.log('📊 Mobile performance metrics:', {
        componentName: metrics.componentName,
        appStartupTime: metrics.appStartupTime,
        screenLoadTime: metrics.screenLoadTime,
        memoryUsage: metrics.memoryUsage,
        batteryLevel: metrics.batteryLevel,
        isCharging: metrics.isCharging,
        networkType: metrics.networkType,
        deviceInfo: metrics.deviceInfo,
        userInteractions: metrics.userInteractions,
        timestamp: metrics.timestamp
      });
    } catch (error) {
      console.error('Failed to send mobile performance metrics to backend:', error);
    }
  }

  getMetrics(): MobilePerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
    this.interactions = [];
  }

  // Track specific interactions
  trackTouch(target: string, coordinates?: { x: number; y: number }) {
    this.interactions.push({
      type: 'touch',
      target,
      timestamp: Date.now(),
      coordinates
    });
  }

  trackSwipe(target: string, direction: string) {
    this.interactions.push({
      type: 'swipe',
      target: `${target}_${direction}`,
      timestamp: Date.now()
    });
  }

  trackScroll(target: string) {
    this.interactions.push({
      type: 'scroll',
      target,
      timestamp: Date.now()
    });
  }

  trackInput(target: string) {
    this.interactions.push({
      type: 'input',
      target,
      timestamp: Date.now()
    });
  }

  trackNavigation(from: string, to: string) {
    this.interactions.push({
      type: 'navigation',
      target: `${from}_to_${to}`,
      timestamp: Date.now()
    });
  }
}

// Singleton instance
const mobilePerformanceMonitor = new MobilePerformanceMonitor();

export const useMobilePerformanceMonitoring = (componentName: string) => {
  const isMonitoring = useRef(false);

  const startMonitoring = useCallback(() => {
    if (!isMonitoring.current) {
      mobilePerformanceMonitor.startMonitoring(componentName);
      isMonitoring.current = true;
    }
  }, [componentName]);

  const stopMonitoring = useCallback(() => {
    if (isMonitoring.current) {
      const metrics = mobilePerformanceMonitor.stopMonitoring(componentName);
      isMonitoring.current = false;
      return metrics;
    }
    return null;
  }, [componentName]);

  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    getMetrics: mobilePerformanceMonitor.getMetrics.bind(mobilePerformanceMonitor),
    clearMetrics: mobilePerformanceMonitor.clearMetrics.bind(mobilePerformanceMonitor),
    trackTouch: mobilePerformanceMonitor.trackTouch.bind(mobilePerformanceMonitor),
    trackSwipe: mobilePerformanceMonitor.trackSwipe.bind(mobilePerformanceMonitor),
    trackScroll: mobilePerformanceMonitor.trackScroll.bind(mobilePerformanceMonitor),
    trackInput: mobilePerformanceMonitor.trackInput.bind(mobilePerformanceMonitor),
    trackNavigation: mobilePerformanceMonitor.trackNavigation.bind(mobilePerformanceMonitor)
  };
};

export default mobilePerformanceMonitor; 