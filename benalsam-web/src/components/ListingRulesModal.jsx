import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ListingRulesModal = ({ isOpen, onOpenChange }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[600px] glass-effect">
      <DialogHeader>
        <DialogTitle>İlan Verme Kuralları</DialogTitle>
        <DialogDescription>
          Platformumuzda adil ve güvenli bir ortam sağlamak için lütfen aşağıdaki kurallara uyun.
        </DialogDescription>
      </DialogHeader>
      <div className="prose prose-invert max-w-none text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
        <h4>1. Yasalara Uygunluk</h4>
        <p>Yasa dışı ürün veya hizmetlerin (silah, uyuşturucu, çalıntı mal vb.) ilanı kesinlikle yasaktır.</p>
        <h4>2. Doğru Bilgi</h4>
        <p>İlan başlığı, açıklaması, kategorisi ve görselleri aradığınız ürün veya hizmeti doğru ve net bir şekilde yansıtmalıdır. Yanıltıcı bilgi vermek yasaktır.</p>
        <h4>3. Tek İlan Kuralı</h4>
        <p>Aynı ürün veya hizmet için birden fazla ilan yayınlamak yasaktır. Farklı ilanlar, farklı ihtiyaçları belirtmelidir.</p>
        <h4>4. Fiyatlandırma</h4>
        <p>Belirttiğiniz bütçe, aradığınız ürün veya hizmet için gerçekçi ve makul olmalıdır. Sembolik veya yanıltıcı fiyatlar girmeyin.</p>
        <h4>5. Görsel Kalitesi</h4>
        <p>Yüklenen görseller net olmalı ve aranan ürünü temsil etmelidir. Başka ilanlardan veya internetten alınmış, telif hakkı içeren görseller kullanılamaz.</p>
        <h4>6. İletişim Bilgileri</h4>
        <p>İlan açıklamasına telefon numarası, e-posta adresi gibi kişisel iletişim bilgileri eklemek yasaktır. İletişim, platform üzerinden mesajlaşma veya teklif sistemi ile sağlanmalıdır.</p>
        <h4>7. Yasaklı İçerik</h4>
        <p>Ayrımcılık, nefret söylemi, hakaret, şiddet içeren veya müstehcen içeriklerin kullanılması yasaktır.</p>
        <p className="font-bold mt-4">Bu kurallara uymayan ilanlar, yöneticilerimiz tarafından uyarı yapılmaksızın kaldırılabilir ve kullanıcının hesabı askıya alınabilir.</p>
      </div>
      <DialogFooter>
        <Button onClick={() => onOpenChange(false)}>Anladım, Kapat</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ListingRulesModal;