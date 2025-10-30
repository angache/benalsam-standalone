/**
 * Chatbot FAQ Database
 * Comprehensive question-answer database with smart matching
 */

export interface FAQItem {
  id: string
  question: string
  answer: string
  keywords: string[]
  category: string
  relatedQuestions?: string[]
  action?: {
    type: 'navigate' | 'external' | 'modal' | 'copy'
    value: string
    label: string
  }
}

export const CHATBOT_FAQ: FAQItem[] = [
  // ============================================================================
  // BAŞLANGIÇ & GENEL
  // ============================================================================
  {
    id: 'welcome',
    question: 'Merhaba / Selam / Hey',
    answer: '👋 Merhaba! Ben Benalsam asistanıyım. Size nasıl yardımcı olabilirim?\n\nİşte yapabilecekleriniz:\n• İlan vermek\n• İlan aramak\n• Teklif göndermek\n• Mesajlaşmak',
    keywords: ['merhaba', 'selam', 'hey', 'hi', 'hello', 'hoşgeldin'],
    category: 'genel',
    relatedQuestions: ['ilan-nasil-verilir', 'nasil-calisir']
  },
  
  // ============================================================================
  // İLAN VERME
  // ============================================================================
  {
    id: 'ilan-nasil-verilir',
    question: 'İlan nasıl veririm?',
    answer: '📝 İlan vermek çok kolay! 3 basit adım:\n\n1️⃣ "İlan Ver" butonuna tıklayın\n2️⃣ Ne arıyorsanız yazın (örn: "iPhone 15 arıyorum")\n3️⃣ Kategori, fiyat ve detayları doldurun\n\n✨ İlanınız hemen yayınlanır ve satıcılar size teklif göndermeye başlar!',
    keywords: ['ilan', 'ver', 'vermek', 'oluştur', 'ekle', 'nasıl', 'yayınla', 'paylaş'],
    category: 'ilan-verme',
    action: {
      type: 'navigate',
      value: '/ilan-olustur',
      label: 'İlan Ver'
    },
    relatedQuestions: ['ilan-ucreti', 'ilan-onay', 'ilan-sil']
  },
  {
    id: 'ilan-ucreti',
    question: 'İlan vermek ücretli mi?',
    answer: '💰 **Tamamen ÜCRETSIZ!**\n\nBenalsam\'da:\n• Sınırsız ilan verebilirsiniz\n• Komisyon yoktur\n• Gizli ücret yoktur\n• İstediğiniz kadar teklif alabilirsiniz\n\n🎁 Bonus: İlk ilanınıza özel öne çıkarma hediye!',
    keywords: ['ücret', 'para', 'maliyet', 'bedava', 'ücretsiz', 'parasız', 'komisyon'],
    category: 'ilan-verme',
    relatedQuestions: ['premium-ozellikler', 'ilan-nasil-verilir']
  },
  {
    id: 'ilan-onay',
    question: 'İlanım ne zaman onaylanır?',
    answer: '⏱️ İlanlar otomatik olarak **anında yayınlanır!**\n\nSadece bu durumlarda manuel kontrol edilir:\n• Şüpheli içerik\n• Fotoğraf kalitesi düşükse\n• Eksik bilgi varsa\n\n✅ Normal ilanlar: 0-5 dakika\n⚠️ Manuel kontrol: 1-24 saat',
    keywords: ['onay', 'yayın', 'ne zaman', 'süre', 'bekliyor', 'kontrol', 'inceleme'],
    category: 'ilan-verme',
    relatedQuestions: ['ilan-duzenle', 'ilan-sil']
  },
  {
    id: 'ilan-duzenle',
    question: 'İlanımı nasıl düzenlerim?',
    answer: '✏️ İlan düzenleme çok kolay:\n\n1️⃣ "İlanlarım" sayfasına gidin\n2️⃣ Düzenlemek istediğiniz ilana tıklayın\n3️⃣ "Düzenle" butonuna basın\n4️⃣ Değişikliklerinizi yapın ve kaydedin\n\n💡 İpucu: Fiyat güncellemesi sıralamayı yükseltir!',
    keywords: ['düzenle', 'değiştir', 'güncelle', 'edit', 'revize'],
    category: 'ilan-verme',
    action: {
      type: 'navigate',
      value: '/ilanlarim',
      label: 'İlanlarıma Git'
    },
    relatedQuestions: ['ilan-sil', 'ilan-yenile']
  },
  {
    id: 'ilan-sil',
    question: 'İlanımı nasıl silerim?',
    answer: '🗑️ İlan silme:\n\n1️⃣ "İlanlarım" → İlanınızı seçin\n2️⃣ "..." menüsü → "Sil"\n3️⃣ Onaylayın\n\n⚠️ Dikkat:\n• Silinen ilanlar geri alınamaz\n• Tüm teklifler de silinir\n• Mesajlaşmalar korunur (50 gün)',
    keywords: ['sil', 'kaldır', 'iptal', 'delete', 'remove'],
    category: 'ilan-verme',
    relatedQuestions: ['ilan-duzenle', 'hesap-sil']
  },
  {
    id: 'fotograf-ekleme',
    question: 'Fotoğraf nasıl eklerim?',
    answer: '📸 Fotoğraf ekleme seçenekleri:\n\n**Bilgisayardan:**\n• "Fotoğraf Ekle" → Dosya seçin\n• Sürükle-bırak destekli\n\n**Stok Görseller:**\n• Unsplash\'tan ücretsiz resim arayın\n• Tek tıkla ekleyin\n\n💡 İpuçları:\n• En az 1, en fazla 10 fotoğraf\n• İlk fotoğraf kapak olur\n• Kaliteli fotoğraf = daha çok teklif!',
    keywords: ['fotoğraf', 'resim', 'görsel', 'foto', 'image', 'upload', 'yükle'],
    category: 'ilan-verme',
    relatedQuestions: ['ilan-nasil-verilir']
  },

  // ============================================================================
  // TEKLİF & MESAJLAŞMA
  // ============================================================================
  {
    id: 'teklif-nasil-gonderilir',
    question: 'Teklif nasıl gönderirim?',
    answer: '💬 Teklif gönderme:\n\n1️⃣ İlana tıklayın\n2️⃣ "Teklif Ver" butonuna basın\n3️⃣ Fiyatınızı ve mesajınızı yazın\n4️⃣ Gönder!\n\n✨ İlan sahibi teklifinizi görür ve sizinle iletişime geçer.',
    keywords: ['teklif', 'gönder', 'yolla', 'offer', 'fiyat', 'ver'],
    category: 'teklif',
    relatedQuestions: ['mesajlasma', 'teklif-kabul']
  },
  {
    id: 'teklif-kabul',
    question: 'Teklifim kabul edildi, ne yapmalıyım?',
    answer: '🎉 Tebrikler! Teklifiniz kabul edildi.\n\n**Sıradaki adımlar:**\n1️⃣ Mesajlaşma başlayacak\n2️⃣ Detayları konuşun (teslimat, ödeme vb.)\n3️⃣ Buluşma ayarlayın\n4️⃣ Güvenli ödeme yapın\n\n🔒 Güvenlik: Her zaman güvenli yerlerde buluşun!',
    keywords: ['kabul', 'onay', 'accept', 'edildi', 'anlaştık'],
    category: 'teklif',
    relatedQuestions: ['guvenli-odeme', 'mesajlasma']
  },
  {
    id: 'mesajlasma',
    question: 'Mesajlaşma nasıl çalışır?',
    answer: '💬 Mesajlaşma sistemi:\n\n📱 **Özellikler:**\n• Anlık bildirim\n• Fotoğraf paylaşma\n• Konum paylaşma\n• Okundu bilgisi\n\n🔔 **Bildirimler:**\n• Tarayıcı bildirimleri\n• Email bildirimleri (ayarlardan açılır)\n\n⚠️ Spam ve tacizi bildirin!',
    keywords: ['mesaj', 'mesajlaşma', 'chat', 'konuş', 'yaz', 'iletişim'],
    category: 'mesajlasma',
    action: {
      type: 'navigate',
      value: '/mesajlarim',
      label: 'Mesajlarım'
    },
    relatedQuestions: ['bildirim', 'spam']
  },

  // ============================================================================
  // GÜVENLİK
  // ============================================================================
  {
    id: 'guvenli-mi',
    question: 'Benalsam güvenli mi?',
    answer: '🔒 **%100 Güvenli Platform!**\n\n✅ Güvenlik önlemlerimiz:\n• Kullanıcı doğrulama sistemi\n• Şüpheli içerik tespiti\n• Şifreli iletişim\n• 7/24 moderasyon\n• Spam/dolandırıcılık koruması\n\n🛡️ 10,000+ mutlu kullanıcı!',
    keywords: ['güvenli', 'güvenlik', 'emniyet', 'safe', 'security', 'dolandırıcı'],
    category: 'guvenlik',
    relatedQuestions: ['guvenli-odeme', 'spam', 'bilgi-gizliligi']
  },
  {
    id: 'guvenli-odeme',
    question: 'Güvenli ödeme nasıl yapılır?',
    answer: '💳 **Güvenli Ödeme İpuçları:**\n\n✅ YAPILMASI GEREKENLER:\n• Yüz yüze buluşun\n• Ürünü kontrol edin\n• Fatura/makbuz isteyin\n• Güvenli yerlerde buluşun\n\n❌ YAPILMAMASI GEREKENLER:\n• Ön ödeme yapmayın\n• Banka bilgisi vermeyin\n• EFT/havale yapmayın\n• Şüpheli linklereBir Hata Oluştu tıklamayın',
    keywords: ['ödeme', 'para', 'payment', 'banka', 'kart', 'güvenli', 'nakit'],
    category: 'guvenlik',
    relatedQuestions: ['guvenli-mi', 'dolandiricilik']
  },
  {
    id: 'dolandiricilik',
    question: 'Dolandırıcılık şüphesi nasıl bildirilir?',
    answer: '🚨 **Şüpheli Davranış Bildirimi:**\n\n**Hemen yapın:**\n1️⃣ İlan/mesajda "Bildir" butonuna basın\n2️⃣ Durumu açıklayın\n3️⃣ Ekran görüntüsü ekleyin\n\n📧 Email: destek@benalsam.com\n📱 WhatsApp: +90 XXX XXX XX XX\n\n⚡ 24 saat içinde yanıt!',
    keywords: ['dolandırıcı', 'şüpheli', 'spam', 'bildir', 'report', 'şikayet'],
    category: 'guvenlik',
    action: {
      type: 'external',
      value: 'mailto:destek@benalsam.com',
      label: 'Email Gönder'
    },
    relatedQuestions: ['guvenli-mi', 'destek']
  },

  // ============================================================================
  // HESAP & AYARLAR
  // ============================================================================
  {
    id: 'hesap-olustur',
    question: 'Nasıl üye olurum?',
    answer: '👤 **Üye olma:**\n\n**3 Yöntem:**\n1️⃣ Email ile kayıt\n2️⃣ Google ile devam et\n3️⃣ Telefon numarası ile\n\n⚡ 30 saniyede tamamlanır!\n🎁 İlk ilanınıza özel bonus!',
    keywords: ['üye', 'kayıt', 'hesap', 'register', 'signup', 'sign up'],
    category: 'hesap',
    action: {
      type: 'navigate',
      value: '/kayit',
      label: 'Kayıt Ol'
    },
    relatedQuestions: ['giris-yap', 'sifre-unuttum']
  },
  {
    id: 'giris-yap',
    question: 'Nasıl giriş yaparım?',
    answer: '🔐 **Giriş yapma:**\n\n1️⃣ Sağ üstteki "Giriş" butonuna tıklayın\n2️⃣ Email veya telefon numaranızı girin\n3️⃣ Şifrenizi yazın\n\n💡 Beni hatırla: Bir daha giriş yapmayın!',
    keywords: ['giriş', 'login', 'sign in', 'oturum'],
    category: 'hesap',
    action: {
      type: 'modal',
      value: 'login',
      label: 'Giriş Yap'
    },
    relatedQuestions: ['hesap-olustur', 'sifre-unuttum']
  },
  {
    id: 'sifre-unuttum',
    question: 'Şifremi unuttum',
    answer: '🔑 **Şifre sıfırlama:**\n\n1️⃣ Giriş sayfasında "Şifremi Unuttum"\n2️⃣ Email adresinizi girin\n3️⃣ Gelen linke tıklayın\n4️⃣ Yeni şifre belirleyin\n\n📧 Email gelmedi mi? Spam klasörüne bakın!',
    keywords: ['şifre', 'unuttum', 'sıfırla', 'password', 'reset', 'forgot'],
    category: 'hesap',
    relatedQuestions: ['giris-yap', 'hesap-olustur']
  },
  {
    id: 'profil-duzenle',
    question: 'Profilimi nasıl düzenlerim?',
    answer: '✏️ **Profil düzenleme:**\n\n1️⃣ Sağ üst → Profil resminize tıklayın\n2️⃣ "Profili Düzenle" seçin\n3️⃣ Bilgilerinizi güncelleyin\n4️⃣ Kaydet\n\n🖼️ **Düzenlenebilir:**\n• Profil fotoğrafı\n• İsim\n• Telefon\n• Adres\n• Hakkımda',
    keywords: ['profil', 'düzenle', 'güncelle', 'edit', 'profile', 'bilgi'],
    category: 'hesap',
    relatedQuestions: ['hesap-sil', 'bildirim']
  },

  // ============================================================================
  // ÖDEMELER & PREMİUM
  // ============================================================================
  {
    id: 'premium-ozellikler',
    question: 'Premium özellikleri nelerdir?',
    answer: '⭐ **Premium Avantajları:**\n\n🔥 **Öne Çıkan İlan:**\n• Arama sonuçlarında üstte\n• 7 gün boyunca\n• 3x daha fazla görünürlük\n\n⚡ **Acil İlan:**\n• Kırmızı çerçeve\n• "ACİL" badge\n• Özel sıralama\n\n🌟 **Vitrin İlanı:**\n• Ana sayfada gösterim\n• 10x daha fazla tıklama\n• 30 gün aktif',
    keywords: ['premium', 'ücretli', 'öne çıkan', 'vitrin', 'acil', 'paket'],
    category: 'premium',
    relatedQuestions: ['premium-ucret', 'ilan-nasil-verilir']
  },

  // ============================================================================
  // NASIL ÇALIŞIR
  // ============================================================================
  {
    id: 'nasil-calisir',
    question: 'Benalsam nasıl çalışır?',
    answer: '🎯 **Benalsam Mantığı:**\n\n**Klasik siteler:** Satıcı ilan verir, alıcı arar\n**Benalsam:** Alıcı ilan verir, satıcılar teklif gönderir!\n\n**Örnek:**\n"iPhone 15 arıyorum, bütçem 60.000₺"\n→ 10 satıcı size teklif gönderir\n→ Siz en iyisini seçersiniz!\n\n💡 Siz karar verirsiniz, onlar sizinle yarışır!',
    keywords: ['nasıl', 'çalışır', 'mantık', 'sistem', 'ne', 'how'],
    category: 'genel',
    relatedQuestions: ['ilan-nasil-verilir', 'teklif-nasil-gonderilir']
  },

  // ============================================================================
  // İLETİŞİM & DESTEK
  // ============================================================================
  {
    id: 'destek',
    question: 'Destek ekibine nasıl ulaşırım?',
    answer: '📞 **Bize Ulaşın:**\n\n📧 Email: destek@benalsam.com\n💬 WhatsApp: +90 XXX XXX XX XX\n📱 Telefon: 0850 XXX XX XX\n\n⏰ Çalışma saatleri:\nPzt-Cum: 09:00 - 18:00\nCmt: 10:00 - 16:00\n\n⚡ Ortalama yanıt süresi: 2 saat',
    keywords: ['destek', 'yardım', 'iletişim', 'support', 'help', 'telefon', 'email'],
    category: 'destek',
    action: {
      type: 'external',
      value: 'mailto:destek@benalsam.com',
      label: 'Email Gönder'
    },
    relatedQuestions: ['dolandiricilik', 'sikayet']
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set(CHATBOT_FAQ.map(faq => faq.category))
  return Array.from(categories)
}

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category: string): FAQItem[] {
  return CHATBOT_FAQ.filter(faq => faq.category === category)
}

/**
 * Get FAQ by ID
 */
export function getFAQById(id: string): FAQItem | undefined {
  return CHATBOT_FAQ.find(faq => faq.id === id)
}

/**
 * Get popular questions (first 5)
 */
export function getPopularQuestions(): FAQItem[] {
  return CHATBOT_FAQ.slice(0, 5)
}

