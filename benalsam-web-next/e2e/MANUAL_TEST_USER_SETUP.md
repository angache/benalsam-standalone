# Test Kullanıcısı Manuel Oluşturma Kılavuzu

## Sorun

Otomatik test kullanıcısı oluşturma Supabase'de "Database error creating new user" hatası veriyor. Bu muhtemelen database trigger'ları veya RLS policy'leri ile ilgili bir sorun.

## Çözüm: Manuel Oluşturma

### Yöntem 1: Supabase Dashboard (Önerilen)

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **Authentication → Users bölümüne gidin**

3. **"Add user" → "Create new user" tıklayın**

4. **Formu doldurun:**
   - **Email:** `test@example.com`
   - **Password:** `TestPassword123!`
   - **Auto Confirm User:** ✅ (işaretleyin - önemli!)
   - **User Metadata (opsiyonel):**
     ```json
     {
       "name": "Test User"
     }
     ```

5. **"Create user" tıklayın**

6. **Profile oluşturun:**
   - SQL Editor'e gidin
   - Şu SQL'i çalıştırın (user_id'yi gerçek ID ile değiştirin):

   ```sql
   INSERT INTO profiles (
     id,
     email,
     name,
     username,
     role,
     is_2fa_enabled,
     status,
     created_at,
     updated_at
   ) VALUES (
     'USER_ID_BURAYA',  -- Supabase Auth'dan aldığınız user ID
     'test@example.com',
     'Test User',
     'testuser',  -- veya unique bir username
     'user',
     false,
     'active',
     NOW(),
     NOW()
   )
   ON CONFLICT (id) DO NOTHING;
   ```

   **User ID'yi bulmak için:**
   - Authentication → Users → test@example.com kullanıcısına tıklayın
   - UUID'yi kopyalayın

### Yöntem 2: SQL ile Direkt Oluşturma

SQL Editor'de şu komutu çalıştırın:

```sql
-- 1. Auth user oluştur (Supabase Auth API kullanarak)
-- Not: Bu Supabase'in kendi fonksiyonunu kullanır

-- 2. Profile oluştur (user_id'yi auth.users'dan alın)
INSERT INTO profiles (
  id,
  email,
  name,
  username,
  role,
  is_2fa_enabled,
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  'testuser' as username,
  'user' as role,
  false as is_2fa_enabled,
  'active' as status,
  created_at,
  updated_at
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, profiles.name),
  updated_at = NOW();
```

### Yöntem 3: Mevcut Kullanıcı Kullanma

Eğer zaten `test@example.com` email'ine sahip bir kullanıcınız varsa:

1. Authentication → Users → kullanıcıyı bulun
2. Password'ü `TestPassword123!` olarak güncelleyin
3. Profile'in var olduğundan emin olun

## Test Kullanıcısı Bilgileri

- **Email:** `test@example.com`
- **Password:** `TestPassword123!`
- **Name:** `Test User`
- **Username:** `testuser` (veya unique bir değer)

## Doğrulama

Test kullanıcısını oluşturduktan sonra, testleri çalıştırın:

```bash
cd benalsam-web-next
npm run test:e2e
```

Global setup şu mesajı göstermeli:
```
✅ Test user already exists: [user-id]
✅ Global setup completed successfully
```

## Sorun Giderme

### "Test user already exists" ama login başarısız

1. Password'ün doğru olduğundan emin olun: `TestPassword123!`
2. Email'in confirmed olduğundan emin olun (Auto Confirm User işaretli olmalı)
3. Profile'in var olduğundan emin olun

### Profile yoksa

SQL Editor'de profile oluşturun (Yöntem 1'deki SQL'i kullanın).

### Username conflict

Username'i unique yapın (örn: `testuser-123` veya timestamp ekleyin).

