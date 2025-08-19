# 🚀 SEO Optimizasyonu

Bu dosya BenAlsam projesinin SEO optimizasyonlarını açıklar.

## ✅ **Mevcut SEO Özellikleri**

### 1. **Meta Tag'ler**
- ✅ Title, description, keywords
- ✅ Open Graph (Facebook, Twitter)
- ✅ Canonical URL
- ✅ Robots meta tag
- ✅ Language ve geo meta tag'ler

### 2. **Structured Data (JSON-LD)**
- ✅ Website schema
- ✅ Organization schema  
- ✅ Product schema (ilan detayları için)
- ✅ Search action schema

### 3. **Sitemap ve Robots**
- ✅ `robots.txt` dosyası
- ✅ `sitemap.xml` (statik ve dinamik)
- ✅ Sitemap generator script'i

### 4. **PWA Desteği**
- ✅ `manifest.json`
- ✅ Service worker hazırlığı
- ✅ App icons

### 5. **Performance Optimizasyonları**
- ✅ Critical CSS inline
- ✅ Resource preloading
- ✅ DNS prefetch
- ✅ Image optimization

## 🔧 **Kullanım**

### Dinamik SEO
```jsx
import SEOHead from '@/components/SEOHead';
import StructuredData from '@/components/StructuredData';

// Ana sayfa
<SEOHead 
  title="BenAlsam - Alım İlanları Platformu"
  description="İhtiyacınız olan ürün ve hizmetler için alım ilanı verin"
  keywords="alım ilanı, teklif alma"
/>
<StructuredData type="website" />

// İlan detay sayfası
<SEOHead 
  title={`${listing.title} - BenAlsam`}
  description={listing.description}
  image={listing.image_url}
  type="product"
/>
<StructuredData 
  type="listing" 
  data={{
    title: listing.title,
    price: listing.price,
    seller_name: listing.user.name
  }}
/>
```

### Sitemap Oluşturma
```bash
# Manuel sitemap oluşturma
npm run generate-sitemap

# SEO build (sitemap + build)
npm run seo-build
```

## 📊 **SEO Metrikleri**

### Google Search Console
- ✅ Sitemap submit edildi
- ✅ Robots.txt kontrol edildi
- ✅ Meta tag'ler optimize edildi

### Lighthouse Score Hedefleri
- ✅ Performance: 90+
- ✅ Accessibility: 95+
- ✅ Best Practices: 95+
- ✅ SEO: 95+

## 🎯 **Gelecek İyileştirmeler**

### 1. **Blog/İçerik SEO**
- [ ] Blog sayfası
- [ ] Kategori sayfaları
- [ ] İçerik optimizasyonu

### 2. **Local SEO**
- [ ] Google My Business entegrasyonu
- [ ] Local schema markup
- [ ] Konum bazlı arama

### 3. **E-ticaret SEO**
- [ ] Product schema geliştirme
- [ ] Review schema
- [ ] Price schema

### 4. **Technical SEO**
- [ ] Core Web Vitals optimizasyonu
- [ ] Image lazy loading
- [ ] Code splitting

## 📝 **Notlar**

- Sitemap her gün otomatik güncellenmeli
- Yeni sayfa eklendiğinde SEOHead component'i kullanılmalı
- İlan detay sayfalarında structured data zorunlu
- Performance monitoring devam etmeli

## 🔗 **Faydalı Linkler**

- [Google Search Console](https://search.google.com/search-console)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema.org](https://schema.org/)
- [Meta Tags Checker](https://metatags.io/)
