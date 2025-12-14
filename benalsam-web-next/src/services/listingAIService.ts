/**
 * Listing AI Service Client
 * Frontend service for AI suggestions
 */

import { supabase } from '@/lib/supabase';

const LISTING_SERVICE_URL = process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || 'http://localhost:3008/api/v1';

export interface TitleSuggestion {
  title: string;
  score: number;
  reason: string;
}

export interface AttributeSuggestion {
  key: string;
  value: any;
  confidence: number;
  reason: string;
}

export interface PriceRange {
  min: number;
  max: number;
  suggested: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface CompletionSuggestion {
  field: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AISuggestionRequest {
  category: string;
  categoryId?: string;
  attributes?: Record<string, any>;
  userInput?: string;
  currentTitle?: string;
  currentDescription?: string;
  currentData?: Partial<{
    title: string;
    description: string;
    budget: number;
    attributes: Record<string, any>;
  }>;
}

class ListingAIServiceClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const userId = await this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    let response: Response;
    try {
      const url = `${LISTING_SERVICE_URL}/listings/ai${endpoint}`;
      console.log('🔍 [AI] Requesting:', url, { userId, method: options.method || 'GET' });
      
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...options.headers,
        },
      });
      
      console.log('📡 [AI] Response status:', response.status, response.statusText);
    } catch (fetchError: any) {
      console.error('❌ [AI] Fetch error:', {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack,
        url: `${LISTING_SERVICE_URL}/listings/ai${endpoint}`
      });
      
      // Network error - service might be down
      if (fetchError.message?.includes('Failed to fetch') || fetchError.name === 'TypeError') {
        throw new Error('AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
      }
      throw fetchError;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Request failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Backend returns { success: true, data: ... } format
    return data.data !== undefined ? data.data : data;
  }

  private async getUserId(): Promise<string | null> {
    // Get user ID from Supabase session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Suggest titles
   */
  async suggestTitle(request: AISuggestionRequest): Promise<TitleSuggestion[]> {
    return this.request<TitleSuggestion[]>('/suggest-title', {
      method: 'POST',
      body: JSON.stringify({
        category: request.category,
        categoryId: request.categoryId,
        attributes: request.attributes,
        currentTitle: request.currentTitle,
        userInput: request.userInput,
      }),
    });
  }

  /**
   * Suggest description
   */
  async suggestDescription(request: AISuggestionRequest): Promise<string> {
    const result = await this.request<string>('/suggest-description', {
      method: 'POST',
      body: JSON.stringify({
        category: request.category,
        categoryId: request.categoryId,
        attributes: request.attributes,
        currentDescription: request.currentDescription,
        userInput: request.userInput,
      }),
    });
    
    // Backend returns string directly in data field
    return typeof result === 'string' ? result : '';
  }

  /**
   * Suggest attributes
   */
  async suggestAttributes(request: AISuggestionRequest): Promise<AttributeSuggestion[]> {
    return this.request<AttributeSuggestion[]>('/suggest-attributes', {
      method: 'POST',
      body: JSON.stringify({
        category: request.category,
        categoryId: request.categoryId,
        userInput: request.userInput,
        attributes: request.attributes,
      }),
    });
  }

  /**
   * Suggest price
   */
  async suggestPrice(request: AISuggestionRequest): Promise<PriceRange> {
    return this.request<PriceRange>('/suggest-price', {
      method: 'POST',
      body: JSON.stringify({
        category: request.category,
        categoryId: request.categoryId,
        attributes: request.attributes,
      }),
    });
  }

  /**
   * Get completion suggestions
   */
  async suggestCompletion(request: AISuggestionRequest): Promise<CompletionSuggestion[]> {
    return this.request<CompletionSuggestion[]>('/suggest-completion', {
      method: 'POST',
      body: JSON.stringify({
        category: request.category,
        categoryId: request.categoryId,
        attributes: request.attributes,
        currentData: request.currentData,
      }),
    });
  }

  /**
   * Generate complete listing with AI
   */
  async generateCompleteListing(request: AISuggestionRequest): Promise<{
    title: string;
    description: string;
    price: number;
    attributes: Record<string, any>;
  }> {
    // Use same parameters for consistency
    const titleRequest = {
      category: request.category,
      categoryId: request.categoryId,
      attributes: request.attributes,
      currentTitle: request.currentTitle,
      userInput: request.userInput,
    };
    
    const descriptionRequest = {
      category: request.category,
      categoryId: request.categoryId,
      attributes: request.attributes,
      currentDescription: request.currentDescription,
      userInput: request.userInput,
    };
    
    const [titleSuggestions, description, attributeSuggestions] = await Promise.all([
      this.suggestTitle(titleRequest),
      this.suggestDescription(descriptionRequest),
      request.userInput ? this.suggestAttributes(request) : Promise.resolve([]),
    ]);

    // Build attributes from suggestions
    const attributes: Record<string, any> = { ...request.attributes };
    for (const suggestion of attributeSuggestions) {
      if (suggestion.confidence > 0.7) {
        attributes[suggestion.key] = suggestion.value;
      }
    }

    return {
      title: titleSuggestions[0]?.title || '',
      description,
      price: 0, // Bütçe önerisi kaldırıldı - kullanıcı kendisi girecek
      attributes,
    };
  }
}

export const listingAIService = new ListingAIServiceClient();

