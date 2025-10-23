import { Award, CalendarClock, Siren, Rocket, Palette } from 'lucide-react'

export interface DopingPrice {
  duration: number
  price: number
  label: string
}

export interface DopingOption {
  id: string
  title: string
  description: string
  icon: any
  db_field: string
  prices: DopingPrice[]
}

export const dopingOptions: DopingOption[] = [
  {
    id: 'showcase',
    title: 'Kategori Vitrini',
    description: 'İlanınız her gün ait olduğu kategori ve alt kategori sayfalarında web ara yüzünde görüntülensin.',
    icon: Award,
    db_field: 'is_showcase',
    prices: [
      { duration: 7, price: 135, label: '1 Hafta' },
      { duration: 14, price: 250, label: '2 Hafta' },
      { duration: 30, price: 500, label: '1 Ay' },
    ],
  },
  {
    id: 'up_to_date',
    title: 'Güncelim Dopingi',
    description: 'İlanınızın tarihi güncellenerek tekrardan üst sıralarda yer alır.',
    icon: CalendarClock,
    db_field: 'up_to_date',
    prices: [
      { duration: 1, price: 51, label: '1 Adet' },
      { duration: 3, price: 140, label: '3 Adet' },
      { duration: 5, price: 220, label: '5 Adet' },
    ],
  },
  {
    id: 'urgent',
    title: 'Acil İlan',
    description: '"Hemen satmam lazım" diyorsanız Acil dopingini alın, ilanınız ana sayfada ve kategori menüsünde yer alsın.',
    icon: Siren,
    db_field: 'is_urgent_premium',
    prices: [
      { duration: 7, price: 51, label: '1 Hafta' },
      { duration: 14, price: 90, label: '2 Hafta' },
    ],
  },
  {
    id: 'featured',
    title: 'Öne Çıkarılanlar',
    description: 'İlanınız ana sayfada "Öne Çıkarılanlar" bölümünde sergilensin, daha fazla kişiye ulaşsın.',
    icon: Rocket,
    db_field: 'is_featured',
    prices: [
      { duration: 7, price: 75, label: '1 Hafta' },
      { duration: 30, price: 250, label: '1 Ay' },
    ],
  },
  {
    id: 'bold_border',
    title: 'Kalın Yazı & Renkli Çerçeve',
    description: 'Arama sonuç listelerinde ilanınız kalın yazı ve renkli çerçeveyle benzerlerinden hemen ayrılsın.',
    icon: Palette,
    db_field: 'has_bold_border',
    prices: [
      { duration: 0, price: 51, label: 'İlan Yayın Süresince' },
    ],
  },
]

