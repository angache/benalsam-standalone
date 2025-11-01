/**
 * Seed 100 Unique Realistic Listings
 * Diverse categories, locations, budgets
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const USER_IDS = [
  '19a6dcfc-5f3a-494e-ad98-02bcfb135462',
  '3b098846-d952-4ef5-b250-df2b31d0eb15',
  '4d76d17f-b78e-4bc6-a779-0a3eb14ee826',
  '6417b4a3-021b-4649-a83f-a3c9ccbaf522',
  '96d5ffce-6fdc-466c-8b05-a0d8cbf5dc8d',
  'dff1eb99-c85e-49e8-81af-2ba72dd54c2b',
  'e9ae9253-752a-4abe-b0c9-0ee92f81e9c9',
]

const CITIES = ['İzmir', 'İstanbul', 'Ankara', 'Bursa', 'Antalya', 'Adana', 'Konya']
const URGENCIES = ['normal', 'normal', 'normal', 'urgent', 'very_urgent'] // Weight normal

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function buildCategoryPath(categoryId: number): Promise<number[]> {
  try {
    const path: number[] = []
    let currentId: number | null = categoryId

    while (currentId !== null) {
      const { data } = await supabase
        .from('categories')
        .select('id, parent_id')
        .eq('id', currentId)
        .single()

      if (!data) break
      path.unshift(data.id)
      currentId = data.parent_id
    }

    return path
  } catch (error) {
    return [categoryId]
  }
}

async function fetchUnsplashImage(keyword: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-unsplash-images', {
      body: { query: keyword }
    })

    if (error) throw error
    if (data?.images && data.images.length > 0) {
      return data.images[0].urls.regular
    }

    return `https://source.unsplash.com/800x600/?${keyword}`
  } catch (error) {
    return `https://source.unsplash.com/800x600/?${keyword}`
  }
}

// ============================================================================
// 120 UNIQUE LISTINGS
// ============================================================================

const LISTINGS = [
  // ELEKTRONİK - TELEFONLAR (20)
  { title: 'iPhone 15 Pro 128GB Siyah arıyorum [TEST]', desc: 'iPhone 15 Pro arıyorum. Siyah renk, 128GB. Garantili olmalı.', cat: 502, budget: 58000, img: 'iphone 15 pro black', attrs: { brand: ['Apple'], storage: ['128GB'], color: ['Siyah'] } },
  { title: 'iPhone 14 Pro Max 256GB arıyorum [TEST]', desc: 'iPhone 14 Pro Max arıyorum. 256GB, mor renk tercihim.', cat: 502, budget: 52000, img: 'iphone 14 pro max purple', attrs: { brand: ['Apple'], storage: ['256GB'] } },
  { title: 'iPhone 13 128GB arıyorum [TEST]', desc: 'iPhone 13 arıyorum. Renk farketmez, temiz olsun.', cat: 502, budget: 35000, img: 'iphone 13', attrs: { brand: ['Apple'], storage: ['128GB'] } },
  { title: 'Samsung S23 Ultra arıyorum [TEST]', desc: 'Samsung Galaxy S23 Ultra arıyorum. 512GB, siyah renk.', cat: 502, budget: 48000, img: 'samsung s23 ultra', attrs: { brand: ['Samsung'], storage: ['512GB'] } },
  { title: 'Samsung S23 FE arıyorum [TEST]', desc: 'Samsung S23 FE arıyorum. 256GB yeterli.', cat: 502, budget: 28000, img: 'samsung s23 fe', attrs: { brand: ['Samsung'] } },
  { title: 'Google Pixel 8 Pro arıyorum [TEST]', desc: 'Google Pixel 8 Pro arıyorum. Fotoğraf kalitesi önemli.', cat: 502, budget: 42000, img: 'google pixel 8 pro', attrs: { brand: ['Google'] } },
  { title: 'Xiaomi 14 Pro arıyorum [TEST]', desc: 'Xiaomi 14 Pro arıyorum. 512GB, beyaz renk.', cat: 502, budget: 32000, img: 'xiaomi 14 pro', attrs: { brand: ['Xiaomi'], storage: ['512GB'] } },
  { title: 'OnePlus 12 arıyorum [TEST]', desc: 'OnePlus 12 arıyorum. Hızlı şarj önemli.', cat: 502, budget: 35000, img: 'oneplus 12', attrs: { brand: ['OnePlus'] } },
  { title: 'iPhone SE 2022 arıyorum [TEST]', desc: 'iPhone SE 2022 arıyorum. Küçük telefon seviyorum.', cat: 502, budget: 18000, img: 'iphone se', attrs: { brand: ['Apple'] } },
  { title: 'Samsung A54 arıyorum [TEST]', desc: 'Samsung A54 arıyorum. Orta segment yeterli.', cat: 502, budget: 15000, img: 'samsung a54', attrs: { brand: ['Samsung'] } },
  { title: 'Oppo Find X6 Pro arıyorum [TEST]', desc: 'Oppo Find X6 Pro arıyorum. Kamera performansı iyi olmalı.', cat: 502, budget: 38000, img: 'oppo find x6', attrs: { brand: ['Oppo'] } },
  { title: 'Realme GT 3 arıyorum [TEST]', desc: 'Realme GT 3 arıyorum. Gaming telefonu tercihim.', cat: 502, budget: 22000, img: 'realme gt 3', attrs: { brand: ['Realme'] } },
  { title: 'Nothing Phone 2 arıyorum [TEST]', desc: 'Nothing Phone 2 arıyorum. Şeffaf tasarımı çok hoş.', cat: 502, budget: 28000, img: 'nothing phone 2', attrs: { brand: ['Nothing'] } },
  { title: 'Asus ROG Phone 7 arıyorum [TEST]', desc: 'Asus ROG Phone 7 gaming telefonu arıyorum.', cat: 502, budget: 45000, img: 'asus rog phone', attrs: { brand: ['Asus'] } },
  { title: 'Sony Xperia 1 V arıyorum [TEST]', desc: 'Sony Xperia 1 Mark 5 arıyorum. Kamera ekranı istiyorum.', cat: 502, budget: 48000, img: 'sony xperia', attrs: { brand: ['Sony'] } },
  { title: 'Motorola Edge 40 Pro arıyorum [TEST]', desc: 'Motorola Edge 40 Pro arıyorum. Temiz Android deneyimi.', cat: 502, budget: 26000, img: 'motorola edge', attrs: { brand: ['Motorola'] } },
  { title: 'Huawei P60 Pro arıyorum [TEST]', desc: 'Huawei P60 Pro arıyorum. Kamera kalitesi mükemmel olmalı.', cat: 502, budget: 35000, img: 'huawei p60', attrs: { brand: ['Huawei'] } },
  { title: 'Vivo X90 Pro arıyorum [TEST]', desc: 'Vivo X90 Pro arıyorum. Zeiss lens tercihim.', cat: 502, budget: 40000, img: 'vivo x90 pro', attrs: { brand: ['Vivo'] } },
  { title: 'Honor Magic 5 Pro arıyorum [TEST]', desc: 'Honor Magic 5 Pro arıyorum. Hızlı performans istiyorum.', cat: 502, budget: 32000, img: 'honor magic 5', attrs: { brand: ['Honor'] } },
  { title: 'ZTE Axon 50 Ultra arıyorum [TEST]', desc: 'ZTE Axon 50 Ultra arıyorum. Uygun fiyatlı flagship.', cat: 502, budget: 24000, img: 'zte axon', attrs: { brand: ['ZTE'] } },

  // ELEKTRONİK - LAPTOPLAR (15)
  { title: 'MacBook Pro M3 14 inch arıyorum [TEST]', desc: 'MacBook Pro M3 14 inch arıyorum. 16GB RAM, 512GB SSD.', cat: 502, budget: 75000, img: 'macbook pro m3', attrs: { brand: ['Apple'], storage: ['512GB'] } },
  { title: 'MacBook Air M1 arıyorum [TEST]', desc: 'MacBook Air M1 arıyorum. Giriş seviyesi yeterli.', cat: 502, budget: 32000, img: 'macbook air m1', attrs: { brand: ['Apple'] } },
  { title: 'Dell XPS 15 arıyorum [TEST]', desc: 'Dell XPS 15 arıyorum. 4K ekran, i7 işlemci.', cat: 502, budget: 55000, img: 'dell xps 15', attrs: { brand: ['Dell'] } },
  { title: 'Lenovo ThinkPad X1 Carbon arıyorum [TEST]', desc: 'ThinkPad X1 Carbon arıyorum. İş için kullanacağım.', cat: 502, budget: 48000, img: 'thinkpad x1 carbon', attrs: { brand: ['Lenovo'] } },
  { title: 'HP Spectre x360 arıyorum [TEST]', desc: 'HP Spectre x360 2-in-1 laptop arıyorum.', cat: 502, budget: 42000, img: 'hp spectre x360', attrs: { brand: ['HP'] } },
  { title: 'Asus ROG Zephyrus G14 arıyorum [TEST]', desc: 'Asus ROG Zephyrus gaming laptop arıyorum. RTX 4060 olmalı.', cat: 502, budget: 58000, img: 'asus rog zephyrus', attrs: { brand: ['Asus'] } },
  { title: 'MSI Katana GF66 arıyorum [TEST]', desc: 'MSI gaming laptop arıyorum. Orta segment yeterli.', cat: 502, budget: 35000, img: 'msi gaming laptop', attrs: { brand: ['MSI'] } },
  { title: 'Razer Blade 15 arıyorum [TEST]', desc: 'Razer Blade 15 arıyorum. Taşınabilir gaming.', cat: 502, budget: 72000, img: 'razer blade 15', attrs: { brand: ['Razer'] } },
  { title: 'Microsoft Surface Laptop 5 arıyorum [TEST]', desc: 'Surface Laptop 5 arıyorum. Touch ekran önemli.', cat: 502, budget: 38000, img: 'surface laptop', attrs: { brand: ['Microsoft'] } },
  { title: 'Acer Swift 3 arıyorum [TEST]', desc: 'Acer Swift 3 arıyorum. Öğrenci için uygun.', cat: 502, budget: 22000, img: 'acer swift', attrs: { brand: ['Acer'] } },
  { title: 'LG Gram 17 arıyorum [TEST]', desc: 'LG Gram 17 inch arıyorum. Hafif olmalı.', cat: 502, budget: 45000, img: 'lg gram 17', attrs: { brand: ['LG'] } },
  { title: 'Samsung Galaxy Book3 Pro arıyorum [TEST]', desc: 'Samsung Galaxy Book3 Pro arıyorum. AMOLED ekran.', cat: 502, budget: 42000, img: 'samsung galaxy book', attrs: { brand: ['Samsung'] } },
  { title: 'Huawei MateBook X Pro arıyorum [TEST]', desc: 'Huawei MateBook X Pro arıyorum. Premium yapı.', cat: 502, budget: 38000, img: 'huawei matebook', attrs: { brand: ['Huawei'] } },
  { title: 'Asus Vivobook S15 arıyorum [TEST]', desc: 'Asus Vivobook arıyorum. Günlük kullanım için.', cat: 502, budget: 25000, img: 'asus vivobook', attrs: { brand: ['Asus'] } },
  { title: 'Lenovo IdeaPad Gaming 3 arıyorum [TEST]', desc: 'Lenovo IdeaPad Gaming arıyorum. Bütçe dostu.', cat: 502, budget: 28000, img: 'lenovo ideapad gaming', attrs: { brand: ['Lenovo'] } },

  // ELEKTRONİK - TABLETdocument (10)
  { title: 'iPad Air 5 arıyorum [TEST]', desc: 'iPad Air 5. nesil arıyorum. 256GB, wifi model.', cat: 502, budget: 24000, img: 'ipad air 5', attrs: { brand: ['Apple'], storage: ['256GB'] } },
  { title: 'iPad Mini 6 arıyorum [TEST]', desc: 'iPad Mini 6 arıyorum. Küçük tablet seviyorum.', cat: 502, budget: 18000, img: 'ipad mini 6', attrs: { brand: ['Apple'] } },
  { title: 'Samsung Tab S9 arıyorum [TEST]', desc: 'Samsung Tab S9 arıyorum. S Pen ile olmalı.', cat: 502, budget: 26000, img: 'samsung tab s9', attrs: { brand: ['Samsung'] } },
  { title: 'Samsung Tab S8 FE arıyorum [TEST]', desc: 'Tab S8 FE arıyorum. Orta segment yeterli.', cat: 502, budget: 16000, img: 'samsung tab s8 fe', attrs: { brand: ['Samsung'] } },
  { title: 'Xiaomi Pad 6 arıyorum [TEST]', desc: 'Xiaomi Pad 6 arıyorum. Uygun fiyatlı tablet.', cat: 502, budget: 12000, img: 'xiaomi pad 6', attrs: { brand: ['Xiaomi'] } },
  { title: 'Lenovo Tab P11 Pro arıyorum [TEST]', desc: 'Lenovo Tab P11 Pro arıyorum. OLED ekran olsun.', cat: 502, budget: 15000, img: 'lenovo tab p11', attrs: { brand: ['Lenovo'] } },
  { title: 'Huawei MatePad Pro arıyorum [TEST]', desc: 'Huawei MatePad Pro arıyorum. M-Pencil destekli.', cat: 502, budget: 18000, img: 'huawei matepad', attrs: { brand: ['Huawei'] } },
  { title: 'Microsoft Surface Pro 9 arıyorum [TEST]', desc: 'Surface Pro 9 arıyorum. Keyboard ile birlikte.', cat: 502, budget: 45000, img: 'surface pro 9', attrs: { brand: ['Microsoft'] } },
  { title: 'Amazon Fire HD 10 arıyorum [TEST]', desc: 'Amazon Fire HD arıyorum. Basit kullanım için.', cat: 502, budget: 4000, img: 'amazon fire tablet', attrs: { brand: ['Amazon'] } },
  { title: 'Onyx Boox Tab Ultra arıyorum [TEST]', desc: 'E-ink tablet arıyorum. Okumak için kullanacağım.', cat: 502, budget: 22000, img: 'e-ink tablet', attrs: { brand: ['Onyx'] } },

  // ELEKTRONİK - OYUN KONSOLLARIı (8)
  { title: 'PlayStation 5 Disk Edition arıyorum [TEST]', desc: 'PS5 Disk Edition arıyorum. 2 kol olursa süper.', cat: 502, budget: 22000, img: 'playstation 5 disk', attrs: { brand: ['Sony'] } },
  { title: 'Xbox Series X arıyorum [TEST]', desc: 'Xbox Series X arıyorum. Game Pass aboneliği ile.', cat: 502, budget: 20000, img: 'xbox series x', attrs: { brand: ['Microsoft'] } },
  { title: 'Nintendo Switch OLED arıyorum [TEST]', desc: 'Nintendo Switch OLED arıyorum. Zelda oyunu ile.', cat: 502, budget: 12000, img: 'nintendo switch oled', attrs: { brand: ['Nintendo'] } },
  { title: 'Steam Deck 512GB arıyorum [TEST]', desc: 'Steam Deck arıyorum. PC oyunlarını taşınabilir oynamak için.', cat: 502, budget: 25000, img: 'steam deck', attrs: { brand: ['Valve'], storage: ['512GB'] } },
  { title: 'Asus ROG Ally arıyorum [TEST]', desc: 'ROG Ally handheld console arıyorum.', cat: 502, budget: 28000, img: 'rog ally', attrs: { brand: ['Asus'] } },
  { title: 'Meta Quest 3 arıyorum [TEST]', desc: 'Meta Quest 3 VR başlığı arıyorum.', cat: 502, budget: 18000, img: 'meta quest 3', attrs: { brand: ['Meta'] } },
  { title: 'PlayStation VR2 arıyorum [TEST]', desc: 'PS VR2 arıyorum. Horizon oyunu ile olursa harika.', cat: 502, budget: 15000, img: 'playstation vr2', attrs: { brand: ['Sony'] } },
  { title: 'Xbox Elite Controller Series 2 arıyorum [TEST]', desc: 'Xbox Elite Controller arıyorum. Pro gaming için.', cat: 502, budget: 5000, img: 'xbox elite controller', attrs: { brand: ['Microsoft'] } },

  // ELEKTRONİK - KULAKLIK & SES (10)
  { title: 'AirPods Pro 2 arıyorum [TEST]', desc: 'AirPods Pro 2. nesil arıyorum. USB-C modeli.', cat: 502, budget: 8500, img: 'airpods pro 2', attrs: { brand: ['Apple'] } },
  { title: 'Sony WH-1000XM5 arıyorum [TEST]', desc: 'Sony WH-1000XM5 kulaklık arıyorum. Gürültü engelleme şart.', cat: 502, budget: 12000, img: 'sony wh1000xm5', attrs: { brand: ['Sony'] } },
  { title: 'Bose QC45 arıyorum [TEST]', desc: 'Bose QuietComfort 45 arıyorum. Konforlu olmalı.', cat: 502, budget: 9000, img: 'bose qc45', attrs: { brand: ['Bose'] } },
  { title: 'Samsung Galaxy Buds2 Pro arıyorum [TEST]', desc: 'Galaxy Buds2 Pro arıyorum. Samsung telefonumla uyumlu.', cat: 502, budget: 4500, img: 'galaxy buds pro', attrs: { brand: ['Samsung'] } },
  { title: 'Beats Studio Pro arıyorum [TEST]', desc: 'Beats Studio Pro arıyorum. Bass kalitesi önemli.', cat: 502, budget: 11000, img: 'beats studio pro', attrs: { brand: ['Beats'] } },
  { title: 'JBL Flip 6 Bluetooth Hoparlör arıyorum [TEST]', desc: 'JBL Flip 6 arıyorum. Suya dayanıklı olmalı.', cat: 502, budget: 3500, img: 'jbl flip 6', attrs: { brand: ['JBL'] } },
  { title: 'Marshall Emberton II arıyorum [TEST]', desc: 'Marshall Emberton II hoparlör arıyorum. Vintage tasarım.', cat: 502, budget: 6000, img: 'marshall emberton', attrs: { brand: ['Marshall'] } },
  { title: 'Sennheiser Momentum 4 arıyorum [TEST]', desc: 'Sennheiser Momentum 4 arıyorum. Audiophile kalite.', cat: 502, budget: 13000, img: 'sennheiser momentum', attrs: { brand: ['Sennheiser'] } },
  { title: 'Anker Soundcore Life Q35 arıyorum [TEST]', desc: 'Anker kulaklık arıyorum. Bütçe dostu ANC.', cat: 502, budget: 2500, img: 'anker soundcore', attrs: { brand: ['Anker'] } },
  { title: 'Jabra Elite 85h arıyorum [TEST]', desc: 'Jabra Elite 85h arıyorum. Arama kalitesi önemli.', cat: 502, budget: 7000, img: 'jabra elite', attrs: { brand: ['Jabra'] } },

  // ELEKTRONİK - SAAT & GIYILEBILIR (8)
  { title: 'Apple Watch Series 9 arıyorum [TEST]', desc: 'Apple Watch 9 arıyorum. 45mm, GPS+Cellular.', cat: 502, budget: 18000, img: 'apple watch 9', attrs: { brand: ['Apple'] } },
  { title: 'Apple Watch Ultra 2 arıyorum [TEST]', desc: 'Apple Watch Ultra 2 arıyorum. Spor için kullanacağım.', cat: 502, budget: 32000, img: 'apple watch ultra', attrs: { brand: ['Apple'] } },
  { title: 'Samsung Galaxy Watch 6 Classic arıyorum [TEST]', desc: 'Galaxy Watch 6 Classic arıyorum. Çerçeveli model.', cat: 502, budget: 12000, img: 'galaxy watch 6', attrs: { brand: ['Samsung'] } },
  { title: 'Garmin Fenix 7 arıyorum [TEST]', desc: 'Garmin Fenix 7 arıyorum. Outdoor aktiviteler için.', cat: 502, budget: 22000, img: 'garmin fenix 7', attrs: { brand: ['Garmin'] } },
  { title: 'Fitbit Charge 6 arıyorum [TEST]', desc: 'Fitbit Charge 6 fitness tracker arıyorum.', cat: 502, budget: 4500, img: 'fitbit charge 6', attrs: { brand: ['Fitbit'] } },
  { title: 'Xiaomi Mi Band 8 arıyorum [TEST]', desc: 'Xiaomi Mi Band 8 arıyorum. Uygun fiyatlı tracker.', cat: 502, budget: 1200, img: 'xiaomi mi band', attrs: { brand: ['Xiaomi'] } },
  { title: 'Huawei Watch GT 4 arıyorum [TEST]', desc: 'Huawei Watch GT 4 arıyorum. Uzun pil ömrü.', cat: 502, budget: 8000, img: 'huawei watch gt', attrs: { brand: ['Huawei'] } },
  { title: 'Polar Vantage V3 arıyorum [TEST]', desc: 'Polar Vantage arıyorum. Profesyonel koşu için.', cat: 502, budget: 15000, img: 'polar vantage', attrs: { brand: ['Polar'] } },

  // EMLAK - SATILIK (12)
  { title: '3+1 Satılık Daire Alsancak [TEST]', desc: '3+1 satılık daire arıyorum Alsancakta. Deniz manzaralı.', cat: 620, budget: 8500000, img: 'modern apartment sea view', attrs: { rooms: ['3+1'] } },
  { title: '2+1 Satılık Daire Bostanlı [TEST]', desc: '2+1 satılık daire Bostanlıda. Site içi.', cat: 620, budget: 4200000, img: 'apartment building', attrs: { rooms: ['2+1'] } },
  { title: '4+1 Satılık Daire Mavişehir [TEST]', desc: '4+1 geniş daire Mavişehirde. 180m².', cat: 620, budget: 9500000, img: 'spacious apartment', attrs: { rooms: ['4+1'] } },
  { title: '1+1 Satılık Stüdyo Çankaya [TEST]', desc: '1+1 stüdyo daire Çankayada. Yatırımlık.', cat: 620, budget: 2800000, img: 'studio apartment', attrs: { rooms: ['1+1'] } },
  { title: 'Satılık Müstakil Ev Urla [TEST]', desc: 'Urlada bahçeli müstakil ev arıyorum.', cat: 620, budget: 12000000, img: 'detached house garden', attrs: { rooms: ['4+1', '5+1'] } },
  { title: 'Satılık Dublex Narlıdere [TEST]', desc: 'Dublex villa Narlıdereinicinde. Havuzlu site.', cat: 620, budget: 15000000, img: 'duplex villa pool', attrs: { rooms: ['4+2'] } },
  { title: 'Satılık Çatı Katı Bornova [TEST]', desc: 'Çatı katı çıkmalı daire Bornovada.', cat: 620, budget: 6500000, img: 'penthouse apartment', attrs: { rooms: ['3+1'] } },
  { title: 'Satılık Bahçe Katı Güzelbahçe [TEST]', desc: 'Bahçe katı daire Güzelbahçede. Özel bahçeli.', cat: 620, budget: 5200000, img: 'garden floor apartment', attrs: { rooms: ['2+1'] } },
  { title: 'Satılık Loft Konak [TEST]', desc: 'Loft daire Konakta. Modern tasarım.', cat: 620, budget: 7500000, img: 'loft apartment modern', attrs: { rooms: ['2+1'] } },
  { title: 'Satılık İşyeri Çankaya [TEST]', desc: 'Çankayada satılık dükkan arıyorum. Ana cadde üzeri.', cat: 620, budget: 3500000, img: 'commercial shop', attrs: {} },
  { title: 'Satılık Arsa Çeşme [TEST]', desc: 'Çeşmede denize yakın arsa arıyorum. İmarlı.', cat: 620, budget: 6000000, img: 'land plot sea', attrs: {} },
  { title: 'Satılık Ofis Konak [TEST]', desc: 'Konakta ofis arıyorum. 100m² civarı.', cat: 620, budget: 4500000, img: 'modern office space', attrs: {} },

  // EMLAK - KİRALIK (10)
  { title: '2+1 Kiralık Daire Alsancak [TEST]', desc: '2+1 kiralık daire Alsancakta. Eşyalı, deniz manzaralı.', cat: 620, budget: 35000, img: 'furnished apartment', attrs: { rooms: ['2+1'] } },
  { title: '3+1 Kiralık Ev Bornova [TEST]', desc: '3+1 kiralık ev Bornovada. Bahçeli, müstakil.', cat: 620, budget: 28000, img: 'house for rent', attrs: { rooms: ['3+1'] } },
  { title: '1+1 Kiralık Stüdyo Konak [TEST]', desc: '1+1 kiralık stüdyo Konakta. Öğrenci için uygun.', cat: 620, budget: 15000, img: 'studio rent', attrs: { rooms: ['1+1'] } },
  { title: 'Kiralık Villa Çeşme [TEST]', desc: 'Çeşmede kiralık yazlık villa arıyorum. Haziran-Eylül.', cat: 620, budget: 85000, img: 'summer villa', attrs: { rooms: ['4+1'] } },
  { title: 'Kiralık Dublex Bayraklı [TEST]', desc: 'Dublex kiralık daire Bayraklıda. Site içi.', cat: 620, budget: 32000, img: 'duplex rent', attrs: { rooms: ['3+2'] } },
  { title: 'Kiralık Daire Karşıyaka Metro Yanı [TEST]', desc: 'Metro yanı kiralık daire Karşıyakada. Ulaşım kolay.', cat: 620, budget: 24000, img: 'apartment metro', attrs: { rooms: ['2+1'] } },
  { title: 'Kiralık Penthouse Alsancak [TEST]', desc: 'Penthouse arıyorum Alsancakta. Lüks yapılı.', cat: 620, budget: 75000, img: 'luxury penthouse', attrs: { rooms: ['4+1'] } },
  { title: 'Kiralık Ofis Konak [TEST]', desc: 'Kiralık ofis Konakta. 80m², merkezi konum.', cat: 620, budget: 18000, img: 'office rent', attrs: {} },
  { title: 'Kiralık Dükkan Alsancak [TEST]', desc: 'Alsancakta kiralık dükkan. Cadde üzeri, 45m².', cat: 620, budget: 25000, img: 'shop rent', attrs: {} },
  { title: 'Kiralık Depo Gaziemir [TEST]', desc: 'Gaziemirde kiralık depo. 200m², loading dock var.', cat: 620, budget: 15000, img: 'warehouse', attrs: {} },

  // VASİTA - ARABALAR (12)
  { title: 'Toyota Corolla 2021 arıyorum [TEST]', desc: 'Toyota Corolla 2021 arıyorum. Hybrid model tercih.', cat: 502, budget: 920000, img: 'toyota corolla white', attrs: { brand: ['Toyota'], color: ['Beyaz'] } },
  { title: 'BMW 3.20i 2019 arıyorum [TEST]', desc: 'BMW 3 Serisi arıyorum. Otomatik vites.', cat: 502, budget: 1250000, img: 'bmw 3 series', attrs: { brand: ['BMW'] } },
  { title: 'Mercedes C180 2020 arıyorum [TEST]', desc: 'Mercedes C180 arıyorum. Siyah renk, full paket.', cat: 502, budget: 1400000, img: 'mercedes c class', attrs: { brand: ['Mercedes'], color: ['Siyah'] } },
  { title: 'Audi A3 Sedan 2021 arıyorum [TEST]', desc: 'Audi A3 Sedan arıyorum. Gri renk tercihim.', cat: 502, budget: 1150000, img: 'audi a3 sedan', attrs: { brand: ['Audi'], color: ['Gri'] } },
  { title: 'Renault Clio 2022 arıyorum [TEST]', desc: 'Renault Clio 2022 arıyorum. Ekonomik yakıt.', cat: 502, budget: 650000, img: 'renault clio', attrs: { brand: ['Renault'] } },
  { title: 'Fiat Egea 2020 arıyorum [TEST]', desc: 'Fiat Egea arıyorum. Manuel vites olabilir.', cat: 502, budget: 580000, img: 'fiat egea', attrs: { brand: ['Fiat'] } },
  { title: 'Hyundai i20 2021 arıyorum [TEST]', desc: 'Hyundai i20 arıyorum. Şehir içi kullanım.', cat: 502, budget: 620000, img: 'hyundai i20', attrs: { brand: ['Hyundai'] } },
  { title: 'Nissan Qashqai 2020 arıyorum [TEST]', desc: 'Nissan Qashqai SUV arıyorum. Ailemizle kullanacağız.', cat: 502, budget: 980000, img: 'nissan qashqai', attrs: { brand: ['Nissan'] } },
  { title: 'Mazda CX-5 2021 arıyorum [TEST]', desc: 'Mazda CX-5 arıyorum. Güvenlik donanımları tam olsun.', cat: 502, budget: 1150000, img: 'mazda cx5', attrs: { brand: ['Mazda'] } },
  { title: 'Skoda Octavia 2020 arıyorum [TEST]', desc: 'Skoda Octavia arıyorum. Bagaj hacmi geniş olmalı.', cat: 502, budget: 850000, img: 'skoda octavia', attrs: { brand: ['Skoda'] } },
  { title: 'Peugeot 2008 2022 arıyorum [TEST]', desc: 'Peugeot 2008 crossover arıyorum. Yüksek sürüş.', cat: 502, budget: 780000, img: 'peugeot 2008', attrs: { brand: ['Peugeot'] } },
  { title: 'Dacia Duster 2021 arıyorum [TEST]', desc: 'Dacia Duster arıyorum. Off-road yetenekli.', cat: 502, budget: 620000, img: 'dacia duster', attrs: { brand: ['Dacia'] } },

  // MODA - AYAKKABI (7)
  { title: 'Adidas Ultraboost 23 arıyorum [TEST]', desc: 'Adidas Ultraboost arıyorum. 43 numara, siyah.', cat: 502, budget: 4500, img: 'adidas ultraboost', attrs: { brand: ['Adidas'] } },
  { title: 'New Balance 990v6 arıyorum [TEST]', desc: 'New Balance 990 arıyorum. Gri renk, 42 numara.', cat: 502, budget: 5500, img: 'new balance 990', attrs: { brand: ['New Balance'] } },
  { title: 'Converse Chuck Taylor arıyorum [TEST]', desc: 'Converse high-top arıyorum. Klasik siyah, 41.', cat: 502, budget: 1800, img: 'converse black', attrs: { brand: ['Converse'] } },
  { title: 'Vans Old Skool arıyorum [TEST]', desc: 'Vans Old Skool arıyorum. Siyah-beyaz, 43.', cat: 502, budget: 2200, img: 'vans old skool', attrs: { brand: ['Vans'] } },
  { title: 'Puma RS-X arıyorum [TEST]', desc: 'Puma RS-X arıyorum. Renkli model, 42.', cat: 502, budget: 3200, img: 'puma rsx', attrs: { brand: ['Puma'] } },
  { title: 'Reebok Club C 85 arıyorum [TEST]', desc: 'Reebok Club C arıyorum. Beyaz deri, 41.', cat: 502, budget: 2800, img: 'reebok club c', attrs: { brand: ['Reebok'] } },
  { title: 'Skechers Go Walk arıyorum [TEST]', desc: 'Skechers yürüyüş ayakkabısı arıyorum. Rahat olmalı.', cat: 502, budget: 1500, img: 'skechers walking', attrs: { brand: ['Skechers'] } },

  // DİĞER - KAMERA & FOTOĞRAFıç (8)
  { title: 'Sony A7 IV arıyorum [TEST]', desc: 'Sony A7 IV fotoğraf makinesi arıyorum. 24-70mm lens ile.', cat: 502, budget: 85000, img: 'sony a7 iv', attrs: { brand: ['Sony'] } },
  { title: 'Nikon Z6 III arıyorum [TEST]', desc: 'Nikon Z6 III arıyorum. Video çekimi yapacağım.', cat: 502, budget: 78000, img: 'nikon z6', attrs: { brand: ['Nikon'] } },
  { title: 'Fujifilm X-T5 arıyorum [TEST]', desc: 'Fujifilm X-T5 arıyorum. Retro tasarımı hoşuma gidiyor.', cat: 502, budget: 68000, img: 'fujifilm xt5', attrs: { brand: ['Fujifilm'] } },
  { title: 'Canon EOS R5 arıyorum [TEST]', desc: 'Canon EOS R5 arıyorum. 8K video çekmek için.', cat: 502, budget: 125000, img: 'canon eos r5', attrs: { brand: ['Canon'] } },
  { title: 'GoPro Hero 12 Black arıyorum [TEST]', desc: 'GoPro Hero 12 arıyorum. Extreme sports çekimi.', cat: 502, budget: 15000, img: 'gopro hero 12', attrs: { brand: ['GoPro'] } },
  { title: 'DJI Mavic 3 Pro Drone arıyorum [TEST]', desc: 'DJI Mavic 3 Pro drone arıyorum. Hasselblad kameralı.', cat: 502, budget: 95000, img: 'dji mavic 3', attrs: { brand: ['DJI'] } },
  { title: 'Insta360 X3 arıyorum [TEST]', desc: 'Insta360 X3 360 derece kamera arıyorum.', cat: 502, budget: 12000, img: 'insta360 x3', attrs: { brand: ['Insta360'] } },
  { title: 'Zhiyun Crane 4 Gimbal arıyorum [TEST]', desc: 'Zhiyun Crane gimbal stabilizer arıyorum.', cat: 502, budget: 18000, img: 'camera gimbal', attrs: { brand: ['Zhiyun'] } },
]

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function createListings() {
  console.log('🚀 Creating 100 realistic test listings...\n')
  console.log(`📊 Total: ${LISTINGS.length} listings\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < LISTINGS.length; i++) {
    const listing = LISTINGS[i]
    const userIndex = i % USER_IDS.length
    const userId = USER_IDS[userIndex]
    const cityIndex = i % CITIES.length
    const city = CITIES[cityIndex]
    const urgency = URGENCIES[i % URGENCIES.length]

    try {
      process.stdout.write(`[${i + 1}/${LISTINGS.length}] ${listing.title.substring(0, 40)}... `)

      // Fetch image
      const imageUrl = await fetchUnsplashImage(listing.img)

      // Get category
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', listing.cat)
        .single()

      if (!category) {
        console.log('❌ Category not found')
        failCount++
        continue
      }

      // Build path
      const categoryPath = await buildCategoryPath(listing.cat)

      // Create
      const { error } = await supabase
        .from('listings')
        .insert({
          user_id: userId,
          title: listing.title,
          description: listing.desc,
          category: category.name,
          category_id: listing.cat,
          category_path: categoryPath,
          budget: listing.budget,
          location: `${city}`,
          urgency: urgency,
          contact_preference: 'both',
          main_image_url: imageUrl,
          additional_image_urls: [],
          status: 'active',
          attributes: listing.attrs,
          accept_terms: true
        })

      if (error) {
        console.log(`❌ ${error.message}`)
        failCount++
      } else {
        console.log('✅')
        successCount++
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 400))

    } catch (error: any) {
      console.log(`❌ ${error.message}`)
      failCount++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 COMPLETED!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('🔗 Test:')
  console.log('   http://localhost:3000')
  console.log('   http://localhost:3000/ilanlar')
}

createListings()

