import { supabase } from '@/lib/supabaseClient';

// Local type definitions since benalsam-shared-types is now an npm package
const AnalyticsEventType = {
  PAGE_VIEW: 'page_view',
  USER_ACTION: 'user_action',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end'
} as const;

interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  session_id: string;
  created_at?: string;
}

interface AnalyticsUser {
  id: string;
  email?: string;
  role?: string;
}

interface AnalyticsSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
}

interface AnalyticsDevice {
  type: string;
  browser: string;
  os: string;
  screen_resolution: string;
}

interface AnalyticsContext {
  url: string;
  referrer?: string;
  user_agent: string;
}

// Legacy event interface for backward compatibility
interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, any>;
  session_id: string;
  created_at?: string;
}

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
    const event: AnalyticsEvent = {
      event_type: eventType,
      event_data: eventData,
      session_id: await getSessionId(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_events').insert(event);

    if (error) {
      handleAnalyticsError(error, eventType);
    }
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

    // Create analytics session object
    const analyticsSession: AnalyticsSession = {
      id: sessionId,
      start_time: new Date().toISOString(),
      duration: undefined, // Will be calculated when session ends
      page_views: 0, // TODO: Track page views
      events_count: 0 // TODO: Track event count
    };

    // Create analytics device object
    const analyticsDevice: AnalyticsDevice = {
      platform: 'web',
      version: navigator.userAgent,
      model: undefined,
      screen_resolution: `${screen.width}x${screen.height}`,
      app_version: '1.0.0', // TODO: Get from app config
      os_version: undefined,
      browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 
               navigator.userAgent.includes('Firefox') ? 'firefox' : 
               navigator.userAgent.includes('Safari') ? 'safari' : 'other',
      user_agent: navigator.userAgent
    };

    // Create analytics context object
    const analyticsContext: AnalyticsContext = {
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Create standardized analytics event (KVKK compliant - no user data)
    const analyticsEvent: AnalyticsEvent = {
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              event_name: AnalyticsEventType[eventName as keyof typeof AnalyticsEventType] || eventName,
      event_timestamp: new Date().toISOString(),
      event_properties: eventProperties,
      user: undefined, // KVKK: No user data in analytics
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

export const trackErrorNew = async (errorType: string, errorMessage: string, properties: Record<string, any> = {}): Promise<boolean> => {
  return trackAnalyticsEvent('ERROR_OCCURRED', {
    error_type: errorType,
    error_message: errorMessage,
    ...properties
  });
}; 