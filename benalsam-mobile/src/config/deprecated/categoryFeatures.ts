// Kategori bazlı özellikler ve etiketler tanımları
export interface CategoryFeature {
  id: string;
  name: string;
  description?: string;
}

export interface CategoryTag {
  id: string;
  name: string;
  description?: string;
}

export interface CategoryFeaturesConfig {
  features: CategoryFeature[];
  tags: CategoryTag[];
}

// Elektronik kategorisi özellikleri ve etiketleri
export const electronicFeatures: Record<string, CategoryFeaturesConfig> = {
  // Telefon kategorisi
  "Elektronik > Telefon": {
    features: [
      // Depolama
      { id: "storage_64gb", name: "64GB" },
      { id: "storage_128gb", name: "128GB" },
      { id: "storage_256gb", name: "256GB" },
      { id: "storage_512gb", name: "512GB" },
      { id: "storage_1tb", name: "1TB" },
      
      // Güvenlik
      { id: "face_id", name: "Face ID" },
      { id: "touch_id", name: "Touch ID" },
      { id: "fingerprint", name: "Parmak İzi" },
      
      // Bağlantı
      { id: "5g", name: "5G" },
      { id: "4g", name: "4G" },
      { id: "wifi_6", name: "WiFi 6" },
      
      // Durum
      { id: "boxed", name: "Kutulu" },
      { id: "warranty", name: "Garantili" },
      { id: "scratch_free", name: "Çiziksiz" },
      { id: "original", name: "Orijinal" },
      { id: "import", name: "İthalat" },
      { id: "local", name: "Yerli" },
      { id: "unlocked", name: "Kilitsiz" },
      { id: "locked", name: "Kilitli" },
      
      // Ekran
      { id: "oled", name: "OLED" },
      { id: "amoled", name: "AMOLED" },
      { id: "lcd", name: "LCD" },
      { id: "curved", name: "Kavisli Ekran" },
      { id: "foldable", name: "Katlanabilir" },
      
      // Kamera
      { id: "dual_camera", name: "Çift Kamera" },
      { id: "triple_camera", name: "Üçlü Kamera" },
      { id: "quad_camera", name: "Dörtlü Kamera" },
      { id: "night_mode", name: "Gece Modu" },
      { id: "portrait_mode", name: "Portre Modu" },
    ],
    tags: [
      { id: "smartphone", name: "Akıllı Telefon" },
      { id: "iphone", name: "iPhone" },
      { id: "samsung", name: "Samsung" },
      { id: "xiaomi", name: "Xiaomi" },
      { id: "huawei", name: "Huawei" },
      { id: "oppo", name: "Oppo" },
      { id: "vivo", name: "Vivo" },
      { id: "oneplus", name: "OnePlus" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "clean", name: "Temiz" },
      { id: "durable", name: "Sağlam" },
      { id: "new_like", name: "Yeni Gibi" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  },

  // iPhone özel kategorisi
  "Elektronik > Telefon > iPhone": {
    features: [
      // iPhone Modeli
      { id: "iphone_15_pro_max", name: "iPhone 15 Pro Max" },
      { id: "iphone_15_pro", name: "iPhone 15 Pro" },
      { id: "iphone_15_plus", name: "iPhone 15 Plus" },
      { id: "iphone_15", name: "iPhone 15" },
      { id: "iphone_14_pro_max", name: "iPhone 14 Pro Max" },
      { id: "iphone_14_pro", name: "iPhone 14 Pro" },
      { id: "iphone_14_plus", name: "iPhone 14 Plus" },
      { id: "iphone_14", name: "iPhone 14" },
      { id: "iphone_13_pro_max", name: "iPhone 13 Pro Max" },
      { id: "iphone_13_pro", name: "iPhone 13 Pro" },
      { id: "iphone_13", name: "iPhone 13" },
      { id: "iphone_12_pro_max", name: "iPhone 12 Pro Max" },
      { id: "iphone_12_pro", name: "iPhone 12 Pro" },
      { id: "iphone_12", name: "iPhone 12" },
      { id: "iphone_11_pro_max", name: "iPhone 11 Pro Max" },
      { id: "iphone_11_pro", name: "iPhone 11 Pro" },
      { id: "iphone_11", name: "iPhone 11" },
      
      // Depolama
      { id: "storage_64gb", name: "64GB" },
      { id: "storage_128gb", name: "128GB" },
      { id: "storage_256gb", name: "256GB" },
      { id: "storage_512gb", name: "512GB" },
      { id: "storage_1tb", name: "1TB" },
      
      // Renk
      { id: "color_black", name: "Siyah" },
      { id: "color_white", name: "Beyaz" },
      { id: "color_gold", name: "Altın" },
      { id: "color_silver", name: "Gümüş" },
      { id: "color_blue", name: "Mavi" },
      { id: "color_purple", name: "Mor" },
      { id: "color_green", name: "Yeşil" },
      { id: "color_red", name: "Kırmızı" },
      
      // Özel iPhone Özellikleri
      { id: "face_id", name: "Face ID" },
      { id: "touch_id", name: "Touch ID" },
      { id: "dynamic_island", name: "Dynamic Island" },
      { id: "pro_motion", name: "ProMotion" },
      { id: "always_on_display", name: "Always-On Display" },
      { id: "mag_safe", name: "MagSafe" },
      { id: "wireless_charging", name: "Kablosuz Şarj" },
      { id: "fast_charging", name: "Hızlı Şarj" },
      { id: "5g", name: "5G" },
      { id: "wifi_6", name: "WiFi 6" },
      
      // Durum
      { id: "boxed", name: "Kutulu" },
      { id: "warranty", name: "Garantili" },
      { id: "scratch_free", name: "Çiziksiz" },
      { id: "original", name: "Orijinal" },
      { id: "unlocked", name: "Kilitsiz" },
      { id: "first_owner", name: "İlk Sahip" },
      { id: "apple_care", name: "Apple Care" },
    ],
    tags: [
      { id: "iphone", name: "iPhone" },
      { id: "apple", name: "Apple" },
      { id: "smartphone", name: "Akıllı Telefon" },
      { id: "pro", name: "Pro" },
      { id: "max", name: "Max" },
      { id: "plus", name: "Plus" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "clean", name: "Temiz" },
      { id: "durable", name: "Sağlam" },
      { id: "new_like", name: "Yeni Gibi" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
      { id: "premium", name: "Premium" },
      { id: "luxury", name: "Lüks" },
    ]
  },

  // Bilgisayar kategorisi
  "Elektronik > Bilgisayar": {
    features: [
      // RAM
      { id: "ram_4gb", name: "4GB RAM" },
      { id: "ram_8gb", name: "8GB RAM" },
      { id: "ram_16gb", name: "16GB RAM" },
      { id: "ram_32gb", name: "32GB RAM" },
      { id: "ram_64gb", name: "64GB RAM" },
      
      // Depolama
      { id: "ssd_128gb", name: "128GB SSD" },
      { id: "ssd_256gb", name: "256GB SSD" },
      { id: "ssd_512gb", name: "512GB SSD" },
      { id: "ssd_1tb", name: "1TB SSD" },
      { id: "ssd_2tb", name: "2TB SSD" },
      { id: "hdd_1tb", name: "1TB HDD" },
      { id: "hdd_2tb", name: "2TB HDD" },
      
      // İşlemci
      { id: "intel_i3", name: "Intel i3" },
      { id: "intel_i5", name: "Intel i5" },
      { id: "intel_i7", name: "Intel i7" },
      { id: "intel_i9", name: "Intel i9" },
      { id: "amd_ryzen_3", name: "AMD Ryzen 3" },
      { id: "amd_ryzen_5", name: "AMD Ryzen 5" },
      { id: "amd_ryzen_7", name: "AMD Ryzen 7" },
      { id: "amd_ryzen_9", name: "AMD Ryzen 9" },
      
      // Ekran Kartı
      { id: "integrated_gpu", name: "Entegre Ekran Kartı" },
      { id: "dedicated_gpu", name: "Ayrı Ekran Kartı" },
      { id: "nvidia_gtx", name: "NVIDIA GTX" },
      { id: "nvidia_rtx", name: "NVIDIA RTX" },
      { id: "amd_radeon", name: "AMD Radeon" },
      
      // Kullanım Amacı
      { id: "gaming", name: "Gaming" },
      { id: "business", name: "İş" },
      { id: "student", name: "Öğrenci" },
      { id: "home", name: "Ev" },
      { id: "office", name: "Ofis" },
      
      // Durum
      { id: "boxed", name: "Kutulu" },
      { id: "warranty", name: "Garantili" },
      { id: "original", name: "Orijinal" },
      { id: "upgraded", name: "Yükseltilmiş" },
      { id: "clean", name: "Temiz" },
      { id: "scratch_free", name: "Çiziksiz" },
    ],
    tags: [
      { id: "laptop", name: "Laptop" },
      { id: "desktop", name: "Masaüstü" },
      { id: "tablet", name: "Tablet" },
      { id: "gaming", name: "Gaming" },
      { id: "business", name: "İş Bilgisayarı" },
      { id: "student", name: "Öğrenci" },
      { id: "macbook", name: "MacBook" },
      { id: "windows", name: "Windows" },
      { id: "macos", name: "macOS" },
      { id: "linux", name: "Linux" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  }
};

// Tüm kategori özelliklerini birleştir
const allCategoryFeatures: Record<string, CategoryFeaturesConfig> = {
  ...electronicFeatures,
  
  // Araç kategorisi
  "Araç": {
    features: [
      { id: "automatic", name: "Otomatik" },
      { id: "manual", name: "Manuel" },
      { id: "diesel", name: "Dizel" },
      { id: "gasoline", name: "Benzin" },
      { id: "hybrid", name: "Hibrit" },
      { id: "electric", name: "Elektrik" },
      { id: "4x4", name: "4x4" },
      { id: "sunroof", name: "Tavan Penceresi" },
      { id: "leather_seats", name: "Deri Koltuk" },
      { id: "navigation", name: "Navigasyon" },
      { id: "bluetooth", name: "Bluetooth" },
      { id: "backup_camera", name: "Geri Vites Kamerası" },
      { id: "parking_sensors", name: "Park Sensörü" },
      { id: "cruise_control", name: "Hız Sabitleyici" },
      { id: "warranty", name: "Garantili" },
      { id: "first_owner", name: "İlk Sahip" },
      { id: "accident_free", name: "Kazasız" },
      { id: "low_mileage", name: "Düşük Kilometre" },
    ],
    tags: [
      { id: "car", name: "Araba" },
      { id: "suv", name: "SUV" },
      { id: "sedan", name: "Sedan" },
      { id: "hatchback", name: "Hatchback" },
      { id: "bmw", name: "BMW" },
      { id: "mercedes", name: "Mercedes" },
      { id: "audi", name: "Audi" },
      { id: "volkswagen", name: "Volkswagen" },
      { id: "toyota", name: "Toyota" },
      { id: "honda", name: "Honda" },
      { id: "ford", name: "Ford" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  },

  // Emlak kategorisi
  "Emlak": {
    features: [
      { id: "furnished", name: "Eşyalı" },
      { id: "unfurnished", name: "Eşyasız" },
      { id: "balcony", name: "Balkon" },
      { id: "terrace", name: "Teras" },
      { id: "garden", name: "Bahçe" },
      { id: "parking", name: "Otopark" },
      { id: "elevator", name: "Asansör" },
      { id: "security", name: "Güvenlik" },
      { id: "central_heating", name: "Merkezi Isıtma" },
      { id: "air_conditioning", name: "Klima" },
      { id: "internet", name: "İnternet" },
      { id: "pet_friendly", name: "Evcil Hayvan Dostu" },
      { id: "student_friendly", name: "Öğrenci Dostu" },
      { id: "new_building", name: "Yeni Bina" },
      { id: "renovated", name: "Tadilatlı" },
    ],
    tags: [
      { id: "apartment", name: "Daire" },
      { id: "house", name: "Ev" },
      { id: "villa", name: "Villa" },
      { id: "studio", name: "Stüdyo" },
      { id: "rent", name: "Kiralık" },
      { id: "sale", name: "Satılık" },
      { id: "good_location", name: "İyi Konum" },
      { id: "quiet", name: "Sessiz" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  },

  // Giyim kategorisi
  "Giyim": {
    features: [
      { id: "xs", name: "XS" },
      { id: "s", name: "S" },
      { id: "m", name: "M" },
      { id: "l", name: "L" },
      { id: "xl", name: "XL" },
      { id: "xxl", name: "XXL" },
      { id: "cotton", name: "Pamuk" },
      { id: "polyester", name: "Polyester" },
      { id: "wool", name: "Yün" },
      { id: "leather", name: "Deri" },
      { id: "denim", name: "Kot" },
      { id: "silk", name: "İpek" },
      { id: "waterproof", name: "Su Geçirmez" },
      { id: "windproof", name: "Rüzgar Geçirmez" },
      { id: "breathable", name: "Nefes Alabilir" },
      { id: "original", name: "Orijinal" },
      { id: "brand_new", name: "Yeni" },
      { id: "never_worn", name: "Hiç Giyilmemiş" },
    ],
    tags: [
      { id: "shirt", name: "Gömlek" },
      { id: "pants", name: "Pantolon" },
      { id: "dress", name: "Elbise" },
      { id: "jacket", name: "Ceket" },
      { id: "coat", name: "Mont" },
      { id: "shoes", name: "Ayakkabı" },
      { id: "bag", name: "Çanta" },
      { id: "nike", name: "Nike" },
      { id: "adidas", name: "Adidas" },
      { id: "zara", name: "Zara" },
      { id: "h&m", name: "H&M" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  },

  // Spor kategorisi
  "Spor": {
    features: [
      { id: "adjustable", name: "Ayarlanabilir" },
      { id: "foldable", name: "Katlanabilir" },
      { id: "portable", name: "Taşınabilir" },
      { id: "professional", name: "Profesyonel" },
      { id: "amateur", name: "Amatör" },
      { id: "indoor", name: "Kapalı Alan" },
      { id: "outdoor", name: "Açık Alan" },
      { id: "waterproof", name: "Su Geçirmez" },
      { id: "lightweight", name: "Hafif" },
      { id: "durable", name: "Dayanıklı" },
      { id: "original", name: "Orijinal" },
      { id: "brand_new", name: "Yeni" },
      { id: "warranty", name: "Garantili" },
    ],
    tags: [
      { id: "fitness", name: "Fitness" },
      { id: "running", name: "Koşu" },
      { id: "cycling", name: "Bisiklet" },
      { id: "swimming", name: "Yüzme" },
      { id: "tennis", name: "Tenis" },
      { id: "football", name: "Futbol" },
      { id: "basketball", name: "Basketbol" },
      { id: "gym", name: "Spor Salonu" },
      { id: "home_workout", name: "Ev Egzersizi" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "urgent", name: "Acil" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  },

  // Koleksiyon kategorisi
  "Koleksiyon & Değerli Eşyalar": {
    features: [
      { id: "authentic", name: "Orijinal" },
      { id: "certified", name: "Sertifikalı" },
      { id: "limited_edition", name: "Sınırlı Sayıda" },
      { id: "vintage", name: "Vintage" },
      { id: "antique", name: "Antika" },
      { id: "rare", name: "Nadir" },
      { id: "mint_condition", name: "Mint Durumda" },
      { id: "excellent_condition", name: "Mükemmel Durumda" },
      { id: "good_condition", name: "İyi Durumda" },
      { id: "with_box", name: "Kutulu" },
      { id: "with_papers", name: "Belgeli" },
      { id: "investment", name: "Yatırımlık" },
      { id: "collectible", name: "Koleksiyonluk" },
    ],
    tags: [
      { id: "coins", name: "Madeni Para" },
      { id: "stamps", name: "Pul" },
      { id: "cards", name: "Kart" },
      { id: "figures", name: "Figür" },
      { id: "watches", name: "Saat" },
      { id: "jewelry", name: "Takı" },
      { id: "art", name: "Sanat" },
      { id: "books", name: "Kitap" },
      { id: "vinyl", name: "Vinil" },
      { id: "good_price", name: "Uygun Fiyat" },
      { id: "investment", name: "Yatırım" },
      { id: "rare", name: "Nadir" },
      { id: "negotiable", name: "Pazarlık Payı Var" },
    ]
  }
};

// Kategori yoluna göre özellikler ve etiketler alma fonksiyonu
export const getCategoryFeatures = (categoryPath: string): CategoryFeaturesConfig | null => {
  console.log('🔍 getCategoryFeatures - Input categoryPath:', categoryPath);
  console.log('🔍 getCategoryFeatures - Available categories:', Object.keys(allCategoryFeatures));
  
  // Tam eşleşme ara
  let config = allCategoryFeatures[categoryPath];
  
  // Tam eşleşme yoksa, üst kategorileri ara
  if (!config) {
    const pathParts = categoryPath.split(' > ');
    
    // En spesifik'ten en genel'e doğru ara
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const partialPath = pathParts.slice(0, i + 1).join(' > ');
      config = allCategoryFeatures[partialPath];
      console.log('🔍 getCategoryFeatures - Trying partial path:', partialPath, 'Found:', !!config);
      if (config) break;
    }
  }
  
  console.log('🔍 getCategoryFeatures - Final config:', config);
  return config || null;
};

// Tüm kategorileri alma
export const getAllCategories = (): string[] => {
  return Object.keys(allCategoryFeatures);
};

// Tüm elektronik kategorilerini alma (geriye uyumluluk için)
export const getAllElectronicCategories = (): string[] => {
  return Object.keys(electronicFeatures);
};

// Özellik veya etiket ID'sine göre isim alma
export const getFeatureNameById = (categoryPath: string, featureId: string): string | null => {
  const config = getCategoryFeatures(categoryPath);
  if (!config) return null;
  
  const feature = config.features.find(f => f.id === featureId);
  return feature?.name || null;
};

export const getTagNameById = (categoryPath: string, tagId: string): string | null => {
  const config = getCategoryFeatures(categoryPath);
  if (!config) return null;
  
  const tag = config.tags.find(t => t.id === tagId);
  return tag?.name || null;
}; 