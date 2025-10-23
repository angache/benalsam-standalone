# 📄 Draft Management System TODO

> **Oluşturulma Tarihi:** 2025-01-22  
> **Durum:** 🔴 Başlanmadı  
> **Öncelik:** Orta  
> **Tahmini Süre:** 4-6 hafta  
> **Kaynak:** `benalsam-web-next/`

---

## 🎯 **Genel Bakış**

Kullanıcıların ilan oluşturma sürecinde vazgeçtiklerinde ilanlarının otomatik olarak taslak (draft) olarak kaydedilmesi ve daha sonra devam edebilmesi için kapsamlı bir draft management sistemi.

### **Problem:**
- Kullanıcılar ilan oluşturma sürecinde vazgeçtiklerinde tüm veriler kayboluyor
- Uzun form süreçlerinde kullanıcı deneyimi kötü
- İlan oluşturma conversion rate'i düşük

### **Çözüm:**
- Otomatik draft kaydetme sistemi
- Kullanıcı dostu draft yönetimi
- Akıllı lifecycle management

---

## 📋 **Faz 1: Temel Draft Altyapısı (1-2 hafta)**

### **1.1 Database Schema**
```sql
-- Draft listings table
CREATE TABLE draft_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  urgency VARCHAR(20) DEFAULT 'normal',
  category_id UUID REFERENCES categories(id),
  attributes JSONB,
  images JSONB, -- {urls: [], main_index: 0}
  location JSONB, -- {city, district, neighborhood}
  premium_features JSONB, -- {selected: [], total_cost: 0}
  status VARCHAR(20) DEFAULT 'draft', -- draft, abandoned, archived
  last_modified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes
CREATE INDEX idx_draft_listings_user_id ON draft_listings(user_id);
CREATE INDEX idx_draft_listings_status ON draft_listings(status);
CREATE INDEX idx_draft_listings_expires_at ON draft_listings(expires_at);
```

### **1.2 API Endpoints**
```typescript
// Draft CRUD operations
POST   /api/drafts                    // Create/update draft
GET    /api/drafts                    // List user drafts
GET    /api/drafts/:id                // Get specific draft
PATCH  /api/drafts/:id                // Update draft
DELETE /api/drafts/:id                // Delete draft
POST   /api/drafts/:id/publish        // Convert draft to listing
```

### **1.3 Zustand Store Enhancement**
```typescript
interface DraftState {
  currentDraftId: string | null
  isDraftMode: boolean
  lastSavedAt: Date | null
  autoSaveInterval: NodeJS.Timeout | null
  
  // Actions
  saveDraft: () => Promise<void>
  loadDraft: (id: string) => Promise<void>
  publishDraft: () => Promise<void>
  deleteDraft: (id: string) => Promise<void>
  startAutoSave: () => void
  stopAutoSave: () => void
}
```

**Görevler:**
- [ ] Database migration oluştur
- [ ] API endpoints implement et
- [ ] Store'a draft actions ekle
- [ ] Basic CRUD testleri yaz

---

## 📋 **Faz 2: Auto-Save & UX (1 hafta)**

### **2.1 Auto-Save Implementation**
```typescript
// Auto-save every 2 seconds with debounce
const useAutoSave = () => {
  const { formData, saveDraft } = useCreateListingStore()
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.title || formData.description) {
        saveDraft()
      }
    }, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [formData])
}
```

### **2.2 Draft Status Indicators**
```tsx
// Draft status component
<DraftStatus 
  isDraft={isDraftMode}
  lastSaved={lastSavedAt}
  onSaveDraft={saveDraft}
  onDiscardDraft={deleteDraft}
/>
```

### **2.3 Navigation Guards**
```typescript
// Prevent accidental navigation loss
const useNavigationGuard = () => {
  const { hasUnsavedChanges } = useCreateListingStore()
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'Taslağınız kaydedilmemiş. Sayfadan ayrılmak istediğinizden emin misiniz?'
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])
}
```

**Görevler:**
- [ ] Auto-save hook implement et
- [ ] Draft status component oluştur
- [ ] Navigation guard ekle
- [ ] UX testleri yap

---

## 📋 **Faz 3: Draft Management UI (1 hafta)**

### **3.1 Draft List Page**
```tsx
// /ilanlarim/taslaklar
<DraftListPage>
  <DraftCard 
    title={draft.title}
    lastModified={draft.last_modified_at}
    onContinue={loadDraft}
    onDelete={deleteDraft}
    onPublish={publishDraft}
  />
</DraftListPage>
```

### **3.2 Draft Resume Banner**
```tsx
// Ana sayfada draft varsa göster
<DraftResumeBanner>
  <p>Tamamlanmamış ilanınız var</p>
  <Button onClick={continueDraft}>Devam Et</Button>
  <Button variant="outline" onClick={deleteDraft}>Sil</Button>
</DraftResumeBanner>
```

### **3.3 Review Step Enhancements**
```tsx
// ReviewStep.tsx'e ek butonlar
<div className="flex gap-4">
  <Button variant="outline" onClick={saveAsDraft}>
    📝 Taslak Olarak Kaydet
  </Button>
  <Button onClick={publishListing}>
    ✅ Onaya Gönder
  </Button>
</div>
```

**Görevler:**
- [ ] Draft list page oluştur
- [ ] Resume banner component
- [ ] Review step'e draft butonları ekle
- [ ] UI/UX testleri

---

## 📋 **Faz 4: Lifecycle Management (1 hafta)**

### **4.1 Background Jobs**
```typescript
// Cron job: Cleanup expired drafts
const cleanupExpiredDrafts = async () => {
  await supabase
    .from('draft_listings')
    .delete()
    .lt('expires_at', new Date().toISOString())
}

// Cron job: Mark abandoned drafts
const markAbandonedDrafts = async () => {
  await supabase
    .from('draft_listings')
    .update({ status: 'abandoned' })
    .lt('last_modified_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
}
```

### **4.2 Email Notifications**
```typescript
// Email templates
const draftReminderEmail = {
  subject: "İlanınızı tamamlamayı unutmayın",
  template: "draft-reminder",
  triggers: ["24h", "7d", "14d"]
}
```

### **4.3 Analytics Events**
```typescript
// Tracking events
trackEvent('draft_created', { step: currentStep })
trackEvent('draft_auto_saved', { step: currentStep })
trackEvent('draft_resumed', { draft_id, step: currentStep })
trackEvent('draft_published', { draft_id, time_to_publish })
trackEvent('draft_abandoned', { draft_id, last_step: currentStep })
```

**Görevler:**
- [ ] Background job'ları implement et
- [ ] Email notification sistemi
- [ ] Analytics tracking ekle
- [ ] Lifecycle testleri

---

## 📋 **Faz 5: Premium Features (1 hafta)**

### **5.1 Multiple Drafts Support**
```typescript
// Premium users can have up to 5 drafts
const DRAFT_LIMITS = {
  free: 1,
  premium: 5,
  pro: 10
}
```

### **5.2 Draft Templates**
```typescript
// Save draft as template
interface DraftTemplate {
  id: string
  name: string
  category_id: string
  attributes: Record<string, any>
  is_public: boolean
}
```

**Görevler:**
- [ ] Premium draft limits implement et
- [ ] Template system oluştur
- [ ] Premium feature testleri

---

## 📋 **Faz 6: Advanced Features (2 hafta)**

### **6.1 Draft Versioning**
```sql
-- Draft versions table
CREATE TABLE draft_versions (
  id UUID PRIMARY KEY,
  draft_id UUID REFERENCES draft_listings(id),
  version_number INTEGER,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **6.2 Smart Recovery**
```typescript
// AI-powered draft recovery suggestions
const suggestDraftCompletion = async (draftId: string) => {
  // Analyze similar successful listings
  // Suggest missing fields
  // Recommend better descriptions
}
```

**Görevler:**
- [ ] Versioning system implement et
- [ ] Smart recovery features
- [ ] Advanced analytics

---

## 🎯 **Implementation Priority**

### **High Priority (MVP)**
1. ✅ Database schema
2. ✅ Basic CRUD API
3. ✅ Auto-save functionality
4. ✅ Draft list page
5. ✅ Resume draft banner

### **Medium Priority**
1. 🔄 Email notifications
2. 🔄 Background cleanup jobs
3. 🔄 Analytics tracking
4. 🔄 Navigation guards

### **Low Priority (Future)**
1. ⏳ Multiple drafts (premium)
2. ⏳ Draft templates
3. ⏳ Version history
4. ⏳ AI suggestions

---

## 🚀 **Quick Start (Bu hafta)**

1. **Database schema oluştur** (30 dk)
2. **Basic API endpoints** (2 saat)
3. **Store'a draft actions ekle** (1 saat)
4. **ReviewStep'e "Taslak Kaydet" butonu** (30 dk)
5. **Draft list page** (2 saat)

**Toplam: ~6 saat** ile temel draft özelliği çalışır hale gelir.

---

## 📊 **Success Metrics**

### **KPI'lar:**
- Draft creation rate: %80+ (ilan başlatanların)
- Draft completion rate: %40+ (draft'ların yayına geçme oranı)
- Time to publish: -30% (draft kullanımı ile)
- User retention: +15% (draft sayesinde geri dönen kullanıcılar)

### **Analytics Events:**
- `draft_created`
- `draft_auto_saved`
- `draft_resumed`
- `draft_published`
- `draft_abandoned`
- `draft_deleted`

---

## 🔗 **İlgili Dosyalar**

- `benalsam-web-next/src/stores/createListingStore.ts`
- `benalsam-web-next/src/app/ilan-olustur/page.tsx`
- `benalsam-web-next/src/components/CreateListing/ReviewStep.tsx`
- `benalsam-admin-backend/src/routes/drafts.ts`

---

## 📝 **Notlar**

- Bu özellik authentication system'den sonra implement edilmeli
- Premium features için payment integration gerekli
- Email notifications için notification service gerekli
- Background jobs için cron service gerekli

---

**Son Güncelleme:** 2025-01-22  
**Güncelleyen:** AI Assistant
