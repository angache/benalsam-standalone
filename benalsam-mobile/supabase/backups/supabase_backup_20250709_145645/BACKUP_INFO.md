# 🛡️ Supabase Tam Yedek Bilgileri

## 📅 Yedekleme Tarihi
$(date)

## 🎯 Proje Bilgileri
- Proje Adı: BenAlsamExpo
- Supabase Projesi: benalsam2025 (dnwreckpeenhbdtapmxr)
- Yedek Klasörü: $BACKUP_DIR

## ✅ Yedeklenen Bileşenler
- ✅ Migration dosyaları
- ✅ Functions dosyaları (varsa)
- ✅ Config dosyası (varsa)
- ✅ Veritabanı schema dump
- ✅ Tam veritabanı dump

## 📁 Yedek İçeriği
$(ls -la "$BACKUP_DIR" | grep -v "^total")

## 🔧 Geri Yükleme Komutları
```bash
# Schema geri yükle
psql "postgresql://postgres:[PASSWORD]@db.dnwreckpeenhbdtapmxr.supabase.co:5432/postgres" < schema_dump.sql

# Tam veritabanı geri yükle
psql "postgresql://postgres:[PASSWORD]@db.dnwreckpeenhbdtapmxr.supabase.co:5432/postgres" < full_database_dump.sql

# Migration'ları çalıştır
npx supabase db reset
```

## 📝 Notlar
- Bu yedek otomatik script ile oluşturuldu
- Tüm dosyalar supabase/backups/ klasöründe toplandı
- Docker çalışıyor durumda
- Supabase CLI aktif

## 🎯 Sonraki Adımlar
1. Condition alanını ekle (gerekirse)
2. Migration'ları test et
3. Uygulamayı test et

## 📍 Konum
`$BACKUP_DIR`
