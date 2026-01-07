# E2E Test Kullanım Kılavuzu

## Test Kullanıcısı Oluşturma

E2E testleri için test kullanıcısı otomatik olarak oluşturulur. Test kullanıcısı bilgileri:

- **Email:** `test@example.com`
- **Password:** `TestPassword123!`
- **Name:** `Test User`
- **Username:** `testuser`

### Otomatik Oluşturma

Test kullanıcısı, testler çalıştırıldığında otomatik olarak oluşturulur (`global-setup.ts`). Eğer kullanıcı zaten varsa, sadece şifre güncellenir.

### Manuel Oluşturma

Eğer test kullanıcısını manuel olarak oluşturmak isterseniz:

```bash
# Node.js REPL kullanarak
node -e "
const { createTestUser } = require('./e2e/helpers/auth.ts');
createTestUser().then(id => console.log('User ID:', id));
"
```

Veya `e2e/helpers/auth.ts` dosyasındaki `createTestUser()` fonksiyonunu kullanabilirsiniz.

### Gereksinimler

Test kullanıcısı oluşturmak için `.env.local` dosyasında şu değişkenler olmalı:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**⚠️ Önemli:** `SUPABASE_SERVICE_ROLE_KEY` sadece server-side kullanılmalı ve asla commit edilmemelidir!

## Testleri Çalıştırma

```bash
# Tüm E2E testlerini çalıştır
npm run test:e2e

# Headed mode (browser görünür)
npm run test:e2e:headed

# UI mode (interaktif)
npm run test:e2e:ui

# Belirli bir test dosyasını çalıştır
npx playwright test e2e/auth.spec.ts
```

## Test Kullanıcısını Temizleme

Varsayılan olarak, test sonrası test kullanıcısı silinmez (test verilerini korumak için). Eğer test sonrası temizlemek isterseniz:

1. `e2e/global-teardown.ts` dosyasını açın
2. `await deleteTestUser();` satırının yorumunu kaldırın

## Sorun Giderme

### Test kullanıcısı oluşturulamıyor

1. `.env.local` dosyasında `SUPABASE_SERVICE_ROLE_KEY` olduğundan emin olun
2. Supabase projenizde Service Role Key'in doğru olduğunu kontrol edin
3. Supabase projenizde Auth ayarlarında email confirmation'ın kapalı olduğundan emin olun (test için)

### Login başarısız oluyor

1. Test kullanıcısının oluşturulduğundan emin olun (global setup loglarına bakın)
2. Kullanıcı şifresinin doğru olduğundan emin olun (`TestPassword123!`)
3. Supabase Auth ayarlarını kontrol edin

### Test kullanıcısı zaten var hatası

Bu normaldir. Eğer kullanıcı zaten varsa, sadece şifre güncellenir ve test devam eder.

## Test Helper Fonksiyonları

`e2e/helpers/auth.ts` dosyasında şu fonksiyonlar mevcuttur:

- `createTestUser()` - Test kullanıcısı oluşturur
- `deleteTestUser()` - Test kullanıcısını siler
- `resetTestUserPassword()` - Test kullanıcısının şifresini sıfırlar
- `createTestSupabaseAdmin()` - Supabase admin client oluşturur

## Güvenlik Notları

- Test kullanıcısı sadece test ortamında kullanılmalıdır
- Production'da asla test kullanıcısı oluşturmayın
- `SUPABASE_SERVICE_ROLE_KEY` asla commit edilmemelidir
- Test kullanıcısı şifresi basit tutulmuştur (sadece test için)
