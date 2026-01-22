/**
 * Environment Detection Hook
 * Automatically detects the current environment and provides environment-specific values
 */

import { useEffect, useState } from 'react';
import { 
  getCurrentEnvironment, 
  getApiBaseUrl, 
  getWebSocketUrl,
  type Environment 
} from '../config/corsConfig';

interface EnvironmentInfo {
  environment: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  websocketUrl: string;
  siteUrl: string;
}

export const useEnvironment = (): EnvironmentInfo => {
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo>({
    environment: 'development',
    isDevelopment: true,
    isStaging: false,
    isProduction: false,
    apiBaseUrl: '',
    websocketUrl: '',
    siteUrl: ''
  });

  useEffect(() => {
    const env = getCurrentEnvironment();
    const apiBaseUrl = getApiBaseUrl();
    const websocketUrl = getWebSocketUrl();
    
    let siteUrl = '';
    switch (env) {
      case 'development':
        siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
        break;
      case 'staging':
        siteUrl = import.meta.env.VITE_SITE_URL || 'https://staging.benalsam.com';
        break;
      case 'production':
        siteUrl = import.meta.env.VITE_SITE_URL || 'https://benalsam.com';
        break;
    }

    setEnvironmentInfo({
      environment: env,
      isDevelopment: env === 'development',
      isStaging: env === 'staging',
      isProduction: env === 'production',
      apiBaseUrl,
      websocketUrl,
      siteUrl
    });
  }, []);

  return environmentInfo;
};

/**
 * Environment-based feature flag hook
 */
export const useFeatureFlag = (flagName: string): boolean => {
  const { environment } = useEnvironment();
  
  // Define feature flags per environment
  const featureFlags = {
    development: {
      ENABLE_DEBUG_MODE: true,
      ENABLE_ANALYZER: import.meta.env.VITE_ENABLE_ANALYZER === 'true',
      SHOW_DEV_TOOLS: true,
      MOCK_DATA: false
    },
    staging: {
      ENABLE_DEBUG_MODE: false,
      ENABLE_ANALYZER: false,
      SHOW_DEV_TOOLS: false,
      MOCK_DATA: false
    },
    production: {
      ENABLE_DEBUG_MODE: false,
      ENABLE_ANALYZER: false,
      SHOW_DEV_TOOLS: false,
      MOCK_DATA: false
    }
  };

  return featureFlags[environment][flagName] ?? false;
};

/**
 * Environment-based API client configuration
 */
export const useApiConfig = () => {
  const { apiBaseUrl, websocketUrl } = useEnvironment();
  
  return {
    baseURL: apiBaseUrl,
    websocketURL: websocketUrl,
    timeout: 10000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    }
  };
};

export default useEnvironment;