// Statik kategori sistemi deprecated - artık dinamik sistem kullanılıyor


export interface CategoryMatch {
  categoryPath: string;
  confidence: number;
  mainCategory: string;
  subCategory?: string;
  subSubCategory?: string;
}

export interface CategorySuggestion {
  primary: CategoryMatch;
  alternatives: CategoryMatch[];
}

// AI'dan gelen kategori isimlerini mevcut kategorilere eşleştirme
const categoryMapping: Record<string, string> = {
  // Elektronik
  'telefon': 'Elektronik > Telefon',
  'iphone': 'Elektronik > Telefon',
  'samsung': 'Elektronik > Telefon',
  'xiaomi': 'Elektronik > Telefon',
  'huawei': 'Elektronik > Telefon',
  'akıllı telefon': 'Elektronik > Telefon',
  'smartphone': 'Elektronik > Telefon',
  
  'bilgisayar': 'Elektronik > Bilgisayar',
  'laptop': 'Elektronik > Bilgisayar',
  'macbook': 'Elektronik > Bilgisayar',
  'dizüstü': 'Elektronik > Bilgisayar',
  'masaüstü': 'Elektronik > Bilgisayar',
  'desktop': 'Elektronik > Bilgisayar',
  
  'tablet': 'Elektronik > Bilgisayar',
  'ipad': 'Elektronik > Bilgisayar',
  
  'klavye': 'Elektronik > Bilgisayar',
  'mouse': 'Elektronik > Bilgisayar',
  'monitör': 'Elektronik > Bilgisayar',
  'aksesuar': 'Elektronik > Bilgisayar',
  
  'oyun konsolu': 'Elektronik > Oyun & Eğlence',
  'playstation': 'Elektronik > Oyun & Eğlence',
  'xbox': 'Elektronik > Oyun & Eğlence',
  'nintendo': 'Elektronik > Oyun & Eğlence',
  
  'kamera': 'Elektronik > Fotoğraf & Kamera',
  'fotoğraf': 'Elektronik > Fotoğraf & Kamera',
  'canon': 'Elektronik > Fotoğraf & Kamera',
  'nikon': 'Elektronik > Fotoğraf & Kamera',
  
  'televizyon': 'Elektronik > TV & Ses',
  'tv': 'Elektronik > TV & Ses',
  'ses sistemi': 'Elektronik > TV & Ses',
  'hoparlör': 'Elektronik > TV & Ses',
  
  // Araç & Vasıta
  'araba': 'Araç & Vasıta > Otomobil',
  'otomobil': 'Araç & Vasıta > Otomobil',
  'bmw': 'Araç & Vasıta > Otomobil',
  'mercedes': 'Araç & Vasıta > Otomobil',
  'audi': 'Araç & Vasıta > Otomobil',
  'volkswagen': 'Araç & Vasıta > Otomobil',
  'ford': 'Araç & Vasıta > Otomobil',
  'honda': 'Araç & Vasıta > Otomobil',
  'toyota': 'Araç & Vasıta > Otomobil',
  
  'motosiklet': 'Araç & Vasıta > Motosiklet',
  'bisiklet': 'Araç & Vasıta > Bisiklet',
  'yedek parça': 'Araç & Vasıta > Yedek Parça & Aksesuar',
  
  // Ev Aletleri & Mobilya
  'mobilya': 'Ev Aletleri & Mobilya > Mobilya',
  'koltuk': 'Ev Aletleri & Mobilya > Mobilya',
  'masa': 'Ev Aletleri & Mobilya > Mobilya',
  'sandalye': 'Ev Aletleri & Mobilya > Mobilya',
  'dolap': 'Ev Aletleri & Mobilya > Mobilya',
  
  'dekorasyon': 'Ev Aletleri & Mobilya > Dekorasyon',
  'halı': 'Ev Aletleri & Mobilya > Dekorasyon',
  'perde': 'Ev Aletleri & Mobilya > Dekorasyon',
  'tablo': 'Ev Aletleri & Mobilya > Dekorasyon',
  
  'mutfak': 'Ev Aletleri & Mobilya > Mutfak Eşyaları',
  'bulaşık makinesi': 'Ev Aletleri & Mobilya > Ev Aletleri',
  'çamaşır makinesi': 'Ev Aletleri & Mobilya > Ev Aletleri',
  'buzdolabı': 'Ev Aletleri & Mobilya > Ev Aletleri',
  
  // Moda & Giyim
  'giyim': 'Moda & Giyim > Kadın Giyim',
  'elbise': 'Moda & Giyim > Kadın Giyim',
  'pantolon': 'Moda & Giyim > Kadın Giyim',
  'gömlek': 'Moda & Giyim > Kadın Giyim',
  'ceket': 'Moda & Giyim > Kadın Giyim',
  
  'ayakkabı': 'Moda & Giyim > Ayakkabı',
  'çanta': 'Moda & Giyim > Aksesuar',
  'takı': 'Moda & Giyim > Aksesuar',
  
  // Spor & Outdoor
  'spor': 'Spor & Outdoor > Fitness & Egzersiz',
  'fitness': 'Spor & Outdoor > Fitness & Egzersiz',
  'koşu': 'Spor & Outdoor > Spor Giyim',
  'kamp': 'Spor & Outdoor > Outdoor & Kamp',
  
  // Sanat & Hobi
  'müzik': 'Sanat & Hobi > Müzik Enstrümanları',
  'gitar': 'Sanat & Hobi > Müzik Enstrümanları',
  'piyano': 'Sanat & Hobi > Müzik Enstrümanları',
  'resim': 'Sanat & Hobi > Resim & El Sanatları',
  
  // Eğitim & Kitap
  'kitap': 'Eğitim & Kitap > Kitaplar',
  'ders': 'Eğitim & Kitap > Kurslar & Dersler',
  'kurs': 'Eğitim & Kitap > Kurslar & Dersler',
  'kırtasiye': 'Eğitim & Kitap > Kırtasiye',
  
  // Anne & Bebek
  'bebek': 'Anne & Bebek > Bebek Giyim',
  'oyuncak': 'Anne & Bebek > Oyuncaklar',
  'bebek arabası': 'Anne & Bebek > Bebek Arabası & Taşıma',
  
  // Oyun & Eğlence
  'oyun': 'Oyun & Eğlence > Video Oyunları',
  'playstation oyunu': 'Oyun & Eğlence > Video Oyunları',
  'xbox oyunu': 'Oyun & Eğlence > Video Oyunları',
  
  // Hizmetler
  'tamir': 'Hizmetler > Tamir & Bakım',
  'bakım': 'Hizmetler > Tamir & Bakım',
  'nakliyat': 'Hizmetler > Tamir & Bakım',
  'özel ders': 'Hizmetler > Özel Ders',
  'danışmanlık': 'Hizmetler > Danışmanlık',
  
  // Sağlık & Güzellik
  'sağlık': 'Sağlık & Güzellik > Sağlık & Bakım',
  'güzellik': 'Sağlık & Güzellik > Güzellik & Kozmetik',
  'kozmetik': 'Sağlık & Güzellik > Güzellik & Kozmetik',
  
  // İş & Endüstri
  'iş': 'İş & Endüstri > İş Makineleri',
  'endüstri': 'İş & Endüstri > İş Makineleri',
  'makineler': 'İş & Endüstri > İş Makineleri',
  
  // Seyahat
  'seyahat': 'Seyahat > Ulaşım',
  'tur': 'Seyahat > Tur Paketleri',
  'otel': 'Seyahat > Konaklama',
  
  // Kripto & Finans
  'kripto': 'Kripto & Finans > Kripto Para',
  'bitcoin': 'Kripto & Finans > Kripto Para',
  'finans': 'Kripto & Finans > Finansal Hizmetler',
  
  // Koleksiyon & Değerli Eşyalar
  'koleksiyon': 'Koleksiyon & Değerli Eşyalar > Koleksiyonlar',
  'antika': 'Koleksiyon & Değerli Eşyalar > Koleksiyonlar',
  'altın': 'Koleksiyon & Değerli Eşyalar > Değerli Eşyalar',
  'pırlanta': 'Koleksiyon & Değerli Eşyalar > Değerli Eşyalar',
};

// Ana kategori eşleştirmeleri
const mainCategoryMapping: Record<string, string> = {
  'elektronik': 'Elektronik',
  'araç': 'Araç & Vasıta',
  'vasıta': 'Araç & Vasıta',
  'emlak': 'Emlak',
  'moda': 'Moda & Giyim',
  'giyim': 'Moda & Giyim',
  'ev': 'Ev Aletleri & Mobilya',
  'mobilya': 'Ev Aletleri & Mobilya',
  'alet': 'Ev Aletleri & Mobilya',
  'eğitim': 'Eğitim & Kitap',
  'kitap': 'Eğitim & Kitap',
  'hizmet': 'Hizmetler',
  'hizmetler': 'Hizmetler',
  'spor': 'Spor & Outdoor',
  'outdoor': 'Spor & Outdoor',
  'sanat': 'Sanat & Hobi',
  'hobi': 'Sanat & Hobi',
  'anne': 'Anne & Bebek',
  'bebek': 'Anne & Bebek',
  'oyun': 'Oyun & Eğlence',
  'eğlence': 'Oyun & Eğlence',
  'seyahat': 'Seyahat',
  'kripto': 'Kripto & Finans',
  'finans': 'Kripto & Finans',
  'sağlık': 'Sağlık & Güzellik',
  'güzellik': 'Sağlık & Güzellik',
  'iş': 'İş & Endüstri',
  'endüstri': 'İş & Endüstri',
  'koleksiyon': 'Koleksiyon & Değerli Eşyalar',
  'değerli': 'Koleksiyon & Değerli Eşyalar',
};

// Fuzzy matching için benzerlik hesaplama
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Basit benzerlik hesaplama
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  return commonWords.length / Math.max(words1.length, words2.length);
};

// AI kategorisini mevcut kategorilere eşleştir
export const matchAICategory = (aiCategory: string, userDescription: string): CategorySuggestion => {
  console.log('🔍 Matching AI category:', aiCategory, 'for:', userDescription);
  
  const suggestions: CategoryMatch[] = [];
  const processedCategory = aiCategory.toLowerCase().trim();
  const processedDescription = userDescription.toLowerCase().trim();
  
  // 1. Direkt mapping kontrolü
  for (const [key, categoryPath] of Object.entries(categoryMapping)) {
    if (processedCategory.includes(key) || processedDescription.includes(key)) {
      const pathParts = categoryPath.split(' > ');
      suggestions.push({
        categoryPath,
        confidence: 0.95,
        mainCategory: pathParts[0],
        subCategory: pathParts[1],
        subSubCategory: pathParts[2]
      });
    }
  }
  
  // 2. Ana kategori mapping kontrolü
  for (const [key, mainCategory] of Object.entries(mainCategoryMapping)) {
    if (processedCategory.includes(key) || processedDescription.includes(key)) {
      const category = categoriesConfig.find(cat => cat.name === mainCategory);
      if (category && category.subcategories && category.subcategories.length > 0) {
        suggestions.push({
          categoryPath: mainCategory,
          confidence: 0.7,
          mainCategory,
          subCategory: category.subcategories[0].name
        });
      }
    }
  }
  
  // 3. Fuzzy matching ile tüm kategorileri kontrol et
  const allCategories = getAllCategoryPaths();
  for (const categoryPath of allCategories) {
    const similarity = calculateSimilarity(processedCategory, categoryPath);
    if (similarity > 0.3) {
      const pathParts = categoryPath.split(' > ');
      suggestions.push({
        categoryPath,
        confidence: similarity,
        mainCategory: pathParts[0],
        subCategory: pathParts[1],
        subSubCategory: pathParts[2]
      });
    }
  }
  
  // 4. Sonuçları güven skoruna göre sırala
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  // 5. Duplicate'leri kaldır
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
    index === self.findIndex(s => s.categoryPath === suggestion.categoryPath)
  );
  
  // 6. En iyi 5 öneriyi al
  const topSuggestions = uniqueSuggestions.slice(0, 5);
  
  // 7. Eğer hiç öneri yoksa "Diğer" kategorisini ekle
  if (topSuggestions.length === 0) {
    topSuggestions.push({
      categoryPath: 'Diğer',
      confidence: 0.1,
      mainCategory: 'Diğer'
    });
  }
  
  const result: CategorySuggestion = {
    primary: topSuggestions[0],
    alternatives: topSuggestions.slice(1)
  };
  
  console.log('✅ Category suggestions:', result);
  return result;
};

// Tüm kategori yollarını al
const getAllCategoryPaths = (): string[] => {
  const paths: string[] = [];
  
  for (const category of categoriesConfig) {
    paths.push(category.name);
    
    for (const subCategory of category.subcategories) {
      paths.push(`${category.name} > ${subCategory.name}`);
      
      if (subCategory.subcategories) {
        for (const subSubCategory of subCategory.subcategories) {
          paths.push(`${category.name} > ${subCategory.name} > ${subSubCategory.name}`);
        }
      }
    }
  }
  
  return paths;
};

// Tüm kategorileri düz liste olarak al (findCategoryByName için)
const getAllCategories = (config: any[]): any[] => {
  const allCategories: any[] = [];
  
  for (const category of config) {
    allCategories.push(category);
    
    for (const subCategory of category.subcategories) {
      allCategories.push(subCategory);
      
      if (subCategory.subcategories) {
        for (const subSubCategory of subCategory.subcategories) {
          allCategories.push(subSubCategory);
        }
      }
    }
  }
  
  return allCategories;
};

// Kategori yolunu parçala
export const parseCategoryPath = (categoryPath: string): {
  mainCategory: string;
  subCategory?: string;
  subSubCategory?: string;
} => {
  const parts = categoryPath.split(' > ');
  return {
    mainCategory: parts[0],
    subCategory: parts[1],
    subSubCategory: parts[2]
  };
};

// Kategori geçerli mi kontrol et
export const isValidCategory = (categoryPath: string): boolean => {
  return findCategoryByName(categoryPath) !== null;
};

// AI'dan gelen kategori isimlerini mevcut kategorilere eşleştirme
export function matchCategoryFromAI(aiCategory: string): CategoryMatch | null {
  // AI'dan gelen kategori ismini küçük harfe çevir
  const normalizedCategory = aiCategory.toLowerCase().trim();
  
  // Doğrudan mapping'de ara
  const mappedCategory = categoryMapping[normalizedCategory];
  if (mappedCategory) {
    const category = findCategoryByName(mappedCategory);
    if (category) {
      return {
        categoryPath: mappedCategory,
        confidence: 0.9,
        mainCategory: mappedCategory.split(' > ')[0],
        subCategory: mappedCategory.split(' > ')[1],
        subSubCategory: mappedCategory.split(' > ')[2]
      };
    }
  }
  
  // Kategori isimlerinde arama yap
  const allCategories = getAllCategories(categoriesConfig);
  let bestMatch: CategoryMatch | null = null;
  let bestScore = 0;
  
  for (const category of allCategories) {
    const score = calculateSimilarity(normalizedCategory, category.name.toLowerCase());
    if (score > bestScore && score > 0.6) {
      bestScore = score;
      bestMatch = {
        categoryPath: category.name,
        confidence: score,
        mainCategory: category.name,
        subCategory: undefined,
        subSubCategory: undefined
      };
    }
  }
  
  return bestMatch;
}

// Kategori önerilerini filtrele (sadece geçerli kategoriler)
export const filterValidCategories = (suggestions: CategoryMatch[]): CategoryMatch[] => {
  return suggestions.filter(suggestion => isValidCategory(suggestion.categoryPath));
}; 

// Test fonksiyonu - kategori eşleştirme sistemini test et
export const testCategoryMatching = () => {
  console.log('🧪 Testing category matching system...');
  
  const testCases = [
    { aiCategory: 'iPhone 13 Pro', description: 'iPhone 13 Pro arıyorum' },
    { aiCategory: 'MacBook Air', description: 'MacBook Air laptop arıyorum' },
    { aiCategory: 'BMW 3.20i', description: 'BMW 3.20i araba arıyorum' },
    { aiCategory: 'Klavye', description: 'Mekanik klavye arıyorum' },
    { aiCategory: 'Televizyon', description: 'Smart TV arıyorum' },
    { aiCategory: 'Mobilya', description: 'Koltuk takımı arıyorum' },
    { aiCategory: 'Giyim', description: 'Ceket arıyorum' },
    { aiCategory: 'Spor', description: 'Koşu ayakkabısı arıyorum' },
    { aiCategory: 'Müzik', description: 'Gitar arıyorum' },
    { aiCategory: 'Kitap', description: 'Roman kitabı arıyorum' },
    { aiCategory: '', description: 'Bir şey arıyorum' }, // Boş kategori testi
    { aiCategory: 'Bilinmeyen Ürün', description: 'Garip bir ürün arıyorum' }, // Bilinmeyen kategori testi
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n🧪 Test ${index + 1}:`);
    console.log(`   AI Category: "${testCase.aiCategory}"`);
    console.log(`   Description: "${testCase.description}"`);
    
    try {
      const result = matchAICategory(testCase.aiCategory, testCase.description);
      console.log(`   ✅ Result: ${result.primary.categoryPath} (${Math.round(result.primary.confidence * 100)}%)`);
      if (result.alternatives.length > 0) {
        console.log(`   🔄 Alternatives: ${result.alternatives.map(alt => `${alt.categoryPath} (${Math.round(alt.confidence * 100)}%)`).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  });
  
  console.log('\n🧪 Category matching test completed!');
};

// Firebase fonksiyonları kaldırıldı

// Firebase kaydetme fonksiyonları kaldırıldı

// Firebase kaydetme fonksiyonları kaldırıldı 