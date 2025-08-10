import { Smartphone, Home, Car, GraduationCap, Briefcase, Dumbbell, Palette, Baby, Gamepad2, Music, Camera, Wrench, Laptop, Shirt, Book, Utensils, Plane, Bitcoin, Building } from 'lucide-react';

const categoriesConfig = [
  { 
    name: 'Elektronik', 
    icon: Smartphone, 
    color: 'from-blue-500 to-cyan-500',
    subcategories: [
      { 
        name: 'Telefon', 
        icon: Smartphone,
        subcategories: [
          { name: 'Akıllı Telefon' },
          { name: 'Tuşlu Telefon' },
          { name: 'Aksesuar' },
        ]
      },
      { 
        name: 'Bilgisayar', 
        icon: Laptop,
        subcategories: [
          { name: 'Dizüstü Bilgisayar' },
          { name: 'Masaüstü Bilgisayar' },
          { name: 'Tablet' },
          { name: 'Bileşenler (CPU, GPU vb.)' },
          { name: 'Aksesuarlar (Klavye, Mouse vb.)' },
        ]
      },
      { name: 'Oyun Konsolu', icon: Gamepad2 },
      { name: 'Kamera & Fotoğraf', icon: Camera },
      { name: 'TV & Ses Sistemleri', icon: Music },
      { name: 'Diğer Elektronik', icon: Wrench },
    ]
  },
  { 
    name: 'Araç & Vasıta', 
    icon: Car, 
    color: 'from-red-500 to-pink-500',
    subcategories: [
      { name: 'Otomobil' },
      { name: 'Motosiklet' },
      { name: 'Bisiklet' },
      { name: 'Ticari Araçlar' },
      { name: 'Yedek Parça & Aksesuar' },
    ]
  },
  {
    name: 'Emlak',
    icon: Building,
    color: 'from-orange-400 to-amber-600',
    subcategories: [
      { 
        name: 'Konut',
        subcategories: [
          { name: 'Satılık Daire' },
          { name: 'Kiralık Daire' },
          { name: 'Satılık Müstakil Ev' },
          { name: 'Kiralık Müstakil Ev' },
          { name: 'Yazlık' },
        ] 
      },
      { 
        name: 'Ticari',
        subcategories: [
          { name: 'Satılık Dükkan & Mağaza' },
          { name: 'Kiralık Dükkan & Mağaza' },
          { name: 'Satılık Ofis' },
          { name: 'Kiralık Ofis' },
          { name: 'Devren Satılık İşyeri' },
        ]
      },
      { 
        name: 'Arsa',
        subcategories: [
          { name: 'İmarlı Arsa' },
          { name: 'Tarla' },
          { name: 'Bahçe' },
        ]
      },
      { name: 'Bina' },
      { name: 'Turistik Tesis' },
    ]
  },
  { 
    name: 'Moda', 
    icon: Shirt, 
    color: 'from-pink-500 to-rose-500',
    subcategories: [
      { name: 'Giyim' },
      { name: 'Ayakkabı' },
      { name: 'Aksesuar (Çanta, Takı vb.)' },
    ]
  },
  { 
    name: 'Ev & Yaşam', 
    icon: Home, 
    color: 'from-green-500 to-emerald-500',
    subcategories: [
      { name: 'Mobilya' },
      { name: 'Dekorasyon' },
      { name: 'Mutfak Eşyaları', icon: Utensils },
      { name: 'Bahçe & Yapı Market' },
    ]
  },
  { 
    name: 'Eğitim & Kitap', 
    icon: GraduationCap, 
    color: 'from-purple-500 to-violet-500',
    subcategories: [
      { name: 'Kitaplar', icon: Book },
      { name: 'Kurslar & Dersler' },
      { name: 'Kırtasiye Malzemeleri' },
    ]
  },
  { 
    name: 'Hizmetler', 
    icon: Briefcase, 
    color: 'from-orange-500 to-amber-500',
    subcategories: [
      { name: 'Tamir & Bakım', icon: Wrench },
      { name: 'Nakliyat' },
      { name: 'Özel Ders' },
      { name: 'Organizasyon' },
      { name: 'Danışmanlık' },
    ]
  },
  { 
    name: 'Spor & Outdoor', 
    icon: Dumbbell, 
    color: 'from-teal-500 to-cyan-500',
    subcategories: [
      { name: 'Fitness Ekipmanları' },
      { name: 'Kamp Malzemeleri' },
      { name: 'Spor Giyim' },
      { name: 'Bisikletler' },
    ]
  },
  { 
    name: 'Sanat & Hobi', 
    icon: Palette, 
    color: 'from-pink-500 to-rose-500',
    subcategories: [
      { name: 'Müzik Enstrümanları', icon: Music },
      { name: 'Resim & El Sanatları' },
      { name: 'Koleksiyon' },
      { name: 'Model Araçlar' },
    ]
  },
  { 
    name: 'Anne & Bebek', 
    icon: Baby, 
    color: 'from-yellow-500 to-orange-500',
    subcategories: [
      { name: 'Bebek Arabası & Taşıma' },
      { name: 'Bebek Giyim' },
      { name: 'Oyuncaklar' },
      { name: 'Bebek Maması & Beslenme' },
    ]
  },
  { 
    name: 'Oyun & Eğlence', 
    icon: Gamepad2, 
    color: 'from-indigo-500 to-purple-500',
    subcategories: [
      { name: 'Video Oyunları' },
      { name: 'Masa Oyunları' },
      { name: 'Oyuncaklar' },
    ]
  },
  {
    name: 'Seyahat',
    icon: Plane,
    color: 'from-sky-500 to-blue-500',
    subcategories: [
      { name: 'Uçak Bileti Arayışı' },
      { name: 'Otel Rezervasyonu İsteği' },
      { name: 'Tur Paketleri' },
      { name: 'Seyahat Aksesuarları' },
    ]
  },
  {
    name: 'Kripto & Finans',
    icon: Bitcoin,
    color: 'from-amber-400 to-yellow-500',
    subcategories: [
      { name: 'Kripto Para Alım Talebi' },
      { name: 'Finansal Danışmanlık Arayışı' },
      { name: 'Yatırım Fırsatları' },
    ]
  }
];

const getCategoryPath = (categoryName, subCategoryName, subSubCategoryName) => {
  let path = categoryName;
  if (subCategoryName) path += ` > ${subCategoryName}`;
  if (subSubCategoryName) path += ` > ${subSubCategoryName}`;
  return path;
};

const findCategoryByName = (name) => {
    if (!name) return null;
    const pathParts = name.split(' > ');
    let currentLevel = categoriesConfig;
    let foundCategory = null;

    for (const part of pathParts) {
        const category = currentLevel.find(cat => cat.name === part);
        if (category) {
            foundCategory = category;
            currentLevel = category.subcategories || [];
        } else {
            return null; 
        }
    }
    return foundCategory;
};

export { categoriesConfig, getCategoryPath, findCategoryByName };