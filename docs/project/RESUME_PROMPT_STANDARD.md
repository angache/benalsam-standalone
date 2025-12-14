# 🔄 STANDART PROMPT - Benalsam Projesi

**Bu dosya her zaman güncel tutulur. Yeni oturum açtığınızda bu prompt'u kullanın.**

---

## 📋 **KULLANIM TALİMATI**

Yeni versiyonla geri döndüğünüzde, aşağıdaki prompt'u **tam olarak** kopyalayıp yapıştırın:

```
Ben Benalsam projesinde çalışıyorum. Projeyi hatırlaman için şu bilgileri oku:

1. Proje yapısını hatırlamak için:
   - `docs/project/project summary2` dosyasını oku (güncel durum - EN ÜSTTEKİ "Current Status" bölümüne bak)
   - `HATIRLATICI.md` dosyasını oku (hızlı başlatma)
   - `docs/project/CHANGELOG.md` dosyasını oku (son güncellemeler)

2. Son yapılan değişiklikler için `docs/project/project summary2` dosyasının en üstündeki "Current Status" bölümüne bak.

3. Proje yapısı (Microservices - 9 Servis):
   - Listing Service (Port 3008) - Job system ile listing management
   - Upload Service (Port 3007) - Image upload, Cloudinary
   - Web Next (Port 5173) - Next.js web application
   - Admin Backend (Port 3002) - Admin API
   - Admin UI (Port 3003) - Admin dashboard
   - Elasticsearch Service (Port 3006) - Search engine
   - Backup Service (Port 3013) - Data backup
   - Cache Service (Port 3014) - Redis caching
   - Categories Service (Port 3015) - Category management
   - Search Service (Port 3016) - Advanced search
   - Realtime Service (Port 3019) - Firebase Realtime Queue

Lütfen bu dosyaları okuyup projeyi hatırla ve kaldığımız yerden devam edelim.
```

---

## ⚙️ **GÜNCELLEME SİSTEMİ**

### **Bu Dosya Nasıl Güncel Kalır?**

1. ✅ **`docs/project/project summary2`** dosyası her önemli değişiklikte güncellenir
2. ✅ Bu prompt `project summary2`'ye dinamik referans verir
3. ✅ Her zaman güncel bilgiyi `project summary2`'den alır
4. ✅ Bu dosya (`RESUME_PROMPT_STANDARD.md`) sabit kalır, sadece referans verir

### **Ne Zaman Güncellenir?**

- ✅ Her önemli bug fix sonrası → `project summary2` güncellenir
- ✅ Her major feature ekleme sonrası → `project summary2` güncellenir
- ✅ Her mimari değişiklik sonrası → `project summary2` güncellenir

### **AI Assistant'a Hatırlatma**

AI Assistant şu kuralı hatırlar:
> "Her önemli değişiklik sonrası `docs/project/project summary2` dosyasını güncelle ve bu dosyanın (`RESUME_PROMPT_STANDARD.md`) güncel olduğunu doğrula."

---

## 📝 **KULLANIM SENARYOLARI**

### **Senaryo 1: İlk Oturum (Detaylı)**
Yukarıdaki standart prompt'u kullanın.

### **Senaryo 2: Hızlı Başlangıç**
```
Benalsam projesinde çalışıyorum. Lütfen şu dosyaları oku:
- docs/project/project summary2 (en üstteki "Current Status" bölümüne bak)
- HATIRLATICI.md
```

### **Senaryo 3: Sadece Son Değişiklikler**
```
Benalsam projesinde çalışıyorum. Lütfen `docs/project/project summary2` dosyasının en üstündeki "Current Status" bölümünü oku.
```

---

**Son Güncelleme**: Bu dosya sabit kalır, `project summary2` dinamik olarak güncellenir  
**Güncelleme Stratejisi**: Dinamik referans - her zaman güncel  
**Kullanım**: Yeni oturum açtığınızda yukarıdaki prompt'u kopyalayıp yapıştırın

