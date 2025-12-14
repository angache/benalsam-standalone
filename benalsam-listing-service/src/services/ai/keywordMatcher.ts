/**
 * Keyword Matcher
 * Extracts information from user input text
 */

export const keywordMatcher = {
  /**
   * Extract brand from text
   */
  extractBrand(text: string): string | null {
    // Expanded brand list with common variations
    const brands = [
      // Electronics - Phones
      'iPhone', 'Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Oppo', 'Vivo', 
      'OnePlus', 'Google', 'Pixel', 'Sony', 'Xperia', 'LG', 'Nokia', 'Motorola',
      'Realme', 'Honor', 'Tecno', 'Infinix', 'Redmi', 'POCO',
      // Electronics - Computers
      'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer', 'Alienware',
      'MacBook', 'Mac', 'Surface', 'Microsoft',
      // Electronics - Audio
      'JBL', 'Sony', 'Bose', 'Sennheiser', 'Audio-Technica', 'Beats',
      // Electronics - Gaming
      'PlayStation', 'PS', 'Xbox', 'Nintendo', 'Switch',
      // Automotive - Premium
      'BMW', 'Mercedes', 'Mercedes-Benz', 'Audi', 'Porsche', 'Jaguar', 'Land Rover',
      'Volvo', 'Lexus', 'Infiniti', 'Acura', 'Cadillac', 'Lincoln',
      // Automotive - Mainstream
      'Volkswagen', 'VW', 'Ford', 'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia',
      'Renault', 'Peugeot', 'Fiat', 'Opel', 'Skoda', 'Seat', 'Citroen',
      'Dacia', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Isuzu', 'Chevrolet',
      'Dodge', 'Jeep', 'Chrysler', 'Buick', 'GMC',
      // Musical Instruments
      'Fender', 'Gibson', 'Yamaha', 'Ibanez', 'Epiphone', 'Cort', 'Takamine',
      'Martin', 'Taylor', 'Gretsch', 'PRS', 'ESP', 'Schecter',
      // Real Estate (not really brands, but common terms)
      'Emlak', 'Daire', 'Villa', 'Müstakil', 'Residence'
    ];

    const lowerText = text.toLowerCase();
    
    // Sort by length (longer first) to match "Mercedes-Benz" before "Mercedes"
    const sortedBrands = brands.sort((a, b) => b.length - a.length);
    
    for (const brand of sortedBrands) {
      const lowerBrand = brand.toLowerCase();
      // More precise matching - whole word or at word boundary
      const regex = new RegExp(`\\b${lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        return brand;
      }
      // Fallback to simple includes for compound names
      if (lowerText.includes(lowerBrand)) {
        return brand;
      }
    }

    return null;
  },

  /**
   * Extract model from text
   */
  extractModel(text: string, brand: string): string | null {
    const lowerText = text.toLowerCase();
    const lowerBrand = brand.toLowerCase();

    // iPhone models - improved
    if (lowerBrand.includes('iphone') || lowerBrand.includes('apple')) {
      const iphoneMatch = text.match(/iPhone\s*(\d+)\s*(Pro|Max|Plus|Mini|SE)?/i);
      if (iphoneMatch) {
        return `iPhone ${iphoneMatch[1]}${iphoneMatch[2] ? ' ' + iphoneMatch[2] : ''}`.trim();
      }
    }

    // Samsung Galaxy models - improved
    if (lowerBrand.includes('samsung')) {
      const galaxyMatch = text.match(/Galaxy\s*(S|Note|A|Z|Fold|Tab)\s*(\d+)(\s*(Plus|Ultra|Pro|Mini))?/i);
      if (galaxyMatch) {
        return `Galaxy ${galaxyMatch[1]}${galaxyMatch[2]}${galaxyMatch[4] || ''}`.trim();
      }
    }

    // MacBook models
    if (lowerBrand.includes('mac') || lowerBrand.includes('apple')) {
      const macMatch = text.match(/(MacBook\s*(Pro|Air)?|iMac|Mac\s*Mini|Mac\s*Pro)\s*(\d+)?/i);
      if (macMatch) {
        return macMatch[0].trim();
      }
    }

    // BMW models - improved
    if (lowerBrand.includes('bmw')) {
      const bmwMatch = text.match(/(\d+)\s*Series|X\d+|M\d+|i\d+|Z\d+/i);
      if (bmwMatch) {
        return bmwMatch[0];
      }
    }

    // Mercedes models - improved
    if (lowerBrand.includes('mercedes')) {
      const mercMatch = text.match(/(A|B|C|E|S|G|GL|CLA|GLA|GLC|GLE|GLS|AMG)\s*(\d+)?/i);
      if (mercMatch) {
        return `${mercMatch[1]}${mercMatch[2] || ''}`.trim();
      }
    }

    // Guitar models
    if (lowerBrand.includes('fender') || lowerBrand.includes('gibson') || lowerBrand.includes('yamaha')) {
      const guitarMatch = text.match(/(Stratocaster|Telecaster|Les\s*Paul|SG|ES-\d+|Pacific|FG|Dreadnought)/i);
      if (guitarMatch && guitarMatch[1]) {
        return guitarMatch[1];
      }
    }

    // Generic model extraction - improved
    const brandIndex = lowerText.indexOf(lowerBrand);
    if (brandIndex !== -1) {
      const afterBrand = text.substring(brandIndex + brand.length).trim();
      // Try to find model number/name after brand
      const modelMatch = afterBrand.match(/^([A-Z0-9][A-Z0-9\s\-]+?)(?:\s|$|,|\.)/);
      if (modelMatch && modelMatch[1] && modelMatch[1].length > 1 && modelMatch[1].length < 40) {
        const model = modelMatch[1].trim();
        // Filter out common words that aren't models
        const skipWords = ['arıyorum', 'istiyorum', 'arıyorum', 'telefon', 'bilgisayar', 'araç'];
        if (!skipWords.some(word => model.toLowerCase().includes(word))) {
          return model;
        }
      }
    }

    return null;
  },

  /**
   * Extract price from text
   */
  extractPrice(text: string): number | null {
    // Match patterns like: "5000 TL", "5.000₺", "5000 lira", etc.
    const pricePatterns = [
      /(\d+[\.,]?\d*)\s*(TL|₺|lira|Lira|türk lirası)/i,
      /(TL|₺|lira|Lira)\s*(\d+[\.,]?\d*)/i,
      /(\d+[\.,]?\d*)\s*(bin|milyon)/i
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        let price = parseFloat(match[1] || match[2] || '0');
        
        // Handle "bin" (thousand) and "milyon" (million)
        if (match[0] && match[0].toLowerCase().includes('bin')) {
          price *= 1000;
        } else if (match[0] && match[0].toLowerCase().includes('milyon')) {
          price *= 1000000;
        }

        return price > 0 ? price : null;
      }
    }

    return null;
  },

  /**
   * Extract year from text
   */
  extractYear(text: string): number | null {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      if (year >= 1990 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
    return null;
  },

  /**
   * Extract condition from text
   */
  extractCondition(text: string): string | null {
    const conditions = {
      'sıfır': 'Sıfır',
      'sifir': 'Sıfır',
      'yeni': 'Sıfır',
      'ikinci el': 'İkinci El',
      'ikinciel': 'İkinci El',
      'kullanılmış': 'İkinci El',
      'kullanilmis': 'İkinci El',
      'hasarlı': 'Hasarlı',
      'hasarli': 'Hasarlı',
      'tamir edilmiş': 'Tamir Edilmiş',
      'tamir edilmis': 'Tamir Edilmiş'
    };

    const lowerText = text.toLowerCase();
    
    for (const [key, value] of Object.entries(conditions)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }

    return null;
  }
};

