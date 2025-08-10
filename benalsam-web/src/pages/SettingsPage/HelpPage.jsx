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
  CheckCircle
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

const HelpPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const handleGoBack = () => {
    navigate('/ayarlar2');
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
        initial={false}
        animate={{ height: 'auto' }}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        <button
          onClick={() => toggleItem(item.id)}
          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
        >
          <span className="font-medium text-gray-900 dark:text-white">{item.question}</span>
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-500" />
          ) : (
            <ChevronDown size={20} className="text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderInfoCard = (title, description, icon) => (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">{title}</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Yardım Merkezi</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Info Card */}
      {renderInfoCard(
        'Yardım Merkezi',
        'Sıkça sorulan sorular ve platform kullanımı hakkında detaylı bilgiler.',
        <HelpCircle size={20} className="text-blue-600 dark:text-blue-400" />
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Sorunuzu arayın..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/ayarlar2/iletisim')}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-white">İletişim</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bizimle iletişime geçin</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/ayarlar2/geri-bildirim')}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-white">Geri Bildirim</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Önerilerinizi paylaşın</p>
            </div>
          </div>
        </button>

        <a
          href="tel:+905555555555"
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-white">Telefon</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">0555 555 55 55</p>
            </div>
          </div>
        </a>
      </div>

      {/* FAQ Sections */}
      {filteredFAQ.length === 0 ? (
        <div className="text-center py-8">
          <HelpCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sonuç Bulunamadı</h3>
          <p className="text-gray-500 dark:text-gray-400">Arama teriminizle eşleşen soru bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFAQ.map(category => (
            <div key={category.id} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Info size={20} className="mr-2 text-primary" />
                {category.title}
              </h2>
              <div className="space-y-2">
                {category.items.map(renderFAQItem)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <AlertCircle size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">Hala Yardıma İhtiyacınız Var mı?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sorununuzu çözemediysek, destek ekibimizle iletişime geçin. Size en kısa sürede yardımcı olacağız.
            </p>
            <div className="flex space-x-4 mt-3">
              <button
                onClick={() => navigate('/ayarlar2/iletisim')}
                className="text-sm text-primary hover:underline"
              >
                İletişim Formu
              </button>
              <a
                href="mailto:destek@benalsam.com"
                className="text-sm text-primary hover:underline flex items-center"
              >
                <Mail size={16} className="mr-1" />
                E-posta
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HelpPage; 