/**
 * Category Rules
 * Category-specific rules and configurations
 */

import { AttributeSuggestion } from './types';

export interface CategoryRule {
  titlePatterns: string[];
  requiredAttributes?: string[];
  attributeSuggestions?: (userInput: string, currentAttributes: Record<string, any>) => AttributeSuggestion[];
  priceRange: { min: number; max: number };
}

export const categoryRules = {
  /**
   * Get rules for category
   */
  getRules(category: string): CategoryRule | null {
    const categoryLower = category.toLowerCase();
    
    // Find matching rule
    for (const [key, rule] of Object.entries(rules)) {
      if (categoryLower.includes(key.toLowerCase())) {
        return rule;
      }
    }

    return defaultRule;
  },

  /**
   * Get price range for category
   */
  getPriceRange(category: string): { min: number; max: number } {
    const rule = this.getRules(category);
    return rule?.priceRange || defaultRule.priceRange;
  }
};

const defaultRule: CategoryRule = {
  titlePatterns: [
    '{brand} {model} Arıyorum',
    '{brand} {category} Arıyorum',
    '{category} Arıyorum',
    '{category} İstiyorum',
    '{brand} {model} İstiyorum'
  ],
  priceRange: { min: 100, max: 1000000 }
};

const rules: Record<string, CategoryRule> = {
  // Automotive
  'otomotiv': {
    titlePatterns: [
      '{year} {brand} {model} Arıyorum',
      '{brand} {model} Arıyorum',
      '{year} {brand} {model} İstiyorum',
      '{brand} {model} {fuelType} Arıyorum',
      '{brand} Araç Arıyorum'
    ],
    requiredAttributes: ['brand', 'model', 'year', 'km', 'fuelType'],
    attributeSuggestions: (userInput, currentAttributes) => {
      const suggestions: AttributeSuggestion[] = [];
      const lowerInput = userInput.toLowerCase();

      // Fuel type suggestions
      if (!currentAttributes['fuelType']) {
        if (lowerInput.includes('benzin') || lowerInput.includes('petrol')) {
          suggestions.push({ key: 'fuelType', value: 'Benzin', confidence: 0.9, reason: 'Yakıt tipi tespit edildi' });
        } else if (lowerInput.includes('dizel') || lowerInput.includes('diesel')) {
          suggestions.push({ key: 'fuelType', value: 'Dizel', confidence: 0.9, reason: 'Yakıt tipi tespit edildi' });
        } else if (lowerInput.includes('elektrik') || lowerInput.includes('elektrikli')) {
          suggestions.push({ key: 'fuelType', value: 'Elektrik', confidence: 0.9, reason: 'Yakıt tipi tespit edildi' });
        } else if (lowerInput.includes('hibrit')) {
          suggestions.push({ key: 'fuelType', value: 'Hibrit', confidence: 0.9, reason: 'Yakıt tipi tespit edildi' });
        }
      }

      // Transmission suggestions
      if (!currentAttributes['transmission']) {
        if (lowerInput.includes('manuel') || lowerInput.includes('manuel')) {
          suggestions.push({ key: 'transmission', value: 'Manuel', confidence: 0.8, reason: 'Vites tipi tespit edildi' });
        } else if (lowerInput.includes('otomatik') || lowerInput.includes('automatic')) {
          suggestions.push({ key: 'transmission', value: 'Otomatik', confidence: 0.8, reason: 'Vites tipi tespit edildi' });
        }
      }

      return suggestions;
    },
    priceRange: { min: 50000, max: 5000000 }
  },

  // Electronics - Smartphones
  'telefon': {
    titlePatterns: [
      '{brand} {model} {storage} Arıyorum',
      '{brand} {model} {color} {storage} Arıyorum',
      '{brand} {model} Arıyorum',
      '{brand} {model} {color} Arıyorum',
      '{brand} {storage} Telefon Arıyorum',
      '{brand} Telefon Arıyorum'
    ],
    requiredAttributes: ['brand', 'model', 'storage'],
    attributeSuggestions: (userInput, currentAttributes) => {
      const suggestions: AttributeSuggestion[] = [];
      const lowerInput = userInput.toLowerCase();

      // Storage suggestions
      if (!currentAttributes['storage']) {
        const storageMatch = userInput.match(/(\d+)\s*(GB|gb|TB|tb)/i);
        if (storageMatch && storageMatch[1] && storageMatch[2]) {
          suggestions.push({
            key: 'storage',
            value: `${storageMatch[1]}${storageMatch[2].toUpperCase()}`,
            confidence: 0.9,
            reason: 'Depolama bilgisi tespit edildi'
          });
        }
      }

      // Color suggestions
      if (!currentAttributes['color']) {
        const colors = ['Siyah', 'Beyaz', 'Mavi', 'Kırmızı', 'Yeşil', 'Mor', 'Altın', 'Gümüş'];
        for (const color of colors) {
          if (lowerInput.includes(color.toLowerCase())) {
            suggestions.push({ key: 'color', value: color, confidence: 0.8, reason: 'Renk tespit edildi' });
            break;
          }
        }
      }

      return suggestions;
    },
    priceRange: { min: 500, max: 100000 }
  },

  // Electronics - General
  'elektronik': {
    titlePatterns: [
      '{brand} {model} Arıyorum',
      '{brand} {model} İstiyorum',
      '{brand} {category} Arıyorum',
      '{category} Arıyorum'
    ],
    requiredAttributes: ['brand', 'model'],
    priceRange: { min: 100, max: 500000 }
  },

  // Desktop Computer
  'masaüstü': {
    titlePatterns: [
      '{brand} {model} {ram} {storage} Masaüstü Bilgisayar Arıyorum',
      '{brand} {model} {ram} Masaüstü Bilgisayar Arıyorum',
      '{brand} {model} Masaüstü Bilgisayar Arıyorum',
      '{brand} {ram} {storage} Masaüstü Bilgisayar Arıyorum',
      '{brand} Masaüstü Bilgisayar Arıyorum'
    ],
    requiredAttributes: ['brand'],
    priceRange: { min: 2000, max: 50000 }
  },

  // Computer (general)
  'bilgisayar': {
    titlePatterns: [
      '{brand} {model} {ram} {storage} Bilgisayar Arıyorum',
      '{brand} {model} {ram} Bilgisayar Arıyorum',
      '{brand} {model} Bilgisayar Arıyorum',
      '{brand} {ram} Bilgisayar Arıyorum',
      '{brand} Bilgisayar Arıyorum'
    ],
    requiredAttributes: ['brand'],
    priceRange: { min: 1000, max: 50000 }
  },

  // Real Estate (WANTED format)
  'emlak': {
    titlePatterns: [
      '{roomCount}+1 {area} m² Daire Arıyorum',
      '{roomCount}+1 Daire Arıyorum',
      '{area} m² Daire Arıyorum',
      'Daire Arıyorum'
    ],
    requiredAttributes: ['propertyType'],
    priceRange: { min: 100000, max: 50000000 }
  },

  // Apartment (Daire)
  'daire': {
    titlePatterns: [
      '{roomCount}+1 {area} m² Daire Arıyorum',
      '{roomCount}+1 Daire Arıyorum',
      '{area} m² Daire Arıyorum',
      'Daire Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 100000, max: 10000000 }
  },

  // For Sale Apartment (actually WANTED)
  'satılık': {
    titlePatterns: [
      '{propertyType} Arıyorum',
      '{roomCount}+1 {propertyType} Arıyorum',
      '{area} m² {propertyType} İstiyorum',
      'Daire Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 100000, max: 10000000 }
  },

  // Furniture
  'mobilya': {
    titlePatterns: [
      '{furnitureType} {material}',
      '{condition} {furnitureType}',
      '{brand} {furnitureType}'
    ],
    requiredAttributes: ['furnitureType'],
    priceRange: { min: 100, max: 50000 }
  },

  // Clothing
  'giyim': {
    titlePatterns: [
      '{brand} {clothingType}',
      '{brand} {clothingType} {size}',
      '{condition} {brand} {clothingType}'
    ],
    requiredAttributes: ['clothingType', 'size'],
    priceRange: { min: 50, max: 10000 }
  },

  // Services (Hizmetler) - Special handling for service categories
  'hizmet': {
    titlePatterns: [
      '{service_type} Arıyorum',
      '{service_type} Hizmeti Arıyorum',
      '{location} {service_type} Arıyorum',
      '{category} Hizmeti Arıyorum',
      '{category} Arıyorum'
    ],
    requiredAttributes: ['service_type'],
    priceRange: { min: 100, max: 50000 }
  },
  'hizmetler': {
    titlePatterns: [
      '{service_type} Arıyorum',
      '{service_type} Hizmeti Arıyorum',
      '{location} {service_type} Arıyorum',
      '{category} Hizmeti Arıyorum'
    ],
    requiredAttributes: ['service_type'],
    priceRange: { min: 100, max: 50000 }
  },
  'tamir': {
    titlePatterns: [
      'Tamirci Arıyorum',
      '{service_type} Tamirci Arıyorum',
      '{location} Tamirci Arıyorum',
      'Tamir Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 200, max: 10000 }
  },
  'bakım': {
    titlePatterns: [
      'Bakım Hizmeti Arıyorum',
      '{service_type} Bakım Hizmeti Arıyorum',
      '{location} Bakım Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 200, max: 10000 }
  },
  'elektrikçi': {
    titlePatterns: [
      'Elektrikçi Arıyorum',
      '{location} Elektrikçi Arıyorum',
      'Elektrik Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 300, max: 15000 }
  },
  'tesisatçı': {
    titlePatterns: [
      'Tesisatçı Arıyorum',
      '{location} Tesisatçı Arıyorum',
      'Tesisat Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 300, max: 15000 }
  },
  'boyacı': {
    titlePatterns: [
      'Boyacı Arıyorum',
      '{location} Boyacı Arıyorum',
      'Boyama Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 500, max: 20000 }
  },
  'marangoz': {
    titlePatterns: [
      'Marangoz Arıyorum',
      '{location} Marangoz Arıyorum',
      'Marangozluk Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 500, max: 25000 }
  },
  'temizlik': {
    titlePatterns: [
      'Temizlik Hizmeti Arıyorum',
      '{location} Temizlik Hizmeti Arıyorum',
      'Temizlikçi Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 200, max: 5000 }
  },
  'nakliye': {
    titlePatterns: [
      'Nakliye Hizmeti Arıyorum',
      '{location} Nakliye Hizmeti Arıyorum',
      'Taşıma Hizmeti Arıyorum'
    ],
    requiredAttributes: [],
    priceRange: { min: 500, max: 20000 }
  }
};

