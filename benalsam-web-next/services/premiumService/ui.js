import { toast } from '@/components/ui/use-toast';

// Premium plan özellikleri ve UI için gerekli veriler

export const getPlanFeatures = () => {
  return {
    basic: {
      name: 'Temel Plan',
      price: 0,
      period: 'ay',
      popular: false,
      features: [
        'Aylık 10 teklif hakkı',
        'Alıcılara mesaj gönderme',
        'Teklifine 1 resim ekleyebilme',
        'Temel destek'
      ],
      limits: {
        offers_per_month: 10,
        messages_per_month: 50,
        images_per_offer: 1,
        featured_offers_per_day: 0,
        files_per_offer: 0
      }
    },
    advanced: {
      name: 'Gelişmiş Plan',
      price: 99,
      period: 'ay',
      popular: true,
      features: [
        'Aylık 100 teklif hakkı',
        'Tüm tekliflerde 3 resim ekleyebilme',
        'Günde 1 öne çıkarılmış teklif',
        'Yeni ilanlarda ilk 30 dakika öncelik',
        'Temel teklif görüntüleme istatistikleri',
        'Hızlı müşteri desteği'
      ],
      limits: {
        offers_per_month: 100,
        messages_per_month: 200,
        images_per_offer: 3,
        featured_offers_per_day: 1,
        files_per_offer: 0
      }
    },
    corporate: {
      name: 'Kurumsal Plan',
      price: 249,
      period: 'ay',
      popular: false,
      features: [
        'Sınırsız teklif hakkı',
        'Tüm tekliflerde 5 resim ve dosya ekleme',
        'Günde 5 öne çıkarılmış teklif',
        'Öncelikli sıralama ve "🔰 Güvenilir Tedarikçi" rozeti',
        'Yapay Zeka ile teklif önerisi',
        'Detaylı teklif performans raporları',
        'Direkt iletişim (İlan sahibine anında mesaj)',
        'Kurumsal profil ve faturalandırma',
        'Premium canlı destek'
      ],
      limits: {
        offers_per_month: -1, // Sınırsız
        messages_per_month: -1, // Sınırsız
        images_per_offer: 5,
        featured_offers_per_day: 5,
        files_per_offer: 3
      }
    }
  };
};

export const getPlanBadges = () => {
  return {
    basic: {
      icon: '🛡️',
      color: 'bg-gray-500',
      text: 'Temel'
    },
    advanced: {
      icon: '⭐',
      color: 'bg-blue-500',
      text: 'Gelişmiş'
    },
    corporate: {
      icon: '👑',
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      text: 'Kurumsal'
    }
  };
};

export const getFeatureComparison = () => {
  return [
    {
      category: 'Teklif Verme',
      features: [
        {
          name: 'Aylık Teklif Hakkı',
          basic: '10 teklif',
          advanced: '100 teklif',
          corporate: 'Sınırsız'
        },
        {
          name: 'Resim Ekleme',
          basic: '1 resim',
          advanced: '3 resim',
          corporate: '5 resim'
        },
        {
          name: 'Dosya Ekleme',
          basic: '❌',
          advanced: '❌',
          corporate: '✅ 3 dosya'
        }
      ]
    },
    {
      category: 'Öne Çıkarma',
      features: [
        {
          name: 'Günlük Öne Çıkarma',
          basic: '❌',
          advanced: '1 teklif',
          corporate: '5 teklif'
        },
        {
          name: 'Öncelikli Erişim',
          basic: '❌',
          advanced: '30 dakika',
          corporate: '60 dakika'
        }
      ]
    },
    {
      category: 'İletişim',
      features: [
        {
          name: 'Aylık Mesaj Hakkı',
          basic: '50 mesaj',
          advanced: '200 mesaj',
          corporate: 'Sınırsız'
        },
        {
          name: 'Direkt İletişim',
          basic: '❌',
          advanced: '❌',
          corporate: '✅'
        }
      ]
    },
    {
      category: 'Analiz ve Raporlar',
      features: [
        {
          name: 'Temel İstatistikler',
          basic: '❌',
          advanced: '✅',
          corporate: '✅'
        },
        {
          name: 'Detaylı Raporlar',
          basic: '❌',
          advanced: '❌',
          corporate: '✅'
        },
        {
          name: 'AI Teklif Önerileri',
          basic: '❌',
          advanced: '❌',
          corporate: '✅'
        }
      ]
    },
    {
      category: 'Destek',
      features: [
        {
          name: 'Müşteri Desteği',
          basic: 'Temel',
          advanced: 'Hızlı',
          corporate: 'Premium Canlı'
        },
        {
          name: 'Güven Rozetleri',
          basic: '❌',
          advanced: '❌',
          corporate: '✅'
        }
      ]
    }
  ];
};

// Premium yükseltme toast mesajı göster
export const showPremiumUpgradeToast = (featureType, currentUsage, limit) => {
  const featureMessages = {
    offer: {
      title: "🚀 Teklif Limitiniz Doldu!",
      description: `Bu ay ${currentUsage}/${limit} teklif hakkınızı kullandınız. Premium'a geçerek sınırsız teklif verin!`
    },
    message: {
      title: "💬 Mesaj Limitiniz Doldu!",
      description: `Bu ay ${currentUsage}/${limit} mesaj hakkınızı kullandınız. Premium'a geçerek sınırsız mesajlaşın!`
    },
    image: {
      title: "📸 Resim Limitiniz Doldu!",
      description: `Tekliflerinize daha fazla resim eklemek için Premium'a geçin! (Mevcut: ${currentUsage}, Limit: ${limit})`
    },
    listing: {
      title: "📋 İlan Limitiniz Doldu!",
      description: `Bu ay ${currentUsage}/${limit} ilan hakkınızı kullandınız. Premium'a geçerek daha fazla ilan verin!`
    },
    featured_offer: {
      title: "⭐ Öne Çıkarma Özelliği",
      description: "Tekliflerinizi öne çıkarmak için Premium üyelik gerekiyor. Daha fazla görünürlük kazanın!"
    },
    file_attachment: {
      title: "📎 Dosya Ekleme Özelliği",
      description: "Tekliflerinize dosya eklemek için Premium üyelik gerekiyor. Daha detaylı teklifler verin!"
    }
  };

  const message = featureMessages[featureType] || {
    title: "🔒 Premium Özellik",
    description: "Bu özelliği kullanmak için Premium üyelik gerekiyor."
  };

  toast({
    title: message.title,
    description: message.description,
    duration: 7000,
    action: {
      altText: "Premium'a Geç",
      onClick: () => {
        // Premium modal açma veya premium sayfasına yönlendirme
        window.location.href = '/ayarlar/premium';
      }
    }
  });
};