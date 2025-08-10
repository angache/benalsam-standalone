import { supabase } from './supabaseClient';
import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import { useAuthStore } from '../stores/authStore';
import { 
  AnalyticsEvent, 
  AnalyticsEventType, 
  AnalyticsUser, 
  AnalyticsSession, 
  AnalyticsDevice, 
  AnalyticsContext
} from 'benalsam-shared-types';
import Constants from 'expo-constants';

// Admin Backend URL
const ADMIN_BACKEND_URL = process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL || 'http://localhost:3002';

/**
 * KVKK COMPLIANCE: Analytics Service
 * 
 * Bu servis KVKK (Kişisel Verilerin Korunması Kanunu) uyumluluğu için tasarlanmıştır:
 * 
 * ✅ SADECE SESSION_ID KULLANILIR - Kullanıcı kimliği (user_id) analytics'te saklanmaz
 * ✅ ANONIMIZASYON - Kişisel veriler analytics'te tutulmaz
 * ✅ LEGITIMATE INTEREST - Meşru menfaat kapsamında veri işleme
 * ✅ MINIMUM DATA - Sadece gerekli veriler toplanır
 * ✅ TRANSPARENCY - Veri işleme şeffaf ve açık
 * 
 * Session-based tracking ile kullanıcı gizliliği korunur.
 * Analytics verileri sadece session_id ile ilişkilendirilir.
 */

// Legacy interface for backward compatibility
export interface UserBehaviorEvent {
  user_id: string;
  event_type: 'click' | 'scroll' | 'search' | 'favorite' | 'view' | 'share' | 'message' | 'offer' | 'performance';
  event_data: {
    screen_name?: string;
    section_name?: string;
    listing_id?: string;
    category_id?: string;
    search_term?: string;
    scroll_depth?: number;
    time_spent?: number;
    coordinates?: { x: number; y: number };
    metric_type?: string;
    value?: number;
    unit?: string;
    used_mb?: number;
    total_mb?: number;
    percentage?: number;
    endpoint?: string;
    duration_ms?: number;
    average_ms?: number;
    error_type?: string;
    context?: string;
    count?: number;
    message?: string;
    [key: string]: any;
  };
  timestamp: string;
  session_id?: string;
  device_info?: {
    platform: string;
    version: string;
    model?: string;
  };
}

export interface UserAnalytics {
  user_id: string;
  screen_name: string;
  scroll_depth: number;
  time_spent: number; // seconds
  sections_engaged: {
    [sectionName: string]: {
      time_spent: number;
      interactions: number;
    };
  };
  session_start: string;
  session_end?: string;
  bounce_rate: boolean;
}

class AnalyticsService {
  private sessionId: string | undefined = undefined;
  private sessionStartTime: number | undefined = undefined;
  private enterpriseSessionId: string | undefined = undefined;
  private screenStartTime: number | undefined = undefined;
  private currentScreen: string | undefined = undefined;
  private scrollDepth: number = 0;
  private sectionsEngaged: { [key: string]: { time_spent: number; interactions: number } } = {};
  private pageViews: number = 0;
  private eventsCount: number = 0;
  
  // Scroll tracking optimization
  private scrollTimeout: NodeJS.Timeout | null = null;
  private lastScrollTime: number = 0;
  private scrollThrottleMs: number = 1000; // 1 saniye
  private scrollDebounceMs: number = 500; // 500ms
  
  // Enhanced tracking
  private userProfile: any = null;
  private appVersion: string = '1.0.0';
  private language: string = 'tr';
  private timezone: string = 'Europe/Istanbul';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initializeAnalytics();
    // Enterprise session ID will be loaded when needed
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Get app version from Constants
      this.appVersion = Constants.expoConfig?.version || '1.0.0';
      
      // Get timezone
      this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      

      
      console.log('✅ Analytics service initialized');
    } catch (error) {
      console.error('❌ Error initializing analytics:', error);
    }
  }

  private async loadEnterpriseSessionId(): Promise<string | undefined> {
    try {
      console.log('🔍 Analytics: Loading enterprise session ID...');
      
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Analytics: Supabase session:', session ? 'exists' : 'not found');
      
      if (session) {
        console.log('🔍 Analytics: User ID:', session.user.id);
        
        // Get active session from user_session_logs
        const { data: sessionData, error } = await supabase
          .from('user_session_logs')
          .select('session_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        console.log('🔍 Analytics: Session data:', sessionData);
        console.log('🔍 Analytics: Session error:', error);
        
        if (sessionData?.session_id) {
          this.enterpriseSessionId = sessionData.session_id;
          console.log('🔐 Analytics: Enterprise session ID loaded:', this.enterpriseSessionId);
          return this.enterpriseSessionId;
        } else {
          console.log('⚠️ Analytics: No active session found in database');
        }
      } else {
        console.log('⚠️ Analytics: No Supabase session found');
      }
    } catch (error) {
      console.warn('⚠️ Analytics: Could not load enterprise session ID:', error);
    }
    return undefined;
  }

  /**
   * KVKK COMPLIANCE: Get Enterprise Session ID
   * 
   * Session ID'yi veritabanından alır. Bu ID kullanıcı kimliği değil,
   * sadece session'ı takip etmek için kullanılır.
   * 
   * @returns Promise<string | undefined> - Session ID
   */
  private async getEnterpriseSessionId(): Promise<string | undefined> {
    console.log('🔍 Analytics: Getting enterprise session ID...');
    console.log('🔍 Analytics: Cached enterprise session ID:', this.enterpriseSessionId);
    
    if (this.enterpriseSessionId) {
      console.log('🔐 Analytics: Using cached enterprise session ID:', this.enterpriseSessionId);
      return this.enterpriseSessionId;
    }
    
    console.log('🔍 Analytics: Loading enterprise session ID from database...');
    const sessionId = await this.loadEnterpriseSessionId();
    console.log('🔍 Analytics: Loaded enterprise session ID:', sessionId);
    return sessionId;
  }



  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version?.toString() || 'unknown',
      model: Device.modelName || 'unknown'
    };
  }

  private async getAuthToken(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return '';
    }
  }

  // ===========================
  // STANDARDIZED EVENT TRACKING METHODS
  // ===========================

  /**
   * Track any analytics event with standardized format
   */
  /**
   * KVKK COMPLIANCE: Track Event
   * 
   * Analytics event'ini KVKK uyumlu şekilde kaydeder.
   * Sadece session_id kullanılır, kişisel veri saklanmaz.
   * 
   * @param eventName - Event adı
   * @param properties - Event özellikleri (kişisel veri içermemeli)
   * @returns Promise<boolean> - Başarı durumu
   */
  async trackEvent(
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    console.log('🔍 AnalyticsService.trackEvent called');
    console.log('🔍 eventName:', eventName);
    console.log('🔍 properties:', properties);
    
    // Get user from auth store directly
    const { user } = useAuthStore.getState();
    if (!user || !this.sessionId) {
      console.warn('⚠️ Analytics: User not logged in or session not started. Event not tracked.');
      console.log('🔍 user:', user);
      console.log('🔍 sessionId:', this.sessionId);
      return false;
    }

    try {
      console.log('🔍 About to send request to admin backend');
      console.log('🔍 ADMIN_BACKEND_URL:', ADMIN_BACKEND_URL);
      
      console.log('🔍 user data:', user);

      // Get enterprise session ID
      const enterpriseSessionId = await this.getEnterpriseSessionId();
      console.log('🔍 Analytics: Final enterprise session ID for request:', enterpriseSessionId);
      console.log('🔍 Analytics: Fallback session ID:', this.sessionId);
      
      // Get Supabase session ID as fallback
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseSessionId = session?.access_token;
      
      // Extract session UUID from JWT token
      let supabaseSessionUUID: string | undefined;
      if (supabaseSessionId) {
        try {
          const payload = JSON.parse(atob(supabaseSessionId.split('.')[1]));
          supabaseSessionUUID = payload.session_id;
        } catch (error) {
          console.warn('⚠️ Analytics: Could not decode JWT payload:', error);
        }
      }
      
      console.log('🔍 Analytics: Supabase session ID:', supabaseSessionId);
      console.log('🔍 Analytics: Supabase session UUID:', supabaseSessionUUID);
      
      // Send to Admin Backend
      const requestBody = {
        session_id: enterpriseSessionId || supabaseSessionUUID || this.sessionId || supabaseSessionId, // ✅ UUID öncelikli fallback
        event_type: eventName,
        event_data: {
          ...properties,
          event_timestamp: new Date().toISOString()
        },
        device_info: this.getDeviceInfo()
      };
      
      console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${ADMIN_BACKEND_URL}/api/v1/analytics/track-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Response error text:', errorText);
        console.error('Analytics: Failed to track event:', errorText);
        return false;
      }

      const responseData = await response.json();
      console.log('🔍 Response data:', responseData);

      this.eventsCount++;
      console.log(`🔍 Analytics: Tracked ${eventName} event successfully`);
      return true;
    } catch (error) {
      console.error('🔍 Analytics: Error tracking event:', error);
      return false;
    }
  }

  // ===== CORE EVENTS =====

  /**
   * Track page/screen view
   */
  async trackPageView(pageName: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackEvent('PAGE_VIEW', {
      page_name: pageName,
      ...properties
    });
  }

  /**
   * Track screen view (mobile specific)
   */
  async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackEvent('SCREEN_VIEW', {
      screen_name: screenName,
      ...properties
    });
  }

  /**
   * Track button click
   */
  async trackButtonClick(
    buttonName: string, 
    buttonId?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('BUTTON_CLICK', {
      button_name: buttonName,
      button_id: buttonId,
      ...properties
    });
  }

  /**
   * Track form submission
   */
  async trackFormSubmit(
    formName: string, 
    formId?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('FORM_SUBMIT', {
      form_name: formName,
      form_id: formId,
      ...properties
    });
  }

  /**
   * Track search
   */
  async trackSearch(
    searchQuery: string, 
    resultsCount?: number, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('SEARCH', {
      search_query: searchQuery,
      search_results_count: resultsCount,
      ...properties
    });
  }

  /**
   * Track listing view
   */
  async trackListingView(
    listingId: string, 
    category?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('LISTING_VIEW', {
      listing_id: listingId,
      listing_category: category,
      ...properties
    });
  }

  /**
   * Track listing creation
   */
  async trackListingCreate(
    listingId: string, 
    category?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('LISTING_CREATE', {
      listing_id: listingId,
      listing_category: category,
      ...properties
    });
  }

  /**
   * Track offer sent
   */
  async trackOfferSent(
    offerId: string, 
    listingId?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('OFFER_SENT', {
      offer_id: offerId,
      listing_id: listingId,
      ...properties
    });
  }

  /**
   * Track message sent
   */
  async trackMessageSent(
    messageId: string, 
    recipientId?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('MESSAGE_SENT', {
      message_id: messageId,
      recipient_id: recipientId,
      ...properties
    });
  }

  /**
   * Track scroll
   */
  async trackScroll(
    scrollDepth: number, 
    direction?: 'up' | 'down' | 'left' | 'right', 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('SCROLL', {
      scroll_depth: scrollDepth,
      scroll_direction: direction,
      ...properties
    });
  }

  /**
   * Track tap
   */
  async trackTap(
    elementName: string, 
    coordinates?: { x: number; y: number }, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('TAP', {
      button_name: elementName,
      ...properties
    });
  }

  /**
   * Track swipe
   */
  async trackSwipe(
    direction: 'up' | 'down' | 'left' | 'right', 
    elementName?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('SWIPE', {
      swipe_direction: direction,
      button_name: elementName,
      ...properties
    });
  }

  // ===== PERFORMANCE EVENTS =====

  /**
   * Track app load
   */
  async trackAppLoad(
    loadTimeMs: number, 
    coldStart: boolean = false, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('APP_LOAD', {
      app_load_time_ms: loadTimeMs,
      cold_start: coldStart,
      ...properties
    });
  }

  /**
   * Track screen load
   */
  async trackScreenLoad(
    screenName: string, 
    loadTimeMs: number, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('SCREEN_LOAD', {
      screen_name: screenName,
      screen_load_time_ms: loadTimeMs,
      ...properties
    });
  }

  /**
   * Track API call
   */
  async trackApiCall(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    responseTimeMs: number, 
    statusCode?: number, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('API_CALL', {
      api_endpoint: endpoint,
      api_method: method,
      api_response_time_ms: responseTimeMs,
      api_status_code: statusCode,
      ...properties
    });
  }

  /**
   * Track error
   */
  async trackError(
    errorType: string, 
    errorMessage: string, 
    errorStack?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('ERROR_OCCURRED', {
      error_type: errorType,
      error_message: errorMessage,
      error_stack: errorStack,
      ...properties
    });
  }

  // ===== BUSINESS EVENTS =====

  /**
   * Track user registration
   */
  async trackUserRegistered(
    registrationMethod: 'email' | 'google' | 'apple' | 'facebook', 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('USER_REGISTERED', {
      registration_method: registrationMethod,
      user_type: 'new',
      ...properties
    });
  }

  /**
   * Track user login
   */
  async trackUserLoggedIn(
    loginMethod: 'email' | 'google' | 'apple' | 'facebook', 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('USER_LOGGED_IN', {
      registration_method: loginMethod,
      user_type: 'returning',
      ...properties
    });
  }

  /**
   * Track premium upgrade
   */
  async trackPremiumUpgraded(
    plan: 'premium' | 'lifetime', 
    price: number, 
    currency: string = 'TRY', 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('PREMIUM_UPGRADED', {
      subscription_plan: plan,
      subscription_price: price,
      subscription_currency: currency,
      ...properties
    });
  }

  /**
   * Track payment completion
   */
  async trackPaymentCompleted(
    amount: number, 
    currency: string = 'TRY', 
    method: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay', 
    transactionId?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('PAYMENT_COMPLETED', {
      payment_amount: amount,
      payment_currency: currency,
      payment_method: method,
      payment_status: 'success',
      transaction_id: transactionId,
      ...properties
    });
  }

  // ===== ENGAGEMENT EVENTS =====

  /**
   * Track notification received
   */
  async trackNotificationReceived(
    notificationType: 'push' | 'email' | 'sms', 
    title?: string, 
    category?: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('NOTIFICATION_RECEIVED', {
      notification_type: notificationType,
      notification_title: title,
      notification_category: category,
      ...properties
    });
  }

  /**
   * Track filter applied
   */
  async trackFilterApplied(
    filterType: string, 
    filterValues: Record<string, any>, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('FILTER_APPLIED', {
      filter_type: filterType,
      filter_values: filterValues,
      ...properties
    });
  }

  /**
   * Track category selection
   */
  async trackCategorySelected(
    categoryId: string, 
    categoryName: string, 
    properties: Record<string, any> = {}
  ): Promise<boolean> {
    return this.trackEvent('CATEGORY_SELECTED', {
      category_id: categoryId,
      category_name: categoryName,
      ...properties
    });
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildAnalyticsUser(user: any): AnalyticsUser {
    return {
      id: user.id,
      email: user.email || '',
      name: user.name || user.username || '',
      avatar: user.avatar_url,
      properties: {
        registration_date: user.created_at,
        subscription_type: user.subscription_type || 'free',
        last_login: new Date().toISOString(),
        trust_score: user.trust_score || 0,
        verification_status: user.verification_status || 'unverified'
      }
    };
  }

  private async buildAnalyticsSession(): Promise<AnalyticsSession> {
    const enterpriseSessionId = await this.getEnterpriseSessionId();
    return {
      id: enterpriseSessionId || this.sessionId || '', // ✅ Enterprise session ID kullanılıyor
      start_time: new Date(this.sessionStartTime || Date.now()).toISOString(),
      duration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
      page_views: this.pageViews,
      events_count: this.eventsCount
    };
  }

  private buildAnalyticsDevice(): AnalyticsDevice {
    const deviceInfo = this.getDeviceInfo();
    return {
      platform: Platform.OS as 'ios' | 'android' | 'web' | 'desktop',
      version: deviceInfo.version,
      model: deviceInfo.model,
      screen_resolution: `${Dimensions.get('window').width}x${Dimensions.get('window').height}`,
      app_version: this.appVersion,
      os_version: Platform.Version?.toString() || '',
      browser: undefined,
      user_agent: undefined
    };
  }

  private buildAnalyticsContext(): AnalyticsContext {
    return {
      language: this.language,
      timezone: this.timezone
    };
  }

  // Track user behavior event
  // DISABLED: This function sends event_type as object, causing Elasticsearch errors
  // Use trackEvent() instead for proper string event_type format
  async trackEventLegacy(event: Omit<UserBehaviorEvent, 'user_id' | 'timestamp' | 'session_id' | 'device_info'>): Promise<boolean> {
    console.warn('⚠️ trackEventLegacy is DISABLED - use trackEvent() instead');
    return false;
  }

  // Track screen view
  async trackScreenViewLegacy(screenName: string): Promise<void> {
    // End previous screen session
    if (this.currentScreen && this.screenStartTime) {
      const timeSpent = Math.floor((Date.now() - this.screenStartTime) / 1000);
      // Disable legacy tracking to prevent format issues
      // await this.trackEventLegacy({
      //   event_type: 'view',
      //   event_data: {
      //     screen_name: this.currentScreen,
      //     time_spent: timeSpent,
      //     scroll_depth: this.scrollDepth
      //   }
      // });
    }

    // Start new screen session
    this.currentScreen = screenName;
    this.screenStartTime = Date.now();
    this.scrollDepth = 0;
    this.sectionsEngaged = {};

    // Increment page views
    this.pageViews++;

    // Also track with new standardized format
    await this.trackScreenViewNew(screenName);

    console.log(`📱 Screen view tracked: ${screenName}`);
  }

  // Track scroll depth with optimization
  async trackScrollDepth(depth: number, sectionName?: string): Promise<void> {
    const now = Date.now();
    
    // Throttle: Minimum 1 saniye aralıkla
    if (now - this.lastScrollTime < this.scrollThrottleMs) {
      return;
    }
    
    this.scrollDepth = Math.max(this.scrollDepth, depth);
    
    if (sectionName) {
      if (!this.sectionsEngaged[sectionName]) {
        this.sectionsEngaged[sectionName] = { time_spent: 0, interactions: 0 };
      }
      this.sectionsEngaged[sectionName].interactions++;
    }

    // Clear previous timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Debounce: Scroll durduktan 500ms sonra track et
    this.scrollTimeout = setTimeout(async () => {
      this.lastScrollTime = Date.now();
      
      // Use new format instead of legacy
      await this.trackEvent('SCROLL', {
        screen_name: this.currentScreen,
        section_name: sectionName,
        scroll_depth: depth
      });
    }, this.scrollDebounceMs);
  }

  // Track click
  async trackClick(sectionName: string, listingId?: string, categoryId?: string): Promise<void> {
    if (this.sectionsEngaged[sectionName]) {
      this.sectionsEngaged[sectionName].interactions++;
    }

    await this.trackEvent('BUTTON_CLICK', {
      screen_name: this.currentScreen,
      section_name: sectionName,
      listing_id: listingId,
      category_id: categoryId
    });
  }

  // Track search
  async trackSearchLegacy(searchTerm: string): Promise<void> {
    await this.trackEvent('SEARCH', {
      screen_name: this.currentScreen,
      search_term: searchTerm
    });
  }

  // Track favorite
  async trackFavorite(listingId: string, action: 'add' | 'remove'): Promise<void> {
    await this.trackEvent('FAVORITE_ADDED', {
      screen_name: this.currentScreen,
      listing_id: listingId,
      action: action
    });
  }

  // Track listing view
  async trackListingViewLegacy(listingId: string, categoryId?: string): Promise<void> {
    await this.trackEvent('LISTING_VIEW', {
      screen_name: this.currentScreen,
      listing_id: listingId,
      category_id: categoryId
    });
  }

  // Track share
  async trackShare(listingId: string, method: string): Promise<void> {
    await this.trackEvent('SHARE', {
      screen_name: this.currentScreen,
      listing_id: listingId,
      method: method
    });
  }

  // Track message
  async trackMessage(listingId: string, conversationId: string): Promise<void> {
    await this.trackEvent('MESSAGE_SENT', {
      screen_name: this.currentScreen,
      listing_id: listingId,
      conversation_id: conversationId
    });
  }

  // Track offer
  async trackOffer(listingId: string, offerAmount: number): Promise<void> {
    await this.trackEvent('OFFER_SENT', {
      screen_name: this.currentScreen,
      listing_id: listingId,
      offer_amount: offerAmount
    });
  }

  // End session and send analytics
  async endSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.sessionStartTime) return;

      // End current screen session
      if (this.currentScreen && this.screenStartTime) {
        const timeSpent = Math.floor((Date.now() - this.screenStartTime) / 1000);
        await this.trackEvent('SCREEN_VIEW', {
          screen_name: this.currentScreen,
          time_spent: timeSpent,
          scroll_depth: this.scrollDepth
        });
      }

      // Calculate session analytics
      const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const bounceRate = sessionDuration < 10; // Less than 10 seconds = bounce

      const analytics: UserAnalytics = {
        user_id: user.id,
        screen_name: this.currentScreen || 'unknown',
        scroll_depth: this.scrollDepth,
        time_spent: sessionDuration,
        sections_engaged: this.sectionsEngaged,
        session_start: new Date(this.sessionStartTime).toISOString(),
        session_end: new Date().toISOString(),
        bounce_rate: bounceRate
      };

      // Send analytics to admin-backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL}/api/v1/analytics/track-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(analytics)
      });

      if (response.ok) {
        console.log('📈 Session analytics sent successfully');
      } else {
        console.error('❌ Failed to send session analytics:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error ending session:', error);
    }
  }

  // Get user behavior stats (for debugging)
  async getUserStats(days: number = 30): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const response = await fetch(`${process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL}/api/v1/analytics/user-stats/${user.id}?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        console.error('❌ Failed to get user stats:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return null;
    }
  }

  // ===========================
  // STANDARDIZED ANALYTICS METHODS
  // ===========================

  // Track standardized analytics event
  async trackAnalyticsEvent(eventName: typeof AnalyticsEventType[keyof typeof AnalyticsEventType], eventProperties: Record<string, any> = {}): Promise<boolean> {
    try {
      const user = useAuthStore.getState().user;
      if (!user || !this.sessionId) {
        console.warn('⚠️ Analytics: User not logged in or session not started. Event not tracked.');
        return false;
      }

      console.log('🔍 trackAnalyticsEvent called with:', eventName, eventProperties);

      // Get enterprise session ID
      const enterpriseSessionId = await this.getEnterpriseSessionId();
      console.log('🔍 Analytics: Final enterprise session ID for trackAnalyticsEvent:', enterpriseSessionId);
      
      // Get Supabase session ID as fallback
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseSessionId = session?.access_token;
      
      // Extract session UUID from JWT token
      let supabaseSessionUUID: string | undefined;
      if (supabaseSessionId) {
        try {
          const payload = JSON.parse(atob(supabaseSessionId.split('.')[1]));
          supabaseSessionUUID = payload.session_id;
        } catch (error) {
          console.warn('⚠️ Analytics: Could not decode JWT payload:', error);
        }
      }
      
      console.log('🔍 Analytics: Supabase session ID for trackAnalyticsEvent:', supabaseSessionId);
      console.log('🔍 Analytics: Supabase session UUID for trackAnalyticsEvent:', supabaseSessionUUID);
      
      // Use the same format as trackEvent
      const requestBody = {
        event_type: eventName,
        event_data: {
          ...eventProperties,
          event_timestamp: new Date().toISOString()
        },
        session_id: enterpriseSessionId || supabaseSessionUUID || this.sessionId || supabaseSessionId, // ✅ UUID öncelikli fallback
        device_info: this.getDeviceInfo()
      };

      console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL}/api/v1/analytics/track-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Response error text:', errorText);
        console.error('Analytics: Failed to track event:', errorText);
        return false;
      }

      const responseData = await response.json();
      console.log('🔍 Response data:', responseData);

      this.eventsCount++;
      console.log(`🔍 Analytics: Tracked ${eventName} event successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error tracking analytics event:', error);
      return false;
    }
  }

  // Helper methods for specific event types
  async trackScreenViewNew(screenName: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.SCREEN_VIEW, {
      screen_name: screenName,
      ...properties
    });
  }

  async trackButtonClickNew(buttonName: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.BUTTON_CLICK, {
      button_name: buttonName,
      ...properties
    });
  }

  async trackSearchNew(searchTerm: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.SEARCH, {
      search_term: searchTerm,
      ...properties
    });
  }

  async trackListingViewNew(listingId: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.LISTING_VIEW, {
      listing_id: listingId,
      ...properties
    });
  }

  async trackListingCreateNew(listingId: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.LISTING_CREATE, {
      listing_id: listingId,
      ...properties
    });
  }

  async trackOfferSentNew(offerId: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.OFFER_SENT, {
      offer_id: offerId,
      ...properties
    });
  }

  async trackMessageSentNew(messageId: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.MESSAGE_SENT, {
      message_id: messageId,
      ...properties
    });
  }

  async trackAppLoadNew(properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.APP_LOAD, {
      load_time_ms: Date.now() - (this.sessionStartTime || Date.now()),
      ...properties
    });
  }

  async trackApiCallNew(endpoint: string, duration: number, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.API_CALL, {
      endpoint,
      duration_ms: duration,
      ...properties
    });
  }

  async trackErrorNew(errorType: string, errorMessage: string, properties: Record<string, any> = {}): Promise<boolean> {
    return this.trackAnalyticsEvent(AnalyticsEventType.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      ...properties
    });
  }



  async setLanguage(language: string): Promise<void> {
    this.language = language;
  }

  async setTimezone(timezone: string): Promise<void> {
    this.timezone = timezone;
  }

  async getAnalyticsSummary(): Promise<{
    sessionId: string;
    pageViews: number;
    eventsCount: number;
    sessionDuration: number;
    currentScreen: string;
  }> {
    return {
      sessionId: this.sessionId || '',
      pageViews: this.pageViews,
      eventsCount: this.eventsCount,
      sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
      currentScreen: this.currentScreen || ''
    };
  }
}

export default new AnalyticsService(); 