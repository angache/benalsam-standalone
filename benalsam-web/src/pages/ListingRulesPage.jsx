import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ListingRulesPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center">
          <Shield className="w-7 h-7 mr-3 text-primary" />
          <h1 className="text-2xl font-bold text-gradient">İlan Verme Kuralları</h1>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-8">
        <p className="text-muted-foreground mb-8">
          Platformumuzda adil ve güvenli bir ortam sağlamak için lütfen aşağıdaki kurallara uyun.
        </p>

        <div className="prose prose-invert max-w-none text-sm text-muted-foreground space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">1. Yasalara Uygunluk</h4>
            <p>Yasa dışı ürün veya hizmetlerin (silah, uyuşturucu, çalıntı mal vb.) ilanı kesinlikle yasaktır.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">2. Doğru Bilgi</h4>
            <p>İlan başlığı, açıklaması, kategorisi ve görselleri aradığınız ürün veya hizmeti doğru ve net bir şekilde yansıtmalıdır. Yanıltıcı bilgi vermek yasaktır.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">3. Tek İlan Kuralı</h4>
            <p>Aynı ürün veya hizmet için birden fazla ilan yayınlamak yasaktır. Farklı ilanlar, farklı ihtiyaçları belirtmelidir.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">4. Fiyatlandırma</h4>
            <p>Belirttiğiniz bütçe, aradığınız ürün veya hizmet için gerçekçi ve makul olmalıdır. Sembolik veya yanıltıcı fiyatlar girmeyin.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">5. Görsel Kalitesi</h4>
            <p>Yüklenen görseller net olmalı ve aranan ürünü temsil etmelidir. Başka ilanlardan veya internetten alınmış, telif hakkı içeren görseller kullanılamaz.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">6. İletişim Bilgileri</h4>
            <p>İlan açıklamasına telefon numarası, e-posta adresi gibi kişisel iletişim bilgileri eklemek yasaktır. İletişim, platform üzerinden mesajlaşma veya teklif sistemi ile sağlanmalıdır.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">7. Yasaklı İçerik</h4>
            <p>Ayrımcılık, nefret söylemi, hakaret, şiddet içeren veya müstehcen içeriklerin kullanılması yasaktır.</p>
          </div>

          <div className="mt-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="font-bold text-destructive">
              Bu kurallara uymayan ilanlar, yöneticilerimiz tarafından uyarı yapılmaksızın kaldırılabilir ve kullanıcının hesabı askıya alınabilir.
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate(-1)} className="btn-primary">
            Anladım, Kapat
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingRulesPage;