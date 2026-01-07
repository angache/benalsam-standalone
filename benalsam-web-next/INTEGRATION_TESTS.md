# 🧪 Integration Tests - Çalıştırma Rehberi

## Hızlı Başlangıç

```bash
# 1. Proje dizinine git
cd benalsam-web-next

# 2. Integration testlerini çalıştır
npm run test:integration
```

## Detaylı Komutlar

### Tüm Integration Testlerini Çalıştır
```bash
npm run test:integration
```

### Watch Mode (Değişiklikleri izle)
```bash
npm run test:integration:watch
```

### Belirli Bir Test Dosyasını Çalıştır
```bash
# Listing creation testi
npm run test -- src/__tests__/integration/listing-creation.integration.test.ts

# Favorite toggle testi
npm run test -- src/__tests__/integration/favorite-toggle.integration.test.ts

# Messaging testi
npm run test -- src/__tests__/integration/messaging.integration.test.ts
```

### Coverage ile Çalıştır
```bash
npm run test:coverage -- src/__tests__/integration
```

### UI ile Çalıştır (Interactive)
```bash
npm run test:ui -- src/__tests__/integration
```

## Test Yapısı

```
src/__tests__/integration/
├── setup.ts                          # Test utilities
├── listing-creation.integration.test.ts    # Listing creation flow
├── favorite-toggle.integration.test.ts     # Favorite toggle flow
├── messaging.integration.test.ts           # Messaging flow
└── README.md                         # Detaylı dokümantasyon
```

## Sorun Giderme

### ❌ Error: EPERM: operation not permitted, open '.env.local'

**Çözüm 1:** Testler mock kullandığı için .env dosyalarına ihtiyaç yok. Hata görmezden gelinebilir.

**Çözüm 2:** İzinleri düzelt:
```bash
chmod 644 .env.local
```

**Çözüm 3:** Test environment kullan:
```bash
NODE_ENV=test npm run test:integration
```

### ❌ Error: @supabase/ssr: Your project's URL and API key are required

**Çözüm:** Bu hata test setup dosyasında (`src/test/setup.ts`) environment variable'lar set edilerek çözüldü. Eğer hala görüyorsanız:

1. Test setup dosyasının doğru yüklendiğinden emin olun
2. Environment variable'ların set edildiğini kontrol edin:
```bash
# Test setup dosyasında bu değerler set edilmeli:
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

### ❌ Error: Cannot find module '@/...'

**Çözüm:** `benalsam-web-next` dizininde olduğunuzdan emin olun:
```bash
cd benalsam-web-next
npm run test:integration
```

### ❌ Tests are slow

Integration testler unit testlerden daha yavaş olabilir. Bu normaldir. Hızlandırmak için:
- `--run` flag'i kullanın (watch mode'u kapatır)
- Belirli test dosyalarını çalıştırın
- `--threads=false` kullanın (paralel çalıştırmayı kapatır)

## Test Sonuçları

Başarılı test çıktısı örneği:

```
✓ src/__tests__/integration/listing-creation.integration.test.ts (5)
  ✓ Integration: Listing Creation Flow (5)
    ✓ should successfully create a listing through the complete flow
    ✓ should handle validation errors in the flow
    ✓ should handle authentication errors in the flow
    ✓ should handle rate limiting in the flow
    ✓ should handle database errors in the flow

Test Files  1 passed (1)
     Tests  5 passed (5)
```

## Daha Fazla Bilgi

Detaylı dokümantasyon için: `src/__tests__/integration/README.md`

