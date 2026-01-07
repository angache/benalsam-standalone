# Mevcut Kullanıcı ile E2E Testleri

## Hızlı Başlangıç

Mevcut bir kullanıcıyı test için kullanmak için `.env.local` dosyasına şu değişkenleri ekleyin:

```env
# E2E Test User (Mevcut kullanıcı kullanımı)
E2E_TEST_USER_EMAIL=your-existing-user@example.com
E2E_TEST_USER_PASSWORD=your-password
E2E_TEST_USER_NAME=User Name (opsiyonel)
E2E_TEST_USER_USERNAME=username (opsiyonel)
```

## Örnek

```env
E2E_TEST_USER_EMAIL=ali@example.com
E2E_TEST_USER_PASSWORD=MySecurePassword123!
E2E_TEST_USER_NAME=Ali Tuna
E2E_TEST_USER_USERNAME=alituna
```

## Kullanım

1. `.env.local` dosyasını açın
2. Yukarıdaki değişkenleri ekleyin (mevcut kullanıcı bilgilerinizle)
3. Testleri çalıştırın:

```bash
npm run test:e2e
```

## Notlar

- **Güvenlik:** `.env.local` dosyası git'e commit edilmemelidir (zaten .gitignore'da)
- **Password:** Test kullanıcısının şifresini bilmeniz gerekir
- **Email Confirmation:** Kullanıcının email'i confirmed olmalı
- **Profile:** Kullanıcının profile'ı olmalı (profiles tablosunda)

## Sorun Giderme

### "Test user verification failed"

- Email'in doğru olduğundan emin olun
- Password'ün doğru olduğundan emin olun
- Kullanıcının Supabase'de var olduğundan emin olun

### Login başarısız

- Password'ün doğru olduğundan emin olun
- Email'in confirmed olduğundan emin olun
- Profile'ın var olduğundan emin olun

## Varsayılan Değerler

Eğer environment variable'ları ayarlamazsanız, sistem şu varsayılanları kullanır:
- Email: `test@example.com`
- Password: `TestPassword123!`
- Name: `Test User`
- Username: `testuser-{timestamp}`

