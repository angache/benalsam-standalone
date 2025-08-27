// ===========================
// SETTINGS CONSTANTS
// ===========================

import { 
  Smartphone, 
  Shirt, 
  Home, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
  Flower2, 
  Car, 
  Grid 
} from 'lucide-react-native';
import type { Language, Currency, Province, District, Category } from '../../../types';

export const languages: Language[] = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export const currencies: Currency[] = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

export const provinces: Province[] = [
  { code: 'TR-34', name: 'İstanbul', districts: [] },
  { code: 'TR-06', name: 'Ankara', districts: [] },
  { code: 'TR-35', name: 'İzmir', districts: [] },
];

export const districts: Record<string, District[]> = {
  'TR-34': [
    { code: 'TR-34-01', name: 'Adalar' },
    { code: 'TR-34-02', name: 'Bakırköy' },
    { code: 'TR-34-03', name: 'Beşiktaş' },
    { code: 'TR-34-04', name: 'Beyoğlu' },
    { code: 'TR-34-05', name: 'Kadıköy' },
  ],
  'TR-06': [
    { code: 'TR-06-01', name: 'Altındağ' },
    { code: 'TR-06-02', name: 'Çankaya' },
    { code: 'TR-06-03', name: 'Keçiören' },
    { code: 'TR-06-04', name: 'Mamak' },
    { code: 'TR-06-05', name: 'Yenimahalle' },
  ],
  'TR-35': [
    { code: 'TR-35-01', name: 'Bornova' },
    { code: 'TR-35-02', name: 'Buca' },
    { code: 'TR-35-03', name: 'Karşıyaka' },
    { code: 'TR-35-04', name: 'Konak' },
    { code: 'TR-35-05', name: 'Menemen' },
  ],
};

export const categories: Category[] = [
  { code: 'electronics', name: 'Elektronik', icon: Smartphone },
  { code: 'fashion', name: 'Moda', icon: Shirt },
  { code: 'home', name: 'Ev & Yaşam', icon: Home },
  { code: 'sports', name: 'Spor', icon: Dumbbell },
  { code: 'books', name: 'Kitap', icon: BookOpen },
  { code: 'games', name: 'Oyun', icon: Gamepad2 },
  { code: 'garden', name: 'Bahçe', icon: Flower2 },
  { code: 'auto', name: 'Otomotiv', icon: Car },
  { code: 'other', name: 'Diğer', icon: Grid },
];

export const SUMMARY_EMAIL_OPTIONS = [
  { id: 'daily', title: 'Günlük', subtitle: 'Her gün özet e-posta al' },
  { id: 'weekly', title: 'Haftalık', subtitle: 'Her hafta özet e-posta al' },
  { id: 'never', title: 'Hiçbir zaman', subtitle: 'Özet e-posta alma' },
];

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  new_offer_push: true,
  new_offer_email: true,
  new_message_push: true,
  new_message_email: true,
  review_push: true,
  review_email: true,
  summary_emails: 'weekly' as const,
};

export const DEFAULT_CHAT_PREFERENCES = {
  read_receipts: true,
  show_last_seen: true,
  auto_scroll_messages: true,
};

export const DEFAULT_PLATFORM_PREFERENCES = {
  language: 'tr',
  currency: 'TRY',
  default_location_province: 'TR-34',
  default_location_district: 'TR-34-05',
  default_category: 'electronics',
};
