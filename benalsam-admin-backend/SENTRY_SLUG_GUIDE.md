# 🔍 Sentry Organization & Project Slug Bulma Rehberi

## 📋 Organization Slug Nasıl Bulunur?

### Yöntem 1: URL'den Bulma (En Kolay)

1. Sentry'ye giriş yapın
2. Herhangi bir projeye gidin
3. Browser URL'ine bakın:

```
https://sentry.io/organizations/[ORG-SLUG]/projects/[PROJECT-SLUG]/
```

**Örnek:**
- URL: `https://sentry.io/organizations/benalsam/projects/web-next/`
- Organization Slug: `benalsam`
- Project Slug: `web-next`

### Yöntem 2: Settings'ten Bulma

1. Sentry'ye giriş yapın
2. **Settings** → **Organizations** → Organization'unuzu seçin
3. URL'de organization slug görünür

### Yöntem 3: API ile Test Etme

Token'ınızı test etmek için:

```bash
curl -H "Authorization: Bearer YOUR_SENTRY_AUTH_TOKEN" \
  https://sentry.io/api/0/organizations/
```

Bu komut organization listesini döner. Organization slug, response'da görünür.

## 📋 Project Slug Nasıl Bulunur?

1. Sentry'ye giriş yapın
2. Organization'unuza gidin
3. Projeler listesinden projenizi seçin (web-next projesi olmalı)
4. URL'de project slug görünür

**Örnek:**
- URL: `https://sentry.io/organizations/benalsam/projects/web-next/`
- Project Slug: `web-next`

## ✅ Kontrol Etme

Organization slug ve project slug'ı bulduktan sonra, şu komutla test edebilirsiniz:

```bash
# Organization slug'ınızı ve project slug'ınızı buraya yazın
ORG_SLUG=your-org-slug
PROJECT_SLUG=your-project-slug
TOKEN=YOUR_SENTRY_AUTH_TOKEN

# Project bilgilerini al
curl -H "Authorization: Bearer $TOKEN" \
  https://sentry.io/api/0/organizations/$ORG_SLUG/projects/$PROJECT_SLUG/

# Başarılı olursa, project detayları JSON formatında döner
```

