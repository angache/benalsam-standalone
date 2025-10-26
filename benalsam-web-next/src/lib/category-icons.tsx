/**
 * Category Icon Mapping
 * Maps category names to Lucide icons
 */

import {
  Smartphone,
  Laptop,
  Camera,
  Gamepad2,
  Home,
  Building2,
  Car,
  Bike,
  ShirtIcon as Shirt,
  ShoppingBag,
  Sofa,
  UtensilsCrossed,
  Book,
  GraduationCap,
  Briefcase,
  Palette,
  Music,
  Dog,
  Cat,
  Bird,
  Baby,
  Heart,
  Wrench,
  Hammer,
  TreePine,
  Flower,
  Trophy,
  Dumbbell,
  Watch,
  Gem,
  LucideIcon,
} from 'lucide-react'

export const categoryIcons: Record<string, LucideIcon> = {
  // Elektronik
  'Elektronik': Smartphone,
  'Bilgisayar': Laptop,
  'Telefon': Smartphone,
  'Tablet': Laptop,
  'Kamera': Camera,
  'Oyun': Gamepad2,
  
  // Emlak
  'Emlak': Home,
  'Konut': Home,
  'İşyeri': Building2,
  'Arsa': TreePine,
  
  // Araç
  'Araç': Car,
  'Otomobil': Car,
  'Motosiklet': Bike,
  'Bisiklet': Bike,
  
  // Moda
  'Moda': Shirt,
  'Giyim': Shirt,
  'Ayakkabı': ShoppingBag,
  'Aksesuar': Watch,
  'Takı': Gem,
  
  // Ev & Yaşam
  'Ev & Yaşam': Home,
  'Mobilya': Sofa,
  'Mutfak': UtensilsCrossed,
  'Dekorasyon': Flower,
  
  // Eğitim
  'Eğitim': Book,
  'Kitap': Book,
  'Kurs': GraduationCap,
  
  // İş & Kariyer
  'İş': Briefcase,
  'Kariyer': Briefcase,
  
  // Hobi & Sanat
  'Hobi': Palette,
  'Sanat': Palette,
  'Müzik': Music,
  
  // Hayvanlar
  'Hayvan': Dog,
  'Köpek': Dog,
  'Kedi': Cat,
  'Kuş': Bird,
  
  // Bebek & Çocuk
  'Bebek': Baby,
  'Çocuk': Baby,
  
  // Spor
  'Spor': Dumbbell,
  'Fitness': Dumbbell,
  
  // Tamir & Tadilat
  'Tamir': Wrench,
  'Tadilat': Hammer,
  
  // Sağlık
  'Sağlık': Heart,
  
  // Diğer
  'Diğer': Trophy,
}

export const getCategoryIcon = (categoryName: string): LucideIcon => {
  // Exact match first
  if (categoryIcons[categoryName]) {
    return categoryIcons[categoryName]
  }
  
  // Partial match (case insensitive)
  const lowerName = categoryName.toLowerCase()
  
  if (lowerName.includes('elektronik') || lowerName.includes('telefon')) return Smartphone
  if (lowerName.includes('bilgisayar') || lowerName.includes('laptop')) return Laptop
  if (lowerName.includes('kamera') || lowerName.includes('fotoğraf')) return Camera
  if (lowerName.includes('oyun') || lowerName.includes('game')) return Gamepad2
  
  if (lowerName.includes('emlak') || lowerName.includes('konut')) return Home
  if (lowerName.includes('işyeri') || lowerName.includes('ofis')) return Building2
  if (lowerName.includes('arsa') || lowerName.includes('tarla')) return TreePine
  
  if (lowerName.includes('araç') || lowerName.includes('otomobil') || lowerName.includes('vasıta')) return Car
  if (lowerName.includes('motor')) return Bike
  if (lowerName.includes('bisiklet')) return Bike
  
  if (lowerName.includes('moda') || lowerName.includes('giyim') || lowerName.includes('kıyafet')) return Shirt
  if (lowerName.includes('ayakkabı')) return ShoppingBag
  if (lowerName.includes('aksesuar') || lowerName.includes('saat')) return Watch
  if (lowerName.includes('takı') || lowerName.includes('mücevher')) return Gem
  
  if (lowerName.includes('ev') && (lowerName.includes('alet') || lowerName.includes('eşya'))) return Sofa
  if (lowerName.includes('mobilya') || lowerName.includes('koltuk')) return Sofa
  if (lowerName.includes('mutfak')) return UtensilsCrossed
  if (lowerName.includes('dekorasyon') || lowerName.includes('süs')) return Flower
  
  if (lowerName.includes('eğitim') || lowerName.includes('kitap')) return Book
  if (lowerName.includes('kurs') || lowerName.includes('ders')) return GraduationCap
  
  if (lowerName.includes('iş') || lowerName.includes('kariyer') || lowerName.includes('endüstri')) return Briefcase
  
  if (lowerName.includes('hobi') || lowerName.includes('sanat')) return Palette
  if (lowerName.includes('müzik') || lowerName.includes('enstrüman')) return Music
  
  if (lowerName.includes('hayvan') || lowerName.includes('evcil')) return Dog
  if (lowerName.includes('köpek')) return Dog
  if (lowerName.includes('kedi')) return Cat
  if (lowerName.includes('kuş')) return Bird
  
  if (lowerName.includes('bebek') || lowerName.includes('çocuk') || lowerName.includes('anne')) return Baby
  
  if (lowerName.includes('spor') || lowerName.includes('fitness') || lowerName.includes('outdoor')) return Dumbbell
  
  if (lowerName.includes('tamir') || lowerName.includes('tadilat') || lowerName.includes('hizmet')) return Wrench
  
  if (lowerName.includes('sağlık') || lowerName.includes('güzellik')) return Heart
  
  if (lowerName.includes('seyahat') || lowerName.includes('tatil')) return TreePine
  if (lowerName.includes('koleksiyon') || lowerName.includes('antika')) return Trophy
  if (lowerName.includes('kripto') || lowerName.includes('finans') || lowerName.includes('bitcoin')) return Briefcase
  
  // Default fallback
  return Home
}

