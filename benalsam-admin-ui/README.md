# BenAlsam Admin UI

Modern React tabanlı admin dashboard uygulaması.

## 🚀 Özellikler

- **Modern UI/UX**: Material-UI ile tasarlanmış responsive arayüz
- **TypeScript**: Tam tip güvenliği
- **State Management**: Zustand ile global state yönetimi
- **API Integration**: Axios ile backend entegrasyonu
- **Routing**: React Router ile sayfa yönetimi
- **Icons**: Lucide React icon set
- **Charts**: Recharts ile veri görselleştirme
- **Data Grid**: MUI X Data Grid ile tablo yönetimi

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn
- Admin Backend API (port 3002)

## 🛠️ Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Environment dosyasını oluşturun:**
   ```bash
   cp .env.example .env
   ```

3. **Environment değişkenlerini düzenleyin:**
   ```env
   VITE_API_URL=http://localhost:3002
   VITE_APP_NAME=BenAlsam Admin Panel
   VITE_APP_VERSION=1.0.0
   ```

## 🚀 Çalıştırma

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 📁 Proje Yapısı

```
src/
├── components/          # UI bileşenleri
│   └── Layout/         # Layout bileşenleri
├── pages/              # Sayfa bileşenleri
├── services/           # API servisleri
├── stores/             # Zustand store'ları
├── types/              # TypeScript tipleri
└── App.tsx             # Ana uygulama
```

## 🔐 Kimlik Doğrulama

Test hesabı:
- **E-posta**: admin@benalsam.com
- **Şifre**: admin123456

## 📊 Dashboard Özellikleri

- **Genel İstatistikler**: Kullanıcı, ilan, kategori sayıları
- **Kullanıcı Yönetimi**: Kullanıcı listesi, düzenleme, silme
- **İlan Yönetimi**: İlan moderasyonu, durum güncelleme
- **Kategori Yönetimi**: Kategori CRUD işlemleri
- **Analytics**: Grafik ve raporlar
- **Sistem Ayarları**: Uygulama konfigürasyonu
- **Bildirimler**: Sistem bildirimleri

## 🎨 Tema

Material-UI tema sistemi kullanılarak özelleştirilebilir tasarım.

## 🔧 Geliştirme

### Yeni Sayfa Ekleme
1. `src/pages/` klasörüne yeni sayfa bileşeni oluşturun
2. `src/App.tsx`'e route ekleyin
3. `src/components/Layout/Sidebar.tsx`'e menü öğesi ekleyin

### API Entegrasyonu
1. `src/services/api.ts`'e yeni endpoint ekleyin
2. `src/types/index.ts`'e tip tanımları ekleyin
3. React Query ile veri yönetimi yapın

## 📦 Build

```bash
npm run build
```

Build dosyaları `dist/` klasöründe oluşturulur.

## 🚀 Deployment

1. Build alın: `npm run build`
2. `dist/` klasörünü web sunucusuna yükleyin
3. Environment değişkenlerini production'da ayarlayın

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request gönderin

## 📱 Responsive Tasarım

Admin UI responsive tasarım için kapsamlı bir TODO listesi bulunmaktadır:

📋 **[Responsive TODO Listesi](./RESPONSIVE_TODO.md)**

### Responsive Durum
- ✅ **Desktop**: Tam responsive
- 🔄 **Tablet**: Kısmi responsive (devam ediyor)
- ❌ **Mobil**: Responsive sorunları mevcut

### Responsive Test
Farklı cihaz boyutlarında test etmek için:
1. Chrome DevTools'da Responsive Design Mode kullanın
2. Farklı breakpoint'leri test edin (xs, sm, md, lg, xl)
3. Touch interactions'ları kontrol edin

## 📄 Lisans

MIT License
