import { supabase } from '@/lib/supabaseClient';
import { 
  AnalyticsEvent, 
  AnalyticsUser, 
  AnalyticsSession, 
  AnalyticsDevice, 
  AnalyticsContext 
} from 'benalsam-shared-types';
import { AnalyticsEventType, AnalyticsEventProperties } from 'benalsam-shared-types';

// Session management helper
const getSessionId = async (): Promise<string> => {
  try {
    // Try to get enterprise session ID first
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: sessionData } = await supabase
        .from('user_session_logs')
        .select('session_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (sessionData?.session_id) {
        console.log('🔐 Web Analytics: Enterprise session ID loaded:', sessionData.session_id);
        return sessionData.session_id;
      }
    }
  } catch (error) {
    console.warn('⚠️ Web Analytics: Could not load enterprise session ID:', error);
  }
  
  // Fallback to local session ID
  let sessionId = localStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

// Error handling helper
const handleAnalyticsError = (error: any, eventType: string): void => {
  console.error(`Error in trackEvent '${eventType}':`, error);
  // Analytics errors are non-critical, so we don't show toasts
};

export const trackEvent = async (
  eventType: string, 
  eventData: Record<string, any> = {}
): Promise<void> => {
  if (!eventType) {
    console.error('trackEvent called without eventType');
    return;
  }

  try {
    const sessionId = await getSessionId();
    
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    
    const analyticsEvent: AnalyticsEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_name: eventType as any, // Cast to shared-types enum
      event_timestamp: new Date().toISOString(),
      event_properties: eventData as AnalyticsEventProperties,
      user: user ? {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || '',
        avatar: user.user_metadata?.avatar_url,
        properties: {
          registration_date: user.created_at,
          last_login: user.last_sign_in_at,
          user_type: 'returning' // TODO: Determine if new user
        }
      } : {
        id: 'anonymous',
        email: '',
        name: 'Anonymous User',
        properties: {
          user_type: 'new'
        }
      },
      session: {
        id: sessionId,
        start_time: new Date().toISOString(),
        page_views: 0,
        events_count: 0
      },
      device: {
        platform: 'web',
        browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 
                 navigator.userAgent.includes('Firefox') ? 'firefox' : 
                 navigator.userAgent.includes('Safari') ? 'safari' : 'other',
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        app_version: '1.0.0'
      },
      context: {
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_agent: navigator.userAgent
      }
    };

    // Send to backend
    const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/v1/analytics/track-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsEvent)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Analytics event tracked:', eventType);
  } catch (error) {
    handleAnalyticsError(error, eventType);
  }
};

export const trackPageView = async (pageName: string): Promise<void> => {
  await trackEvent('page_view', { page_name: pageName });
};

export const trackUserAction = async (
  action: string, 
  details: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('user_action', { action, ...details });
};

export const trackError = async (
  errorType: string, 
  errorMessage: string
): Promise<void> => {
  await trackEvent('error', { error_type: errorType, error_message: errorMessage });
};

// Additional analytics functions
export const trackListingView = async (
  listingId: string, 
  listingTitle: string, 
  category: string
): Promise<void> => {
  await trackEvent('listing_view', {
    listing_id: listingId,
    listing_title: listingTitle,
    category: category
  });
};

export const trackOfferCreated = async (
  offerId: string, 
  listingId: string, 
  amount: number
): Promise<void> => {
  await trackEvent('offer_created', {
    offer_id: offerId,
    listing_id: listingId,
    amount: amount
  });
};

export const trackUserRegistration = async (
  registrationMethod: string
): Promise<void> => {
  await trackEvent('user_registration', {
    registration_method: registrationMethod
  });
};

export const trackUserLogin = async (
  loginMethod: string
): Promise<void> => {
  await trackEvent('user_login', {
    login_method: loginMethod
  });
};

export const trackSearchQuery = async (
  query: string, 
  filters: Record<string, any>, 
  resultsCount: number
): Promise<void> => {
  await trackEvent('search_query', {
    query: query,
    filters: filters,
    results_count: resultsCount
  });
};

export const trackCategoryView = async (
  category: string, 
  subcategory?: string
): Promise<void> => {
  await trackEvent('category_view', {
    category: category,
    subcategory: subcategory
  });
};

export const trackPremiumUpgrade = async (
  plan: string, 
  amount: number
): Promise<void> => {
  await trackEvent('premium_upgrade', {
    plan: plan,
    amount: amount
  });
};

export const trackConversationStarted = async (
  conversationId: string, 
  listingId: string
): Promise<void> => {
  await trackEvent('conversation_started', {
    conversation_id: conversationId,
    listing_id: listingId
  });
};

export const trackFavoriteAdded = async (
  listingId: string
): Promise<void> => {
  await trackEvent('favorite_added', {
    listing_id: listingId
  });
};

export const trackProfileView = async (
  profileId: string
): Promise<void> => {
  await trackEvent('profile_view', {
    profile_id: profileId
  });
};

// Enhanced analytics methods with standardized format
export const trackAnalyticsEvent = async (
  eventName: keyof typeof AnalyticsEventType,
  eventProperties: Record<string, any> = {}
): Promise<boolean> => {
  try {
    // Get session ID
    const sessionId = await getSessionId();
    
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();

    // Create analytics session object
    const analyticsSession: AnalyticsSession = {
      id: sessionId,
      start_time: new Date().toISOString(),
      page_views: 0,
      events_count: 0
    };

    // Create analytics device object
    const analyticsDevice: AnalyticsDevice = {
      platform: 'web',
      browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 
               navigator.userAgent.includes('Firefox') ? 'firefox' : 
               navigator.userAgent.includes('Safari') ? 'safari' : 'other',
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      app_version: '1.0.0'
    };

    // Create analytics context object
    const analyticsContext: AnalyticsContext = {
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      user_agent: navigator.userAgent
    };

    // Create standardized analytics event
    const analyticsEvent: AnalyticsEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_name: AnalyticsEventType[eventName],
      event_timestamp: new Date().toISOString(),
      event_properties: eventProperties as AnalyticsEventProperties,
      user: user ? {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || '',
        avatar: user.user_metadata?.avatar_url,
        properties: {
          registration_date: user.created_at,
          last_login: user.last_sign_in_at,
          user_type: 'returning'
        }
      } : {
        id: 'anonymous',
        email: '',
        name: 'Anonymous User',
        properties: {
          user_type: 'new'
        }
      },
      session: analyticsSession,
      device: analyticsDevice,
      context: analyticsContext
    };

    // Send to backend
    const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/v1/analytics/track-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsEvent)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return false;
  }
};

// Helper methods for specific event types
export const trackScreenViewNew = async (screenName: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('SCREEN_VIEW', {
    screen_name: screenName,
    ...properties
  });
};

export const trackButtonClickNew = async (buttonName: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('BUTTON_CLICK', {
    button_name: buttonName,
    ...properties
  });
};

export const trackSearchNew = async (searchTerm: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('SEARCH', {
    search_term: searchTerm,
    ...properties
  });
};

export const trackListingViewNew = async (listingId: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('LISTING_VIEW', {
    listing_id: listingId,
    ...properties
  });
};

export const trackListingCreateNew = async (listingId: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('LISTING_CREATE', {
    listing_id: listingId,
    ...properties
  });
};

export const trackOfferSentNew = async (offerId: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('OFFER_SENT', {
    offer_id: offerId,
    ...properties
  });
};

export const trackMessageSentNew = async (messageId: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('MESSAGE_SENT', {
    message_id: messageId,
    ...properties
  });
};

export const trackAppLoadNew = async (properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('APP_LOAD', {
    load_time_ms: Date.now() - performance.timing.navigationStart,
    ...properties
  });
};

export const trackApiCallNew = async (endpoint: string, duration: number, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('API_CALL', {
    endpoint,
    duration_ms: duration,
    ...properties
  });
};

export const trackErrorOccurredNew = async (errorType: string, errorMessage: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('ERROR_OCCURRED', {
    error_type: errorType,
    error_message: errorMessage,
    ...properties
  });
}; 