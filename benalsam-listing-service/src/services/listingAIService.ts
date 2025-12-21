/**
 * Listing AI Service
 * 
 * @fileoverview Rule-based AI service for listing suggestions
 * @author Benalsam Team
 * @version 1.0.0
 */

import { logger } from '../config/logger';
import { listingService } from './listingService';
import { categoryRules } from './ai/categoryRules';
import { templates } from './ai/templates';
import { keywordMatcher } from './ai/keywordMatcher';
import { AttributeSuggestion } from './ai/types';
import { learningService } from './ai/learningService';

export interface AISuggestionRequest {
  category: string;
  categoryId?: string;
  attributes?: Record<string, any>;
  userInput?: string;
  currentTitle?: string;
  currentDescription?: string;
}

export interface TitleSuggestion {
  title: string;
  score: number;
  reason: string;
}

export interface PriceRange {
  min: number;
  max: number;
  suggested: number;
  confidence: 'low' | 'medium' | 'high';
}

// AttributeSuggestion moved to ./ai/types.ts

export interface CompletionSuggestion {
  field: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export class ListingAIService {
  private static instance: ListingAIService;

  static getInstance(): ListingAIService {
    if (!ListingAIService.instance) {
      ListingAIService.instance = new ListingAIService();
    }
    return ListingAIService.instance;
  }

  /**
   * Normalize category name - remove "Satılık/Alınık" prefixes
   */
  private normalizeCategoryName(category: string): string {
    let normalized = category.trim();
    
    // Remove common prefixes
    const prefixes = ['satılık', 'alınık', 'kiralık', 'satilik', 'alinik', 'kiralik'];
    for (const prefix of prefixes) {
      if (normalized.toLowerCase().startsWith(prefix)) {
        normalized = normalized.substring(prefix.length).trim();
        break;
      }
    }
    
    return normalized || category; // Fallback to original if empty
  }

  /**
   * Check if category is a service category (not a product)
   * Hizmet kategorileri: tamir, bakım, elektrikçi, tesisatçı, boyacı, marangoz, vb.
   */
  private isServiceCategory(category: string): boolean {
    const categoryLower = category.toLowerCase();
    
    // Hizmet kategorisi anahtar kelimeleri
    const serviceKeywords = [
      'hizmet', 'service', 'tamir', 'repair', 'bakım', 'maintenance',
      'elektrikçi', 'electrician', 'tesisatçı', 'plumber', 'boyacı', 'painter',
      'marangoz', 'carpenter', 'usta', 'master', 'teknisyen', 'technician',
      'montaj', 'assembly', 'kurulum', 'installation', 'temizlik', 'cleaning',
      'nakliye', 'transport', 'taşıma', 'moving', 'dizayn', 'design',
      'mimarlık', 'architecture', 'mühendislik', 'engineering', 'danışmanlık', 'consulting',
      'eğitim', 'education', 'öğretmen', 'teacher', 'doktor', 'doctor',
      'avukat', 'lawyer', 'muhasebeci', 'accountant', 'fotoğrafçı', 'photographer',
      'kuaför', 'hairdresser', 'berber', 'barber', 'masaj', 'massage',
      'fitness', 'antrenör', 'trainer', 'koç', 'coach', 'terapi', 'therapy'
    ];
    
    // Kategori adında hizmet anahtar kelimesi var mı kontrol et
    for (const keyword of serviceKeywords) {
      if (categoryLower.includes(keyword)) {
        return true;
      }
    }
    
    // Kategori yolu "Hizmetler" içeriyorsa
    if (categoryLower.includes('hizmetler') || categoryLower.includes('services')) {
      return true;
    }
    
    return false;
  }

  /**
   * Suggest title based on category and attributes
   */
  async suggestTitle(request: AISuggestionRequest): Promise<TitleSuggestion[]> {
    try {
      const { category, attributes = {}, currentTitle, userInput } = request;
      
      // Normalize category name
      const normalizedCategory = this.normalizeCategoryName(category);
      
      logger.info('🤖 AI: Suggesting titles', { 
        originalCategory: category, 
        normalizedCategory, 
        attributes 
      });

      const suggestions: TitleSuggestion[] = [];
      
      // Prepare enriched attributes (will be used throughout)
      let enrichedAttributes = { ...attributes };
      
      // 1. Try to extract info from userInput if provided (PRIORITY)
      if (userInput && userInput.length > 3) {
        const extractedAttributes = this.extractAttributesFromText(userInput);
        enrichedAttributes = { ...attributes, ...extractedAttributes };
        
        // Generate suggestions with enriched attributes - higher priority
        const rules = categoryRules.getRules(normalizedCategory);
        if (rules && rules.titlePatterns) {
          for (const pattern of rules.titlePatterns) {
            // Add normalized category to attributes for template filling
            const enrichedWithCategory = { ...enrichedAttributes, category: normalizedCategory };
            const title = this.fillTemplate(pattern, enrichedWithCategory);
            if (title && title.trim().length > 5 && title !== currentTitle && !title.match(/^[\s{}]+$/)) {
              suggestions.push({
                title: title.trim(),
                score: this.calculateTitleScore(title, enrichedAttributes, normalizedCategory) + 20, // Higher bonus for user input
                reason: 'Kullanıcı girdisinden çıkarılan bilgilere göre oluşturuldu'
              });
            }
          }
        }
        
        // Also try to create a title directly from user input if it's descriptive
        if (userInput.length > 10 && userInput.length < 100) {
          // Check if user input already looks like a title
          const cleanInput = userInput.trim();
          if (!cleanInput.toLowerCase().includes('arıyorum') && !cleanInput.toLowerCase().includes('istiyorum')) {
            // Add "Arıyorum" if not present
            suggestions.push({
              title: `${cleanInput} Arıyorum`,
              score: 85,
              reason: 'Kullanıcı girdisine göre oluşturuldu'
            });
          } else if (cleanInput.length > 5) {
            // Use as-is if it already has "Arıyorum"
            suggestions.push({
              title: cleanInput,
              score: 90,
              reason: 'Kullanıcı girdisi kullanıldı'
            });
          }
        }
      }

      // 2. Use category-specific rules with existing attributes
      const rules = categoryRules.getRules(normalizedCategory);
      if (rules && rules.titlePatterns) {
        for (const pattern of rules.titlePatterns) {
          // Add normalized category to attributes for template filling
          const attributesWithCategory = { ...attributes, category: normalizedCategory };
          const title = this.fillTemplate(pattern, attributesWithCategory);
          // Better validation - check for meaningful content
          const cleanTitle = title.trim();
          if (cleanTitle && 
              cleanTitle.length > 3 && 
              cleanTitle !== currentTitle && 
              !cleanTitle.match(/^[\s{}:]+$/) &&
              !cleanTitle.match(/^:\s*}$/) &&
              cleanTitle !== category &&
              cleanTitle !== normalizedCategory) {
            suggestions.push({
              title: cleanTitle,
              score: this.calculateTitleScore(cleanTitle, attributes, normalizedCategory),
              reason: 'Kategori kurallarına göre oluşturuldu'
            });
          }
        }
      }

      // 3. Learn from persistent learned patterns (Redis + DB)
      const learnedPatterns = await learningService.getLearnedPatterns(normalizedCategory);
      if (learnedPatterns && learnedPatterns.titlePatterns.length > 0) {
        for (const learnedPattern of learnedPatterns.titlePatterns.slice(0, 3)) {
          // Adapt the learned pattern to current attributes
          const adaptedTitle = this.adaptTitleFromSimilar(learnedPattern.pattern, enrichedAttributes, normalizedCategory);
          if (adaptedTitle && adaptedTitle !== currentTitle && adaptedTitle.length > 5) {
            suggestions.push({
              title: adaptedTitle,
              score: Math.floor(learnedPattern.score * 0.8), // Slightly lower than original
              reason: `Öğrenilmiş başarılı pattern (${Math.floor(learnedPattern.successRate)}% başarı oranı)`
            });
          }
        }
      }

      // 4. Learn from similar successful listings (real-time fallback)
      const similarListings = await this.findSimilarListings(normalizedCategory, enrichedAttributes);
      if (similarListings.length > 0) {
        const learned = this.learnFromSimilarListings(similarListings, normalizedCategory, enrichedAttributes);
        
        // Use learned title patterns (only if no persistent patterns found)
        if (!learnedPatterns || learnedPatterns.titlePatterns.length === 0) {
          for (const pattern of learned.titlePatterns.slice(0, 3)) {
            // Adapt the pattern to current attributes
            const adaptedTitle = this.adaptTitleFromSimilar(pattern, enrichedAttributes, normalizedCategory);
            if (adaptedTitle && adaptedTitle !== currentTitle && adaptedTitle.length > 5) {
              suggestions.push({
                title: adaptedTitle,
                score: 75,
                reason: 'Benzer başarılı ilanlardan öğrenildi'
              });
            }
          }
        }
      }

      // 4. Generate smart defaults based on category name
      const categoryBasedSuggestions = this.generateCategoryBasedTitles(normalizedCategory, attributes);
      suggestions.push(...categoryBasedSuggestions);

      // 5. If still no good suggestions, use fallback
      if (suggestions.length === 0) {
        return this.getDefaultTitleSuggestions(attributes, normalizedCategory);
      }

      // Remove duplicates and sort by score
      const uniqueSuggestions = Array.from(
        new Map(suggestions.map(s => [s.title, s])).values()
      );

      return uniqueSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      logger.error('❌ AI: Error suggesting titles', error);
      const normalizedCategory = this.normalizeCategoryName(request.category);
      return this.getDefaultTitleSuggestions(request.attributes || {}, normalizedCategory);
    }
  }

  /**
   * Suggest description based on category and attributes
   */
  async suggestDescription(request: AISuggestionRequest): Promise<string> {
    try {
      const { category, attributes = {}, userInput } = request;
      
      // Normalize category name
      const normalizedCategory = this.normalizeCategoryName(category);
      
      logger.info('🤖 AI: Suggesting description', { 
        originalCategory: category, 
        normalizedCategory, 
        attributes 
      });

      // 1. Try to extract info from userInput if provided (PRIORITY)
      let enrichedAttributes = { ...attributes };
      if (userInput && userInput.length > 3) {
        const extracted = this.extractAttributesFromText(userInput);
        enrichedAttributes = { ...enrichedAttributes, ...extracted };
        
        // If user input is descriptive and long enough, use it as base
        if (userInput.length > 50 && userInput.length < 500) {
          // User might have written a description already
          const cleanInput = userInput.trim();
          // Check if it's already a good description
          if (cleanInput.split('.').length >= 2) {
            // It has multiple sentences, might be a description
            return cleanInput; // Return user input as description
          }
        }
      }

      // 2. Learn from persistent learned patterns (Redis + DB)
      const learnedPatterns = await learningService.getLearnedPatterns(normalizedCategory);
      const learned = learnedPatterns 
        ? {
            titlePatterns: learnedPatterns.titlePatterns.map(p => p.pattern),
            descriptionHints: learnedPatterns.descriptionHints.map(p => p.pattern)
          }
        : { titlePatterns: [], descriptionHints: [] };

      // Fallback to real-time learning if no persistent patterns
      if (learned.descriptionHints.length === 0) {
        const similarListings = await this.findSimilarListings(normalizedCategory, enrichedAttributes);
        if (similarListings.length > 0) {
          const realtimeLearned = this.learnFromSimilarListings(similarListings, normalizedCategory, enrichedAttributes);
          learned.descriptionHints = realtimeLearned.descriptionHints;
        }
      }

      // 3. Get category-specific template
      const template = templates.getDescriptionTemplate(normalizedCategory);
      if (!template) {
        return this.generateSmartDescription(normalizedCategory, enrichedAttributes, learned.descriptionHints);
      }

      // 4. Fill template with attributes
      let description = this.fillTemplate(template, enrichedAttributes);
      
      // 5. Enhance with learned hints if template is too generic
      if (description.length < 50 && learned.descriptionHints.length > 0) {
        const hint = learned.descriptionHints[0];
        if (hint) {
          // Adapt hint to current context
          const adaptedHint = this.adaptDescriptionHint(hint, enrichedAttributes, normalizedCategory);
          if (adaptedHint) {
            description = `${description}\n\n${adaptedHint}`;
          }
        }
      }
      
      // 6. Clean up the description
      description = description
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Remove lines that are just placeholders or empty
          return line.length > 0 && 
                 !line.match(/^[\s{}:]+$/) && 
                 !line.match(/^:\s*}$/) &&
                 !line.match(/^}\s*:$/) &&
                 !line.match(/^[:\s]+$/);
        })
        .join('\n\n');
      
      // 7. If template didn't produce good content, generate smart description
      if (!description || description.trim().length < 15 || description.match(/^[\s{}:]+$/)) {
        description = this.generateSmartDescription(normalizedCategory, enrichedAttributes, learned.descriptionHints);
      }

      // Final fallback - ensure we always return something
      if (!description || description.trim().length < 10) {
        description = this.generateSmartDescription(normalizedCategory, enrichedAttributes, learned.descriptionHints);
      }

      return description;
    } catch (error) {
      logger.error('❌ AI: Error suggesting description', error);
      const normalizedCategory = this.normalizeCategoryName(request.category);
      return this.generateSmartDescription(normalizedCategory, request.attributes || {});
    }
  }

  /**
   * Adapt title from similar listing
   */
  private adaptTitleFromSimilar(similarTitle: string, attributes: Record<string, any>, category: string): string {
    let adapted = similarTitle;
    const isService = this.isServiceCategory(category);
    
    // For service categories, replace service type
    if (isService && attributes['service_type']) {
      // Try to replace service type in the title
      const serviceKeywords = ['tamirci', 'elektrikçi', 'tesisatçı', 'boyacı', 'marangoz', 'temizlik', 'nakliye'];
      for (const keyword of serviceKeywords) {
        if (adapted.toLowerCase().includes(keyword)) {
          adapted = adapted.replace(new RegExp(keyword, 'gi'), attributes['service_type']);
          break;
        }
      }
    } else {
      // For product categories, replace brand/model if we have different ones
      if (attributes['brand']) {
        adapted = adapted.replace(/\b[A-Z][a-z]+\b/g, (match) => {
          // Try to replace with our brand if it's a brand name
          if (match.length > 2 && match.length < 20) {
            return attributes['brand'];
          }
          return match;
        });
      }
    }
    
    // Ensure it ends with "Arıyorum" or "İstiyorum"
    if (!adapted.toLowerCase().includes('arıyorum') && !adapted.toLowerCase().includes('istiyorum')) {
      adapted = `${adapted} Arıyorum`;
    }
    
    return adapted;
  }

  /**
   * Adapt description hint from similar listing
   */
  private adaptDescriptionHint(hint: string, attributes: Record<string, any>, category: string): string {
    let adapted = hint;
    const isService = this.isServiceCategory(category);
    
    // For service categories, replace service-related terms
    if (isService) {
      // Replace "ürün" with "hizmet"
      adapted = adapted.replace(/ürün/gi, 'hizmet');
      adapted = adapted.replace(/product/gi, 'service');
      
      // Replace service type if we have one
      if (attributes['service_type']) {
        const serviceKeywords = ['tamirci', 'elektrikçi', 'tesisatçı', 'boyacı', 'marangoz'];
        for (const keyword of serviceKeywords) {
          if (adapted.toLowerCase().includes(keyword)) {
            adapted = adapted.replace(new RegExp(keyword, 'gi'), attributes['service_type']);
            break;
          }
        }
      }
    } else {
      // For product categories, replace brand/model if we have different ones
      if (attributes['brand']) {
        adapted = adapted.replace(/\b[A-Z][a-z]+\b/g, (match) => {
          if (match === attributes['brand']) {
            return attributes['brand'];
          }
          return match;
        });
      }
    }
    
    // Ensure it's in "wanted" format
    if (adapted.toLowerCase().includes('satıyorum') || adapted.toLowerCase().includes('satılık')) {
      adapted = adapted.replace(/satıyorum/gi, 'arıyorum');
      adapted = adapted.replace(/satılık/gi, 'alınık');
    }
    
    return adapted;
  }

  /**
   * Generate smart description based on category and attributes
   * IMPORTANT: Benalsam is a "WANTED" listing platform - users want to BUY, not SELL
   */
  private generateSmartDescription(category: string, attributes: Record<string, any>, learnedHints: string[] = []): string {
    const parts: string[] = [];
    const categoryLower = category.toLowerCase();

    // Check if this is a service category
    const isService = this.isServiceCategory(category);
    
    // Category-specific intro - WANTED format (more natural Turkish)
    // Hizmet kategorileri için özel mantık
    if (isService) {
      // Hizmet kategorileri için özel açıklama
      const serviceType = this.extractServiceType(category, attributes);
      parts.push(`Merhaba, ${serviceType} hizmeti arıyorum.`);
      
      if (attributes['service_type']) {
        parts.push(`${attributes['service_type']} konusunda deneyimli bir ${serviceType} tercih ediyorum.`);
      }
      
      if (attributes['location']) {
        parts.push(`Konum olarak ${attributes['location']} bölgesinde hizmet vermesini istiyorum.`);
      }
      
      if (attributes['availability']) {
        const availabilityText = this.getAvailabilityText(attributes['availability']);
        if (availabilityText) {
          parts.push(availabilityText);
        }
      }
      
      if (attributes['experience_years']) {
        parts.push(`En az ${attributes['experience_years']} yıl deneyimli olmasını tercih ediyorum.`);
      }
      
      if (attributes['certification'] && Array.isArray(attributes['certification']) && attributes['certification'].length > 0) {
        parts.push(`Sertifikalı ve belgeli olmasını istiyorum.`);
      }
      
      if (attributes['location_type']) {
        const locationTypeText = this.getLocationTypeText(attributes['location_type']);
        if (locationTypeText) {
          parts.push(locationTypeText);
        }
      }
      
      parts.push('Profesyonel, güvenilir ve kaliteli hizmet bekliyorum.');
    } else if (categoryLower.includes('daire') || categoryLower.includes('emlak')) {
      parts.push(`Merhaba, ${attributes['roomCount'] ? attributes['roomCount'] + '+1 oda' : 'daire'} arıyorum.`);
      if (attributes['area']) {
        parts.push(`Yaklaşık ${attributes['area']} m² civarında bir daire tercih ediyorum.`);
      }
      if (attributes['location']) {
        parts.push(`Konum olarak ${attributes['location']} bölgesinde olmasını istiyorum.`);
      }
      if (attributes['floor']) {
        parts.push(`${attributes['floor']}. kat veya üzeri olmasını tercih ediyorum.`);
      }
      if (attributes['hasBalcony']) {
        parts.push('Balkonlu olmasını istiyorum.');
      }
      if (attributes['hasElevator']) {
        parts.push('Asansörlü olmasını tercih ediyorum.');
      }
    } else if (categoryLower.includes('masaüstü') || categoryLower.includes('bilgisayar')) {
      parts.push('Merhaba, masaüstü bilgisayar arıyorum.');
      if (attributes['brand']) {
        parts.push(`${attributes['brand']} marka tercih ediyorum.`);
      }
      if (attributes['model']) {
        parts.push(`Özellikle ${attributes['model']} modelini arıyorum.`);
      }
      if (attributes['processor']) {
        parts.push(`${attributes['processor']} işlemcili olmasını istiyorum.`);
      }
      if (attributes['ram']) {
        parts.push(`En az ${attributes['ram']} RAM olmalı.`);
      }
      if (attributes['storage']) {
        parts.push(`${attributes['storage']} depolama alanı olmasını tercih ediyorum.`);
      }
      parts.push('Çalışır durumda ve test edilmiş olmasını istiyorum.');
    } else if (categoryLower.includes('telefon')) {
      parts.push('Merhaba, akıllı telefon arıyorum.');
      if (attributes['brand']) {
        parts.push(`${attributes['brand']} marka tercih ediyorum.`);
      }
      if (attributes['model']) {
        parts.push(`Özellikle ${attributes['model']} modelini arıyorum.`);
      }
      if (attributes['storage']) {
        parts.push(`En az ${attributes['storage']} depolama kapasitesi olmalı.`);
      }
      if (attributes['ram']) {
        parts.push(`${attributes['ram']} RAM veya üzeri olmasını tercih ediyorum.`);
      }
      if (attributes['color']) {
        parts.push(`Renk olarak ${attributes['color']} tercih ediyorum.`);
      }
      parts.push('Kutusu ve aksesuarları ile birlikte olmasını istiyorum.');
    } else if (categoryLower.includes('laptop')) {
      parts.push('Merhaba, laptop arıyorum.');
      if (attributes['brand']) {
        parts.push(`${attributes['brand']} marka tercih ediyorum.`);
      }
      if (attributes['model']) {
        parts.push(`Özellikle ${attributes['model']} modelini arıyorum.`);
      }
      if (attributes['ram']) {
        parts.push(`En az ${attributes['ram']} RAM olmalı.`);
      }
      if (attributes['storage']) {
        parts.push(`${attributes['storage']} depolama alanı olmasını tercih ediyorum.`);
      }
      if (attributes['screenSize']) {
        parts.push(`Ekran boyutu ${attributes['screenSize']} civarında olmalı.`);
      }
    } else if (categoryLower.includes('gitar') || categoryLower.includes('müzik')) {
      parts.push(`Merhaba, ${category} arıyorum.`);
      if (attributes['brand']) {
        parts.push(`${attributes['brand']} marka tercih ediyorum.`);
      }
      if (attributes['model']) {
        parts.push(`Özellikle ${attributes['model']} modelini arıyorum.`);
      }
      if (attributes['color']) {
        parts.push(`Renk olarak ${attributes['color']} tercih ediyorum.`);
      }
    } else {
      parts.push(`Merhaba, ${category} arıyorum.`);
      if (attributes['brand']) {
        parts.push(`${attributes['brand']} marka tercih ediyorum.`);
      }
      if (attributes['model']) {
        parts.push(`Özellikle ${attributes['model']} modelini arıyorum.`);
      }
    }

    // Add attributes in WANTED format (more natural)
    // Hizmet kategorileri için "ürün" yerine "hizmet" kullan
    if (!isService) {
      if (attributes['condition']) {
        parts.push(`Ürünün ${attributes['condition']} durumda olmasını istiyorum.`);
      }
      if (attributes['year']) {
        parts.push(`${attributes['year']} model veya daha yeni olmasını tercih ediyorum.`);
      }
    }

    // Use learned hints if available and we don't have much content
    if (parts.length < 3 && learnedHints.length > 0) {
      const hint = learnedHints[0];
      if (hint) {
        const adaptedHint = this.adaptDescriptionHint(hint, attributes, category);
        if (adaptedHint && !parts.some(p => p.includes(adaptedHint.substring(0, 20)))) {
          parts.push(adaptedHint);
        }
      }
    }

    // Ensure we have at least some content
    if (parts.length === 0) {
      if (isService) {
        parts.push(`Merhaba, ${category} hizmeti arıyorum.`);
        parts.push('Profesyonel, güvenilir ve kaliteli hizmet bekliyorum.');
      } else {
        parts.push(`Merhaba, ${category} arıyorum.`);
        parts.push('Uygun fiyatlı ve kaliteli bir ürün tercih ediyorum.');
      }
    }

    // Always end with a friendly closing
    if (isService) {
      parts.push('Detaylı bilgi, fiyat teklifi ve referanslarınızı bekliyorum.');
    } else {
      parts.push('Detaylı bilgi ve tekliflerinizi bekliyorum.');
    }

    return parts.join('\n\n');
  }

  /**
   * Extract service type from category name
   */
  private extractServiceType(category: string, attributes: Record<string, any>): string {
    const categoryLower = category.toLowerCase();
    
    // Önce attributes'dan service_type varsa onu kullan
    if (attributes['service_type']) {
      return attributes['service_type'];
    }
    
    // Kategori adından hizmet tipini çıkar
    if (categoryLower.includes('tamir') || categoryLower.includes('repair')) {
      return 'tamirci';
    }
    if (categoryLower.includes('elektrikçi') || categoryLower.includes('electrician')) {
      return 'elektrikçi';
    }
    if (categoryLower.includes('tesisatçı') || categoryLower.includes('plumber')) {
      return 'tesisatçı';
    }
    if (categoryLower.includes('boyacı') || categoryLower.includes('painter')) {
      return 'boyacı';
    }
    if (categoryLower.includes('marangoz') || categoryLower.includes('carpenter')) {
      return 'marangoz';
    }
    if (categoryLower.includes('temizlik') || categoryLower.includes('cleaning')) {
      return 'temizlik hizmeti';
    }
    if (categoryLower.includes('nakliye') || categoryLower.includes('transport')) {
      return 'nakliye hizmeti';
    }
    if (categoryLower.includes('kuaför') || categoryLower.includes('hairdresser')) {
      return 'kuaför';
    }
    if (categoryLower.includes('masaj') || categoryLower.includes('massage')) {
      return 'masaj terapisti';
    }
    
    // Genel hizmet kategorisi
    const normalized = this.normalizeCategoryName(category);
    return normalized || 'hizmet';
  }

  /**
   * Get availability text in Turkish
   */
  private getAvailabilityText(availability: string): string | null {
    const availabilityMap: Record<string, string> = {
      'immediate': 'Mümkün olan en kısa sürede hizmet vermesini istiyorum.',
      'within_week': 'Bu hafta içinde hizmet vermesini tercih ediyorum.',
      'within_month': 'Bu ay içinde hizmet vermesini istiyorum.',
      'flexible': 'Tarih konusunda esnekim.'
    };
    
    return availabilityMap[availability] || null;
  }

  /**
   * Get location type text in Turkish
   */
  private getLocationTypeText(locationType: string): string | null {
    const locationTypeMap: Record<string, string> = {
      'on_site': 'Yerinde hizmet vermesini istiyorum.',
      'remote': 'Uzaktan hizmet vermesini tercih ediyorum.',
      'hybrid': 'Yerinde veya uzaktan hizmet verebilir.'
    };
    
    return locationTypeMap[locationType] || null;
  }

  /**
   * Suggest attributes based on user input
   */
  async suggestAttributes(request: AISuggestionRequest): Promise<AttributeSuggestion[]> {
    try {
      const { category, userInput = '', attributes = {} } = request;
      
      // Normalize category name
      const normalizedCategory = this.normalizeCategoryName(category);
      
      logger.info('🤖 AI: Suggesting attributes', { 
        originalCategory: category, 
        normalizedCategory, 
        userInput 
      });

      if (!userInput || userInput.length < 2) {
        return [];
      }

      const suggestions: AttributeSuggestion[] = [];
      
      // Extract brand
      const brand = keywordMatcher.extractBrand(userInput);
      if (brand && !attributes['brand']) {
        suggestions.push({
          key: 'brand',
          value: brand,
          confidence: 0.9,
          reason: `Metinden "${brand}" markası tespit edildi`
        });
      }

      // Extract model
      if (brand) {
        const model = keywordMatcher.extractModel(userInput, brand);
        if (model && !attributes['model']) {
          suggestions.push({
            key: 'model',
            value: model,
            confidence: 0.8,
            reason: `"${brand}" için "${model}" modeli öneriliyor`
          });
        }
      }

      // Extract price
      const price = keywordMatcher.extractPrice(userInput);
      if (price && !attributes['price']) {
        suggestions.push({
          key: 'price',
          value: price,
          confidence: 0.7,
          reason: `Metinden fiyat bilgisi çıkarıldı: ${price} TL`
        });
      }

      // Category-specific attribute suggestions
      const rules = categoryRules.getRules(normalizedCategory);
      if (rules && rules.attributeSuggestions) {
        for (const suggestion of rules.attributeSuggestions(userInput, attributes)) {
          suggestions.push(suggestion);
        }
      }

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('❌ AI: Error suggesting attributes', error);
      return [];
    }
  }

  /**
   * Suggest price range based on category and attributes
   */
  async suggestPrice(request: AISuggestionRequest): Promise<PriceRange> {
    try {
      const { category, attributes = {} } = request;
      
      // Normalize category name
      const normalizedCategory = this.normalizeCategoryName(category);
      
      logger.info('🤖 AI: Suggesting price', { 
        originalCategory: category, 
        normalizedCategory, 
        attributes 
      });

      // Get category price range
      const categoryRange = categoryRules.getPriceRange(normalizedCategory);
      
      // Try to find similar listings
      const similarListings = await this.findSimilarListings(normalizedCategory, attributes);
      
      if (similarListings.length > 0) {
        const prices = similarListings
          .map(l => l.budget || 0)
          .filter(p => p > 0)
          .sort((a, b) => a - b);
        
        if (prices.length > 0) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const median = prices[Math.floor(prices.length / 2)] || 0;

          return {
            min: Math.max(min * 0.8, categoryRange.min),
            max: Math.min(max * 1.2, categoryRange.max),
            suggested: median,
            confidence: prices.length >= 5 ? 'high' : prices.length >= 3 ? 'medium' : 'low'
          };
        }
      }

      // Fallback to category default
      return {
        min: categoryRange.min,
        max: categoryRange.max,
        suggested: (categoryRange.min + categoryRange.max) / 2,
        confidence: 'low'
      };
    } catch (error) {
      logger.error('❌ AI: Error suggesting price', error);
      const normalizedCategory = this.normalizeCategoryName(request.category);
      const categoryRange = categoryRules.getPriceRange(normalizedCategory);
      return {
        min: categoryRange.min,
        max: categoryRange.max,
        suggested: (categoryRange.min + categoryRange.max) / 2,
        confidence: 'low'
      };
    }
  }

  /**
   * Get completion suggestions for current listing data
   */
  async suggestCompletion(request: AISuggestionRequest & {
    currentData: Partial<{
      title: string;
      description: string;
      budget: number;
      attributes: Record<string, any>;
    }>;
  }): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];
    const { currentData, category, attributes = {} } = request;

    // Normalize category name
    const normalizedCategory = this.normalizeCategoryName(category);

      // Check missing title
      if (!currentData.title || currentData.title.length < 5) {
        const titleSuggestions = await this.suggestTitle({ 
          category: normalizedCategory, 
          attributes 
        });
        if (titleSuggestions.length > 0 && titleSuggestions[0]) {
          suggestions.push({
            field: 'title',
            suggestion: titleSuggestions[0].title,
            priority: 'high'
          });
        }
      }

    // Check missing description
    if (!currentData.description || currentData.description.length < 20) {
      const description = await this.suggestDescription({ 
        category: normalizedCategory, 
        attributes 
      });
      suggestions.push({
        field: 'description',
        suggestion: description,
        priority: 'high'
      });
    }

    // Check missing price
    if (!currentData.budget || currentData.budget === 0) {
      const priceRange = await this.suggestPrice({ 
        category: normalizedCategory, 
        attributes 
      });
      if (priceRange?.suggested) {
        suggestions.push({
          field: 'budget',
          suggestion: `${priceRange.suggested.toLocaleString('tr-TR')} TL öneriliyor`,
          priority: 'medium'
        });
      }
    }

    // Check required attributes
    const rules = categoryRules.getRules(normalizedCategory);
    if (rules && rules.requiredAttributes) {
      for (const requiredAttr of rules.requiredAttributes) {
        if (!attributes[requiredAttr]) {
          suggestions.push({
            field: `attributes.${requiredAttr}`,
            suggestion: `${requiredAttr} bilgisi eksik`,
            priority: 'medium'
          });
        }
      }
    }

    return suggestions;
  }

  // Helper methods

  private fillTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    
    // First, handle conditional expressions {key ? value : fallback}
    // This regex matches: {key ? value : fallback}
    result = result.replace(/\{([^}]+)\s*\?\s*([^:]+):\s*([^}]+)\}/g, (_match, key, trueValue, falseValue) => {
      const trimmedKey = key.trim();
      const value = data[trimmedKey];
      return value ? trueValue.trim() : falseValue.trim();
    });
    
    // Replace {key} with values
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        result = result.replace(regex, String(value));
      }
    }
    
    // Remove remaining {key} placeholders (empty ones)
    result = result.replace(/\{[^}]+\}/g, '');

    // Clean up extra spaces, empty lines, and weird characters
    result = result
      .replace(/:\s*}/g, '')  // Remove ": }" patterns FIRST
      .replace(/}\s*:/g, '')  // Remove "}: " patterns
      .replace(/\{[^}]+\}/g, '')  // Remove any remaining {key} placeholders
      .replace(/\s+/g, ' ')  // Multiple spaces to single space
      .replace(/\s*-\s*/g, ' - ')  // Clean up dashes
      .replace(/:\s*:\s*/g, ': ')  // Remove "::" patterns
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Multiple newlines to double
      .replace(/^\s*:\s*$/gm, '')  // Remove lines that are just ":"
      .replace(/^\s*}\s*$/gm, '')  // Remove lines that are just "}"
      .trim();

    // Final check - if result is mostly empty, return empty string
    if (result.length < 3 || result.match(/^[\s{}:]+$/)) {
      return '';
    }

    return result;
  }

  private calculateTitleScore(title: string, attributes: Record<string, any>, category?: string): number {
    let score = 50; // Base score
    const isService = category ? this.isServiceCategory(category) : false;

    // "Arıyorum" kelimesi net olmalı
    if (title.toLowerCase().includes('arıyorum')) {
      score += 10;
    }

    // Longer titles get higher score (but not too long) - spesifiklik için
    if (title.length >= 15 && title.length <= 70) {
      score += 15;
    } else if (title.length >= 20 && title.length <= 60) {
      score += 25; // Optimal length
    }

    // For service categories, prioritize service-specific attributes
    if (isService) {
      // Titles with service_type get higher score
      if (attributes['service_type'] && title.toLowerCase().includes(String(attributes['service_type']).toLowerCase())) {
        score += 20;
      }
      
      // Titles with location get higher score (important for services)
      if (attributes['location'] && title.toLowerCase().includes(String(attributes['location']).toLowerCase())) {
        score += 15;
      }
      
      // Bonus for "hizmet" or "hizmeti" keywords
      if (title.toLowerCase().includes('hizmet') || title.toLowerCase().includes('hizmeti')) {
        score += 10;
      }
    } else {
      // For product categories, prioritize product-specific attributes
      // Titles with brand get higher score
      if (attributes['brand'] && title.toLowerCase().includes(String(attributes['brand']).toLowerCase())) {
        score += 15;
      }

      // Titles with model get higher score
      if (attributes['model'] && title.toLowerCase().includes(String(attributes['model']).toLowerCase())) {
        score += 15;
      }

      // Bonus for specific attributes in title
      if (attributes['storage'] && title.toLowerCase().includes(String(attributes['storage']).toLowerCase())) {
        score += 10;
      }
      if (attributes['roomCount'] && title.toLowerCase().includes(String(attributes['roomCount']).toLowerCase())) {
        score += 10;
      }
      if (attributes['area'] && title.toLowerCase().includes(String(attributes['area']).toLowerCase())) {
        score += 10;
      }
      if (attributes['color'] && title.toLowerCase().includes(String(attributes['color']).toLowerCase())) {
        score += 8;
      }
      if (attributes['ram'] && title.toLowerCase().includes(String(attributes['ram']).toLowerCase())) {
        score += 8;
      }
    }

    return Math.min(score, 100);
  }

  private async findSimilarListings(category: string, attributes: Record<string, any>) {
    try {
      // Get similar listings from database - prioritize successful ones
      const filters = {
        page: 1,
        limit: 20, // Get more to filter better
        category,
        status: 'active'
      };

      const result = await listingService.getListings(filters);
      
      if (!result.listings || result.listings.length === 0) {
        return [];
      }
      
      // Filter by similar attributes and score them
      const scoredListings = result.listings
        .filter(listing => {
          if (!listing.attributes) return false;
          
          // Must have title and description
          if (!listing.title || !listing.description) return false;
          
          return true;
        })
        .map(listing => {
          let score = 0;
          
          // Brand match
          if (attributes['brand'] && listing.attributes?.['brand']) {
            if (listing.attributes['brand'] === attributes['brand']) {
              score += 30;
            }
          }
          
          // Model match
          if (attributes['model'] && listing.attributes?.['model']) {
            if (listing.attributes['model'] === attributes['model']) {
              score += 20;
            }
          }
          
          // Category match (already filtered, but bonus)
          if (listing.category === category) {
            score += 10;
          }
          
          // Prefer listings with more views (popular = successful)
          // Note: view_count might not exist in Listing type, check safely
          const viewCount = (listing as any).view_count || (listing as any).viewCount || 0;
          if (viewCount > 10) {
            score += 5;
          }
          
          return { listing, score };
        })
        .filter(item => item.score > 0) // Only keep relevant ones
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // Top 10 most similar
        .map(item => item.listing);
      
      return scoredListings;
    } catch (error) {
      logger.error('❌ AI: Error finding similar listings', error);
      return [];
    }
  }

  /**
   * Learn from similar successful listings
   */
  private learnFromSimilarListings(
    similarListings: any[],
    _category: string,
    _attributes: Record<string, any>
  ): { titlePatterns: string[]; descriptionHints: string[] } {
    const titlePatterns: string[] = [];
    const descriptionHints: string[] = [];
    
    if (similarListings.length === 0) {
      return { titlePatterns, descriptionHints };
    }
    
    // Analyze titles
    for (const listing of similarListings.slice(0, 5)) {
      if (listing.title) {
        // Extract common patterns
        const title = listing.title;
        
        // Check if it's a "wanted" format title
        if (title.toLowerCase().includes('arıyorum') || title.toLowerCase().includes('istiyorum')) {
          // Use as inspiration (but don't copy directly)
          titlePatterns.push(title);
        }
      }
      
      // Analyze descriptions for common phrases
      if (listing.description) {
        const desc = listing.description;
        // Extract first sentence as hint
        const firstSentence = desc.split('.')[0];
        if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
          descriptionHints.push(firstSentence.trim());
        }
      }
    }
    
    return { titlePatterns, descriptionHints };
  }

  /**
   * Extract attributes from user input text
   * Enhanced for "WANTED" listings - users describe what they want
   * Also handles service categories
   */
  private extractAttributesFromText(text: string): Record<string, any> {
    const extracted: Record<string, any> = {};
    const lowerText = text.toLowerCase();
    
    // Check if this is a service-related input
    const isServiceInput = this.isServiceCategory(text);
    
    // For service categories, extract service-specific attributes first
    if (isServiceInput) {
      // Extract service type
      const serviceTypes = [
        'tamir', 'repair', 'bakım', 'maintenance', 'elektrikçi', 'electrician',
        'tesisatçı', 'plumber', 'boyacı', 'painter', 'marangoz', 'carpenter',
        'temizlik', 'cleaning', 'nakliye', 'transport', 'kuaför', 'hairdresser',
        'masaj', 'massage', 'fitness', 'antrenör', 'trainer', 'koç', 'coach'
      ];
      
      for (const serviceType of serviceTypes) {
        if (lowerText.includes(serviceType)) {
          extracted['service_type'] = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
          break;
        }
      }
      
      // Extract experience years
      const experienceMatch = text.match(/(\d+)\s*(yıl|year|sene|senelik)/i);
      if (experienceMatch && experienceMatch[1]) {
        extracted['experience_years'] = parseInt(experienceMatch[1]);
      }
      
      // Extract availability
      if (lowerText.includes('acil') || lowerText.includes('hemen') || lowerText.includes('immediate')) {
        extracted['availability'] = 'immediate';
      } else if (lowerText.includes('bu hafta') || lowerText.includes('hafta içi')) {
        extracted['availability'] = 'within_week';
      } else if (lowerText.includes('bu ay') || lowerText.includes('ay içi')) {
        extracted['availability'] = 'within_month';
      } else {
        extracted['availability'] = 'flexible';
      }
      
      // Extract location type
      if (lowerText.includes('uzaktan') || lowerText.includes('remote') || lowerText.includes('online')) {
        extracted['location_type'] = 'remote';
      } else if (lowerText.includes('yerinde') || lowerText.includes('on site') || lowerText.includes('evde')) {
        extracted['location_type'] = 'on_site';
      } else if (lowerText.includes('hibrit') || lowerText.includes('hybrid')) {
        extracted['location_type'] = 'hybrid';
      }
      
      // Extract certification/qualification keywords
      if (lowerText.includes('sertifikalı') || lowerText.includes('belgeli') || lowerText.includes('certified')) {
        extracted['certification'] = ['Sertifikalı'];
      }
      
      // Extract insurance
      if (lowerText.includes('sigortalı') || lowerText.includes('insurance')) {
        extracted['insurance'] = true;
      }
      
      // Extract references
      if (lowerText.includes('referans') || lowerText.includes('reference')) {
        extracted['references'] = true;
      }
    }
    
    // Extract brand (for product categories)
    const brand = keywordMatcher.extractBrand(text);
    if (brand) extracted['brand'] = brand;

    // Extract model (try even without brand for better coverage)
    const model = brand ? keywordMatcher.extractModel(text, brand) : this.extractModelWithoutBrand(text);
    if (model) extracted['model'] = model;

    // Extract year
    const year = keywordMatcher.extractYear(text);
    if (year) extracted['year'] = year;

    // Extract condition - improved
    const condition = keywordMatcher.extractCondition(text);
    if (condition) {
      extracted['condition'] = condition;
    } else {
      // Additional condition detection
      if (lowerText.includes('yeni') || lowerText.includes('sıfır') || lowerText.includes('sıfır ayarında')) {
        extracted['condition'] = 'Sıfır';
      } else if (lowerText.includes('ikinci el') || lowerText.includes('kullanılmış') || lowerText.includes('2.el')) {
        extracted['condition'] = 'İkinci El';
      } else if (lowerText.includes('mükemmel') || lowerText.includes('çok iyi') || lowerText.includes('sıfır gibi')) {
        extracted['condition'] = 'Mükemmel';
      } else if (lowerText.includes('iyi') || lowerText.includes('temiz')) {
        extracted['condition'] = 'İyi';
      }
    }

    // Extract price/budget
    const price = keywordMatcher.extractPrice(text);
    if (price) extracted['price'] = price;

    // Extract room count for real estate - improved
    const roomMatch = text.match(/(\d)\+(\d)|(\d)\s*oda\s*(\d)\s*salon/i);
    if (roomMatch) {
      if (roomMatch[1] && roomMatch[2]) {
        extracted['roomCount'] = `${roomMatch[1]}+${roomMatch[2]}`;
      } else if (roomMatch[3] && roomMatch[4]) {
        extracted['roomCount'] = `${roomMatch[3]}+${roomMatch[4]}`;
      }
    }

    // Extract area for real estate - improved
    const areaMatch = text.match(/(\d+)\s*m[²2]|(\d+)\s*metrekare/i);
    if (areaMatch) {
      extracted['area'] = areaMatch[1] || areaMatch[2];
    }

    // Extract storage for electronics - improved
    const storageMatch = text.match(/(\d+)\s*(GB|gb|TB|tb|gigabyte|terabyte)/i);
    if (storageMatch && storageMatch[1] && storageMatch[2]) {
      extracted['storage'] = `${storageMatch[1]}${storageMatch[2].toUpperCase().replace('GIGABYTE', 'GB').replace('TERABYTE', 'TB')}`;
    }

    // Extract RAM for computers - improved
    const ramMatch = text.match(/(\d+)\s*(GB|gb)\s*RAM|RAM\s*(\d+)\s*(GB|gb)/i);
    if (ramMatch) {
      extracted['ram'] = `${ramMatch[1] || ramMatch[3]}GB`;
    }

    // Extract color - improved
    const colors = ['Siyah', 'Beyaz', 'Mavi', 'Kırmızı', 'Yeşil', 'Mor', 'Altın', 'Gümüş', 'Gri', 'Pembe', 'Turuncu', 'Kahverengi', 'Lacivert', 'Bordo'];
    for (const color of colors) {
      if (lowerText.includes(color.toLowerCase())) {
        extracted['color'] = color;
        break;
      }
    }

    // Extract location hints - improved
    const locationKeywords = ['merkez', 'şehir', 'ilçe', 'mahalle', 'semt', 'bölge', 'kadıköy', 'beşiktaş', 'şişli', 'beyoğlu'];
    for (const keyword of locationKeywords) {
      if (lowerText.includes(keyword)) {
        // Try to extract location name after keyword
        const locationMatch = text.match(new RegExp(`${keyword}\\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)`, 'i'));
        if (locationMatch && locationMatch[1]) {
          extracted['location'] = locationMatch[1];
          break;
        }
        // If keyword itself is a location
        if (['kadıköy', 'beşiktaş', 'şişli', 'beyoğlu'].includes(keyword)) {
          extracted['location'] = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
    }

    // Extract preferences and requirements
    if (lowerText.includes('acil') || lowerText.includes('hızlı') || lowerText.includes('çabuk')) {
      extracted['urgency'] = 'urgent';
    }
    if (lowerText.includes('garantili') || lowerText.includes('garanti')) {
      extracted['hasWarranty'] = true;
    }
    if (lowerText.includes('kutusu') || lowerText.includes('kutu')) {
      extracted['hasBox'] = true;
    }
    if (lowerText.includes('aksesuar') || lowerText.includes('aksesuarları')) {
      extracted['hasAccessories'] = true;
    }
    if (lowerText.includes('şarj') || lowerText.includes('charger')) {
      extracted['hasCharger'] = true;
    }
    if (lowerText.includes('kulaklık') || lowerText.includes('earphone')) {
      extracted['hasEarphones'] = true;
    }

    // Extract features/requirements
    const features: string[] = [];
    const featureKeywords = {
      'balkon': 'Balkonlu',
      'asansör': 'Asansörlü',
      'otopark': 'Otoparklı',
      'eşyalı': 'Eşyalı',
      'güvenlik': 'Güvenlikli',
      'panoramik': 'Panoramik cam tavan',
      'navigasyon': 'Navigasyon sistemi',
      'park sensör': 'Park sensörü',
      'bluetooth': 'Bluetooth',
      'deri döşeme': 'Deri döşeme',
      'gaming': 'Gaming özellikli',
      'oyun': 'Oyun için uygun'
    };

    for (const [keyword, feature] of Object.entries(featureKeywords)) {
      if (lowerText.includes(keyword)) {
        features.push(feature);
      }
    }

    if (features.length > 0) {
      extracted['features'] = features.join(', ');
    }

    // Extract budget hints
    if (lowerText.includes('uygun') || lowerText.includes('ucuz') || lowerText.includes('ekonomik')) {
      extracted['budgetPreference'] = 'low';
    } else if (lowerText.includes('kaliteli') || lowerText.includes('premium') || lowerText.includes('lüks')) {
      extracted['budgetPreference'] = 'high';
    }

    return extracted;
  }

  /**
   * Try to extract model without brand (for cases where brand isn't detected)
   */
  private extractModelWithoutBrand(text: string): string | null {
    // Look for common model patterns
    const modelPatterns = [
      /iPhone\s*(\d+)/i,
      /Galaxy\s*(S|Note|A|Z|Fold)\s*(\d+)/i,
      /MacBook\s*(Pro|Air)/i,
      /(\d+)\s*Series/i, // BMW style
      /(Stratocaster|Telecaster|Les\s*Paul|SG)/i // Guitar models
    ];

    for (const pattern of modelPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return null;
  }

  /**
   * Generate titles based on category name analysis
   * IMPORTANT: Benalsam is a "WANTED" listing platform - users want to BUY, not SELL
   */
  private generateCategoryBasedTitles(category: string | undefined, attributes: Record<string, any>): TitleSuggestion[] {
    const suggestions: TitleSuggestion[] = [];
    if (!category) {
      return suggestions;
    }
    const categoryLower = category.toLowerCase();
    
    // Check if this is a service category
    const isService = this.isServiceCategory(category);

    // Analyze category for keywords
    const keywords: string[] = [];
    if (categoryLower.includes('masaüstü') || categoryLower.includes('desktop')) keywords.push('Masaüstü Bilgisayar');
    if (categoryLower.includes('laptop') || categoryLower.includes('notebook')) keywords.push('Laptop');
    if (categoryLower.includes('telefon') || categoryLower.includes('smartphone')) keywords.push('Akıllı Telefon');
    if (categoryLower.includes('tablet')) keywords.push('Tablet');
    if (categoryLower.includes('araç') || categoryLower.includes('otomobil')) keywords.push('Araç');
    if (categoryLower.includes('daire') || categoryLower.includes('emlak') || categoryLower.includes('ev')) keywords.push('Daire');

    const categoryName = keywords[0] || category;
    
    // Hizmet kategorileri için özel title önerileri
    if (isService) {
      const serviceType = this.extractServiceType(category, attributes);
      
      // Hizmet tipine göre öneriler
      if (attributes['service_type']) {
        suggestions.push({
          title: `${attributes['service_type']} Arıyorum`,
          score: 85,
          reason: 'Hizmet tipine göre net hizmet arama formatı'
        });
        suggestions.push({
          title: `${attributes['service_type']} Hizmeti Arıyorum`,
          score: 80,
          reason: 'Hizmet tipine göre hizmet arama formatı'
        });
      }
      
      // Kategori adına göre öneriler
      suggestions.push({
        title: `${serviceType} Arıyorum`,
        score: 75,
        reason: 'Kategoriye özel hizmet arama formatı'
      });
      
      if (attributes['location']) {
        suggestions.push({
          title: `${attributes['location']} ${serviceType} Arıyorum`,
          score: 90,
          reason: 'Konum ve hizmet tipine göre net hizmet arama formatı'
        });
      }
      
      // Genel hizmet önerileri
      suggestions.push({
        title: `${category} Hizmeti Arıyorum`,
        score: 70,
        reason: 'Kategoriye özel hizmet arama formatı'
      });
      
      return suggestions; // Hizmet kategorileri için erken dönüş
    }

    // Generate "WANTED" style suggestions - prioritize specificity
    if (attributes['brand'] && attributes['model']) {
      // En spesifik: marka + model + özellikler
      if (categoryLower.includes('telefon')) {
        if (attributes['storage']) {
          suggestions.push({
            title: `${attributes['brand']} ${attributes['model']} ${attributes['storage']} Arıyorum`,
            score: 90,
            reason: 'Marka, model ve depolama ile net alınık ilan formatı'
          });
          if (attributes['color']) {
            suggestions.push({
              title: `${attributes['brand']} ${attributes['model']} ${attributes['color']} ${attributes['storage']} Arıyorum`,
              score: 95,
              reason: 'Marka, model, renk ve depolama ile çok net alınık ilan formatı'
            });
          }
        }
      } else if (categoryLower.includes('masaüstü') || categoryLower.includes('bilgisayar')) {
        const parts = [attributes['brand'], attributes['model']];
        if (attributes['ram']) parts.push(attributes['ram']);
        if (attributes['storage']) parts.push(attributes['storage']);
        suggestions.push({
          title: `${parts.join(' ')} Arıyorum`,
          score: 90,
          reason: 'Marka, model ve teknik özellikler ile net alınık ilan formatı'
        });
      }
      // Marka + model (genel)
      suggestions.push({
        title: `${attributes['brand']} ${attributes['model']} Arıyorum`,
        score: 80,
        reason: 'Marka ve model ile net alınık ilan formatı'
      });
    } else if (attributes['brand']) {
      suggestions.push({
        title: `${attributes['brand']} ${categoryName} Arıyorum`,
        score: 70,
        reason: 'Marka ile alınık ilan formatı'
      });
    }

    // Category-specific smart suggestions (WANTED format)
    if (categoryLower.includes('daire') || categoryLower.includes('emlak')) {
      // En spesifik: oda sayısı + metrekare
      if (attributes['roomCount'] && attributes['area']) {
        suggestions.push({
          title: `${attributes['roomCount']}+1 ${attributes['area']} m² Daire Arıyorum`,
          score: 85,
          reason: 'Oda sayısı ve metrekare ile net alınık ilan formatı'
        });
      }
      // Oda sayısı varsa
      if (attributes['roomCount']) {
        suggestions.push({
          title: `${attributes['roomCount']}+1 Daire Arıyorum`,
          score: 75,
          reason: 'Oda sayısı ile net alınık ilan formatı'
        });
      }
      // Metrekare varsa
      if (attributes['area']) {
        suggestions.push({
          title: `${attributes['area']} m² Daire Arıyorum`,
          score: 75,
          reason: 'Metrekare ile net alınık ilan formatı'
        });
      }
      // Genel
      suggestions.push({
        title: `Daire Arıyorum`,
        score: 60,
        reason: 'Kategoriye özel alınık ilan formatı'
      });
    } else if (categoryLower.includes('masaüstü') || categoryLower.includes('bilgisayar')) {
      suggestions.push({
        title: `Masaüstü Bilgisayar Arıyorum`,
        score: 60,
        reason: 'Kategoriye özel alınık ilan formatı'
      });
      suggestions.push({
        title: `Gaming Masaüstü Bilgisayar İstiyorum`,
        score: 55,
        reason: 'Kategoriye özel alınık ilan formatı'
      });
    } else if (categoryLower.includes('telefon')) {
      suggestions.push({
        title: `Akıllı Telefon Arıyorum`,
        score: 60,
        reason: 'Kategoriye özel alınık ilan formatı'
      });
      suggestions.push({
        title: `Telefon İstiyorum`,
        score: 55,
        reason: 'Kategoriye özel alınık ilan formatı'
      });
    } else {
      // Generic wanted format
      suggestions.push({
        title: `${category} Arıyorum`,
        score: 50,
        reason: 'Genel alınık ilan formatı'
      });
      suggestions.push({
        title: `${category} İstiyorum`,
        score: 45,
        reason: 'Genel alınık ilan formatı'
      });
    }

    return suggestions;
  }

  private getDefaultTitleSuggestions(attributes: Record<string, any>, category?: string): TitleSuggestion[] {
    const suggestions: TitleSuggestion[] = [];
    
    if (attributes['brand'] && attributes['model']) {
      suggestions.push({
        title: `${attributes['brand']} ${attributes['model']} Arıyorum`,
        score: 70,
        reason: 'Marka ve model bilgilerine göre - alınık ilan formatı'
      });
      suggestions.push({
        title: `${attributes['brand']} ${attributes['model']} İstiyorum`,
        score: 65,
        reason: 'Marka ve model bilgilerine göre - alınık ilan formatı'
      });
    } else if (attributes['brand']) {
      const categoryName = category || 'Ürün';
      suggestions.push({
        title: `${attributes['brand']} ${categoryName} Arıyorum`,
        score: 60,
        reason: 'Marka bilgisine göre - alınık ilan formatı'
      });
      suggestions.push({
        title: `${attributes['brand']} ${categoryName} İstiyorum`,
        score: 55,
        reason: 'Marka bilgisine göre - alınık ilan formatı'
      });
    } else if (category) {
      // Use category name if no attributes - WANTED format
      suggestions.push({
        title: `${category} Arıyorum`,
        score: 50,
        reason: 'Kategori bilgisine göre - alınık ilan formatı'
      });
      suggestions.push({
        title: `${category} İstiyorum`,
        score: 45,
        reason: 'Kategori bilgisine göre - alınık ilan formatı'
      });
      suggestions.push({
        title: `${category} Arayan`,
        score: 40,
        reason: 'Kategori bilgisine göre - alınık ilan formatı'
      });
    }

    return suggestions.length > 0 ? suggestions : [{
      title: 'İlan Başlığı',
      score: 30,
      reason: 'Varsayılan öneri'
    }];
  }

}

export const listingAIService = ListingAIService.getInstance();

