# 🔐 Sentry API Entegrasyonu - Kurulum Rehberi

## 📋 Gerekli Bilgiler

### 1. Sentry API Token Oluşturma

1. Sentry hesabına giriş yap: https://sentry.io
2. **Settings** → **Developer Settings** → **Personal Tokens**: https://sentry.io/settings/account/api/auth-tokens/
3. **"Create New Token"** butonuna tıkla
   
   **Not**: **Personal Tokens** seç (Organization Tokens değil - Personal Tokens backend uygulamaları için daha uygundur)
4. Token bilgileri:
   - **Name**: `Benalsam Admin Backend API`
   - **Scopes**: 
     - ✅ `org:read` (Organization bilgilerini okumak için)
     - ✅ `project:read` (Project bilgilerini okumak için)
     - ✅ `event:read` (Event/Error verilerini okumak için)
     - ✅ `event:write` (Event göndermek için - opsiyonel)
5. **"Create Token"** butonuna tıkla
6. **Token'ı kopyala** (sadece bir kez gösterilir, kaybetmemeye dikkat et!)

### 2. Organization Slug Bulma

Organization slug, Sentry URL'inizde görünür:
- URL formatı: `https://sentry.io/organizations/[ORG-SLUG]/`
- Örnek: `https://sentry.io/organizations/benalsam/` → Organization slug: `benalsam`

### 3. Project Slug Bulma

Project slug, Sentry URL'inizde görünür:
- URL formatı: `https://sentry.io/organizations/[ORG-SLUG]/projects/[PROJECT-SLUG]/`
- Örnek: `https://sentry.io/organizations/benalsam/projects/web-next/` → Project slug: `web-next`

## 🔧 Environment Variables

`.env` dosyasına şu değişkenleri ekle:

```env
# Sentry REST API Configuration
SENTRY_ORG_SLUG=your-org-slug
SENTRY_PROJECT_SLUG=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token-here
```

**Not**: `SENTRY_AUTH_TOKEN` hassas bir bilgidir, asla Git'e commit etme!

## ✅ Test Etme

Token'ı aldıktan sonra, şu komutla test edebilirsin:

```bash
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  https://sentry.io/api/0/organizations/YOUR_ORG_SLUG/projects/
```

Başarılı olursa, proje listesi JSON formatında dönecektir.

