// App Configuration
export const APP_CONFIG = {
  name: 'BenAlsam',
  version: '1.0.0',
  description: 'İkinci el alışveriş platformu',
};

// API Configuration
export const API_CONFIG = {
  baseUrl: 'https://api.benalsam.com',
  timeout: 10000,
};

// Storage Keys
export const STORAGE_KEYS = {
  theme: 'benalsam_theme',
  user: 'benalsam_user',
  favorites: 'benalsam_favorites',
  settings: 'benalsam_settings',
};

// Categories
export const CATEGORIES = [
  { id: 'electronics', name: 'Elektronik', icon: '📱' },
  { id: 'fashion', name: 'Moda', icon: '👕' },
  { id: 'home', name: 'Ev & Yaşam', icon: '🏠' },
  { id: 'sports', name: 'Spor', icon: '⚽' },
  { id: 'books', name: 'Kitap', icon: '📚' },
  { id: 'automotive', name: 'Otomotiv', icon: '🚗' },
  { id: 'beauty', name: 'Güzellik', icon: '💄' },
  { id: 'toys', name: 'Oyuncak', icon: '🧸' },
  { id: 'music', name: 'Müzik', icon: '🎵' },
  { id: 'art', name: 'Sanat', icon: '🎨' },
  { id: 'garden', name: 'Bahçe', icon: '🌱' },
  { id: 'other', name: 'Diğer', icon: '📦' },
];

// Price Ranges
export const PRICE_RANGES = [
  { label: 'Tümü', min: 0, max: null },
  { label: '0 - 100 ₺', min: 0, max: 100 },
  { label: '100 - 500 ₺', min: 100, max: 500 },
  { label: '500 - 1000 ₺', min: 500, max: 1000 },
  { label: '1000 - 5000 ₺', min: 1000, max: 5000 },
  { label: '5000+ ₺', min: 5000, max: null },
];

// Condition Options
export const CONDITIONS = [
  { id: 'new', name: 'Yeni', description: 'Hiç kullanılmamış' },
  { id: 'like_new', name: 'Az Kullanılmış', description: 'Çok az kullanılmış' },
  { id: 'good', name: 'İyi', description: 'Normal kullanım izleri var' },
  { id: 'fair', name: 'Orta', description: 'Bazı kullanım izleri var' },
  { id: 'poor', name: 'Kötü', description: 'Çok kullanılmış' },
];

// Location Options (Major Turkish Cities)
export const LOCATIONS = [
  { id: 'istanbul', name: 'İstanbul' },
  { id: 'ankara', name: 'Ankara' },
  { id: 'izmir', name: 'İzmir' },
  { id: 'bursa', name: 'Bursa' },
  { id: 'antalya', name: 'Antalya' },
  { id: 'adana', name: 'Adana' },
  { id: 'konya', name: 'Konya' },
  { id: 'gaziantep', name: 'Gaziantep' },
  { id: 'mersin', name: 'Mersin' },
  { id: 'diyarbakir', name: 'Diyarbakır' },
  { id: 'other', name: 'Diğer' },
];

// Sort Options
export const SORT_OPTIONS = [
  { id: 'newest', name: 'En Yeni' },
  { id: 'oldest', name: 'En Eski' },
  { id: 'price_low', name: 'Fiyat (Düşükten Yükseğe)' },
  { id: 'price_high', name: 'Fiyat (Yüksekten Düşüğe)' },
  { id: 'popular', name: 'En Popüler' },
];

// Notification Types
export const NOTIFICATION_TYPES = {
  new_message: 'Yeni Mesaj',
  offer_received: 'Teklif Alındı',
  offer_accepted: 'Teklif Kabul Edildi',
  offer_declined: 'Teklif Reddedildi',
  listing_sold: 'İlan Satıldı',
  price_drop: 'Fiyat Düştü',
  new_listing: 'Yeni İlan',
};

// Error Messages
export const ERROR_MESSAGES = {
  network_error: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
  auth_error: 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.',
  validation_error: 'Lütfen tüm alanları doğru şekilde doldurun.',
  unknown_error: 'Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.',
  upload_error: 'Dosya yüklenirken hata oluştu.',
  permission_error: 'Bu işlem için gerekli izinler verilmedi.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  login_success: 'Başarıyla giriş yapıldı.',
  register_success: 'Hesap başarıyla oluşturuldu.',
  listing_created: 'İlan başarıyla oluşturuldu.',
  listing_updated: 'İlan başarıyla güncellendi.',
  listing_deleted: 'İlan başarıyla silindi.',
  offer_sent: 'Teklif başarıyla gönderildi.',
  profile_updated: 'Profil başarıyla güncellendi.',
  message_sent: 'Mesaj başarıyla gönderildi.',
};

// Validation Rules
export const VALIDATION_RULES = {
  email: {
    required: 'E-posta adresi gereklidir.',
    invalid: 'Geçerli bir e-posta adresi girin.',
  },
  password: {
    required: 'Şifre gereklidir.',
    minLength: 'Şifre en az 6 karakter olmalıdır.',
  },
  username: {
    required: 'Kullanıcı adı gereklidir.',
    minLength: 'Kullanıcı adı en az 3 karakter olmalıdır.',
  },
  title: {
    required: 'İlan başlığı gereklidir.',
    minLength: 'İlan başlığı en az 10 karakter olmalıdır.',
    maxLength: 'İlan başlığı en fazla 100 karakter olabilir.',
  },
  description: {
    required: 'İlan açıklaması gereklidir.',
    minLength: 'İlan açıklaması en az 20 karakter olmalıdır.',
    maxLength: 'İlan açıklaması en fazla 1000 karakter olabilir.',
  },
  price: {
    required: 'Fiyat gereklidir.',
    min: 'Fiyat 0\'dan büyük olmalıdır.',
  },
}; 