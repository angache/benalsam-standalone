import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  Shield
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

const HelpPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const handleGoBack = () => {
    navigate('/ayarlar');
  };

  const toggleItem = (id) => {
    triggerHaptic();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const faqData = [
    {
      id: 'account',
      title: 'Hesap ve Güvenlik',
      items: [
        {
          id: 'how-to-signup',
          question: 'Nasıl hesap oluşturabilirim?',
          answer: 'Ana sayfadaki "Giriş Yap" butonuna tıklayın ve "Hesap Oluştur" seçeneğini seçin. E-posta adresinizi ve güçlü bir şifre girin. E-posta doğrulamasından sonra hesabınız aktif olacaktır.'
        },
        {
          id: 'forgot-password',
          question: 'Şifremi unuttum, ne yapmalıyım?',
          answer: 'Giriş sayfasında "Şifremi Unuttum" linkine tıklayın. E-posta adresinizi girin ve size gönderilen sıfırlama linkini kullanarak yeni şifrenizi belirleyin.'
        },
        {
          id: 'change-password',
          question: 'Şifremi nasıl değiştirebilirim?',
          answer: 'Ayarlar > Güvenlik sayfasından mevcut şifrenizi girerek yeni şifrenizi belirleyebilirsiniz. Güçlü bir şifre seçmeyi unutmayın.'
        },
        {
          id: 'two-factor',
          question: 'İki faktörlü doğrulama nedir?',
          answer: 'İki faktörlü doğrulama, hesabınızı ekstra güvenlik katmanı ile korur. Şifrenizle birlikte telefonunuza gelen kod ile giriş yaparsınız. Bu özellik yakında eklenecektir.'
        }
      ]
    },
    {
      id: 'listings',
      title: 'İlan Oluşturma ve Yönetimi',
      items: [
        {
          id: 'create-listing',
          question: 'Nasıl ilan oluşturabilirim?',
          answer: 'Ana sayfadaki "İlan Ver" butonuna tıklayın. Kategori seçin, ilan detaylarını girin, fotoğraf ekleyin ve konum belirleyin. İlanınız onaylandıktan sonra yayınlanacaktır.'
        },
        {
          id: 'edit-listing',
          question: 'İlanımı nasıl düzenleyebilirim?',
          answer: 'Profil sayfanızdan "İlanlarım" bölümüne gidin. Düzenlemek istediğiniz ilana tıklayın ve "Düzenle" butonunu kullanın. Değişiklikler onaylandıktan sonra güncellenecektir.'
        },
        {
          id: 'delete-listing',
          question: 'İlanımı nasıl silebilirim?',
          answer: 'İlan detay sayfasında "Sil" butonunu bulun. Silme işlemi geri alınamaz, bu yüzden emin olduğunuzdan emin olun.'
        },
        {
          id: 'listing-approval',
          question: 'İlanım neden onaylanmadı?',
          answer: 'İlanlar güvenlik ve kalite kontrolü için incelenir. Genellikle 24 saat içinde onaylanır. İlanınız reddedilirse e-posta ile bilgilendirilirsiniz.'
        }
      ]
    },
    {
      id: 'offers',
      title: 'Teklif Verme ve Alma',
      items: [
        {
          id: 'make-offer',
          question: 'Nasıl teklif verebilirim?',
          answer: 'İlan detay sayfasında "Teklif Ver" butonuna tıklayın. Teklif miktarınızı ve mesajınızı girin. Teklifiniz ilan sahibine iletilecektir.'
        },
        {
          id: 'offer-status',
          question: 'Teklif durumumu nasıl takip edebilirim?',
          answer: 'Profil sayfanızdan "Tekliflerim" bölümüne gidin. Gönderdiğiniz ve aldığınız teklifleri buradan takip edebilirsiniz.'
        },
        {
          id: 'accept-offer',
          question: 'Teklifi nasıl kabul edebilirim?',
          answer: 'Gelen teklifler "Aldığım Teklifler" bölümünde görünür. Teklifi kabul etmek için "Kabul Et" butonuna tıklayın.'
        },
        {
          id: 'negotiate-offer',
          question: 'Teklif üzerinde pazarlık yapabilir miyim?',
          answer: 'Evet, teklif verirken mesajınızda pazarlık yapabilirsiniz. İlan sahibi ile mesajlaşarak anlaşmaya varabilirsiniz.'
        }
      ]
    },
    {
      id: 'messaging',
      title: 'Mesajlaşma',
      items: [
        {
          id: 'start-conversation',
          question: 'Kullanıcı ile nasıl mesajlaşabilirim?',
          answer: 'Kullanıcı profilinde veya ilan detay sayfasında "Mesaj Gönder" butonuna tıklayın. Mesajınızı yazın ve gönderin.'
        },
        {
          id: 'message-notifications',
          question: 'Mesaj bildirimlerini nasıl yönetebilirim?',
          answer: 'Ayarlar > Bildirimler sayfasından mesaj bildirimlerini açıp kapatabilirsiniz. Push ve e-posta bildirimleri ayrı ayrı yönetilebilir.'
        },
        {
          id: 'block-user',
          question: 'Kullanıcıyı nasıl engelleyebilirim?',
          answer: 'Mesajlaşma sayfasında kullanıcı profilinden "Engelle" seçeneğini kullanabilirsiniz. Engellediğiniz kullanıcılar Ayarlar > Engellenen Kullanıcılar\'da görünür.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Teknik Sorunlar',
      items: [
        {
          id: 'app-not-working',
          question: 'Uygulama çalışmıyor, ne yapmalıyım?',
          answer: 'Önce uygulamayı kapatıp yeniden açın. Sorun devam ederse cihazınızı yeniden başlatın. Hala sorun yaşıyorsanız destek ekibimizle iletişime geçin.'
        },
        {
          id: 'slow-loading',
          question: 'Sayfalar yavaş yükleniyor',
          answer: 'İnternet bağlantınızı kontrol edin. Tarayıcı önbelleğini temizleyin. Sorun devam ederse farklı bir tarayıcı deneyin.'
        },
        {
          id: 'photo-upload',
          question: 'Fotoğraf yükleyemiyorum',
          answer: 'Fotoğraf boyutunun 10MB\'dan küçük olduğundan emin olun. Desteklenen formatlar: JPG, PNG, WebP. Fotoğrafı yeniden çekmeyi deneyin.'
        },
        {
          id: 'location-problem',
          question: 'Konum seçemiyorum',
          answer: 'Tarayıcınızın konum izinlerini kontrol edin. Manuel olarak il/ilçe seçmeyi deneyin. GPS\'inizin açık olduğundan emin olun.'
        }
      ]
    }
  ];

  // Filter FAQ based on search term
  const filteredFAQ = faqData.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const renderFAQItem = (item) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-0">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full p-4 text-left hover:bg-accent/50 transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-foreground">{item.question}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-muted-foreground" />
              </motion.div>
            </button>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 pb-4"
              >
                <Separator className="mb-4" />
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.answer}
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="hover:bg-accent"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">Yardım Merkezi</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </motion.div>

      {/* Info Card */}
      {renderInfoCard(
        'Yardım Merkezi',
        'Sıkça sorulan sorular ve platform kullanımı hakkında detaylı bilgiler.',
        <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Search Bar */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Sorunuzu arayın..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary/20"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => navigate('/ayarlar/iletisim')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-foreground">İletişim</h3>
                <p className="text-sm text-muted-foreground">Bizimle iletişime geçin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => navigate('/ayarlar/geri-bildirim')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-foreground">Geri Bildirim</h3>
                <p className="text-sm text-muted-foreground">Önerilerinizi paylaşın</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => window.open('tel:+905555555555')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-foreground">Telefon</h3>
                <p className="text-sm text-muted-foreground">0555 555 55 55</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Sections */}
      {filteredFAQ.length === 0 ? (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
              <HelpCircle size={48} className="text-muted-foreground" />
            </div>
          </motion.div>
          <h3 className="text-lg font-medium text-foreground mb-2">Sonuç Bulunamadı</h3>
          <p className="text-muted-foreground">Arama teriminizle eşleşen soru bulunamadı.</p>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {filteredFAQ.map((category, categoryIndex) => (
            <motion.div 
              key={category.id} 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + categoryIndex * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <Info size={20} className="mr-2 text-primary" />
                  {category.title}
                </h2>
                <Badge variant="secondary">{category.items.length} soru</Badge>
              </div>
              <div className="space-y-2">
                {category.items.map(renderFAQItem)}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                <AlertCircle size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 dark:text-orange-100">Hala Yardıma İhtiyacınız Var mı?</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Sorununuzu çözemediysek, destek ekibimizle iletişime geçin. Size en kısa sürede yardımcı olacağız.
                </p>
                <div className="flex space-x-4 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/ayarlar/iletisim')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/20"
                  >
                    İletişim Formu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('mailto:destek@benalsam.com')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/20"
                  >
                    <Mail size={16} className="mr-1" />
                    E-posta
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default HelpPage; 