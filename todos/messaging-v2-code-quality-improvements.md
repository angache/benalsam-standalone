# Messaging v2.0 - Code Quality & Production Readiness Improvements

**Created:** 2025-10-26  
**Priority:** HIGH (Before Production)  
**Estimated Time:** 2-3 weeks

---

## 🔴 YÜKSEK ÖNCELİK (Hemen Yapılmalı)

### 1. ⚠️ Security - Rate Limiting Ekle
**Priority:** CRITICAL  
**Estimated:** 4 hours

- [ ] `/api/messages/unread-count` endpoint'ine rate limit ekle
- [ ] `/api/messages/mark-read` endpoint'ine rate limit ekle
- [ ] `/api/conversations/[conversationId]` endpoint'ine rate limit ekle
- [ ] `/api/conversations/[conversationId]/messages` endpoint'ine rate limit ekle
- [ ] `next-rate-limit` veya `upstash/ratelimit` kullan
- [ ] User başına 100 request/minute limiti
- [ ] IP başına 200 request/minute limiti

**Files:**
- `benalsam-web-next/src/middleware.ts`
- `benalsam-web-next/src/lib/rate-limit.ts` (yeni)
- All API routes

---

### 2. 🛡️ Security - XSS Sanitization
**Priority:** CRITICAL  
**Estimated:** 3 hours

- [ ] `DOMPurify` package'ini yükle
- [ ] Message content'i sanitize et
- [ ] Listing title'ı sanitize et
- [ ] User name'i sanitize et
- [ ] `dangerouslySetInnerHTML` kullanma!

**Files:**
- `benalsam-web-next/src/utils/sanitize.ts` (yeni)
- `benalsam-web-next/src/app/mesajlarim-v2/page.tsx`
- `benalsam-web-next/src/components/Header.tsx`

**Example:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}
```

---

### 3. 🔐 Security - Production Log Cleanup
**Priority:** CRITICAL  
**Estimated:** 2 hours

- [ ] Console.log'ları kaldır veya debug utility'ye taşı
- [ ] Sensitive data loglanmamalı (message content, user IDs)
- [ ] Production'da sadece error log'lar
- [ ] Development'ta tüm loglar

**Create:**
- `benalsam-web-next/src/utils/logger.ts`

**Example:**
```typescript
const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (...args: any[]) => isDev && console.log(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
}
```

**Files to Update:**
- All 7 files with console.log (AuthContext, NotificationContext, mesajlarim-v2, etc.)

---

### 4. 🚀 Performance - N+1 Query Fix
**Priority:** HIGH  
**Estimated:** 3 hours

**Problem:**
```typescript
// conversationService.ts:348
// Her yeni mesaj için 2 extra query
const { data: messageWithSender } = await supabase
  .from('messages')
  .select('*, sender:profiles!sender_id(id, name, avatar_url)')
```

**Solution:**
- [ ] Realtime payload'da sadece message ID al
- [ ] Batch fetch ile sender bilgilerini al
- [ ] Local cache kullan (Map<userId, UserProfile>)
- [ ] 5 dakika TTL

**Files:**
- `benalsam-web-next/src/services/conversationService.ts`
- `benalsam-web-next/src/lib/user-cache.ts` (yeni)

---

### 5. 🔄 Performance - Duplicate Subscriptions Birleştir
**Priority:** HIGH  
**Estimated:** 4 hours

**Problem:**
- `NotificationContext`: Global messages subscription
- `conversationService`: Per-conversation subscription
- `mesajlarim-v2`: Conversation list subscription
= **3 farklı subscription aynı table'a!**

**Solution:**
- [ ] Tek bir global WebSocket manager oluştur
- [ ] Event bus pattern kullan
- [ ] Subscribe once, emit to all listeners
- [ ] Memory efficient

**Create:**
- `benalsam-web-next/src/lib/realtime-manager.ts` (yeni)

**Example:**
```typescript
class RealtimeManager {
  private static instance: RealtimeManager
  private subscribers: Map<string, Set<Function>>
  
  subscribe(event: string, callback: Function) { ... }
  unsubscribe(event: string, callback: Function) { ... }
  emit(event: string, data: any) { ... }
}
```

---

## 🟡 ORTA ÖNCELİK (Sprint'e Al)

### 6. 🧪 Testing - Unit Tests
**Priority:** MEDIUM  
**Estimated:** 1 week

- [ ] Jest + React Testing Library setup
- [ ] conversationService.ts testleri (%80 coverage)
- [ ] AuthContext testleri
- [ ] NotificationContext testleri
- [ ] mesajlarim-v2 component testleri
- [ ] Mock Supabase calls
- [ ] Integration tests

**Target:** %50+ coverage

**Files:**
- `benalsam-web-next/__tests__/` (yeni klasör)
- `benalsam-web-next/jest.config.js`

---

### 7. 🛡️ Error Boundaries
**Priority:** MEDIUM  
**Estimated:** 3 hours

- [ ] Global error boundary (layout.tsx)
- [ ] Messaging page error boundary
- [ ] Graceful error UI
- [ ] Error reporting (Sentry entegrasyonu)

**Create:**
- `benalsam-web-next/src/components/ErrorBoundary.tsx`

---

### 8. ⚙️ Configuration Management
**Priority:** MEDIUM  
**Estimated:** 2 hours

- [ ] Config dosyası oluştur
- [ ] Magic number'ları kaldır
- [ ] Environment-based config

**Create:**
- `benalsam-web-next/src/config/messaging.ts`

**Example:**
```typescript
export const MESSAGING_CONFIG = {
  REFRESH_INTERVAL: 30000,
  MARK_READ_DELAY: 1000,
  MESSAGE_LIMIT: 100,
  UNREAD_MAX_DISPLAY: 9,
  NOTIFICATION_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const
```

---

### 9. 📝 Documentation - JSDoc
**Priority:** MEDIUM  
**Estimated:** 4 hours

- [ ] conversationService.ts fonksiyonlarına JSDoc
- [ ] Context'lere JSDoc
- [ ] Complex logic'lere inline comments
- [ ] README.md güncelle

**Example:**
```typescript
/**
 * Marks all unread messages in a conversation as read
 * @param conversationId - The conversation UUID
 * @param userId - The current user's UUID
 * @returns Promise<boolean> - Success status
 * @throws DatabaseError if update fails
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<boolean> => { ... }
```

---

### 10. 🧹 Memory Leak Fixes
**Priority:** MEDIUM  
**Estimated:** 2 hours

- [ ] Timeout cleanup ekle
- [ ] Subscription cleanup kontrol et
- [ ] useEffect cleanup fonksiyonları
- [ ] Unmounted component state update'leri önle

**Files:**
- `benalsam-web-next/src/contexts/NotificationContext.tsx`
- `benalsam-web-next/src/app/mesajlarim-v2/page.tsx`

---

## 🟢 DÜŞÜK ÖNCELİK (Backlog)

### 11. 🌍 Internationalization (i18n)
**Priority:** LOW  
**Estimated:** 1 week

- [ ] `react-i18next` yükle
- [ ] Translation files oluştur (tr, en)
- [ ] Hard-coded string'leri çevir
- [ ] Date/time formatting

---

### 12. ♻️ Component Extraction
**Priority:** LOW  
**Estimated:** 3 days

- [ ] `<UnreadBadge />` component
- [ ] `<ConversationListItem />` component
- [ ] `<MessageBubble />` component
- [ ] `<ChatHeader />` component
- [ ] `<MessageInput />` component

---

### 13. 📜 Virtualization (Long Lists)
**Priority:** LOW  
**Estimated:** 1 day

- [ ] `@tanstack/react-virtual` yükle
- [ ] Conversation list virtualize et (100+ item için)
- [ ] Message list virtualize et (1000+ mesaj için)

---

### 14. 🔌 Offline Support
**Priority:** LOW  
**Estimated:** 1 week

- [ ] Service Worker ekle
- [ ] Message queue (offline'da gönderilecekler)
- [ ] Local cache (IndexedDB)
- [ ] Sync on reconnect

---

### 15. 🏗️ Repository Pattern
**Priority:** LOW  
**Estimated:** 1 week

- [ ] Supabase'i soyutla
- [ ] Interface tanımla
- [ ] Mock implementation (test için)
- [ ] Dependency injection

---

## 📈 BAŞARI KRİTERLERİ

### Minimum (Production'a Girmeden Önce):
- ✅ Tüm 🔴 YÜKSEK öncelikli taskler tamamlanmış
- ✅ Security audit geçmiş
- ✅ Performance test yapılmış (Lighthouse score >90)
- ✅ Manual QA tamamlanmış

### İdeal (1 Ay İçinde):
- ✅ %50+ test coverage
- ✅ Error boundary'ler eklenmiş
- ✅ Documentation tamamlanmış
- ✅ Sentry entegrasyonu

### Gelecek (3 Ay İçinde):
- ✅ i18n desteği
- ✅ Offline support
- ✅ %80+ test coverage
- ✅ Component library

---

## 🎯 SONRAKI ADIM

**ŞİMDİ YAPILACAK:**
1. Rate limiting ekle (4 saat)
2. XSS sanitization (3 saat)
3. Production log cleanup (2 saat)

**Toplam:** 9 saat (1-2 gün)

**Başlayalım mı?** 🚀

