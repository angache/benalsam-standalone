import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  User,
  Mail,
  Phone,
  Package,
  Star,
  Clock,
  Calendar,
  Link,
  Crown,
  Info
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useCurrentUserTrustScore, useTrustScoreActions } from '../../hooks/useTrustScore';
import { getTrustLevelColor, getTrustLevelDescription } from '../../services/trustScoreService';

const TrustScorePage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Gerçek trust score verilerini al
  const { data: trustScoreData, isLoading, error, refetch } = useCurrentUserTrustScore();
  const { refreshTrustScore } = useTrustScoreActions();

  const scoreCriteria = {
    profile_completeness: {
      title: "Profil Doluluğu",
      icon: "✏️",
      description: "Profilinize isim, biyografi, avatar ve konum bilgileri ekleyerek puan kazanın.",
      maxPoints: 15,
    },
    email_verification: {
      title: "E-posta Doğrulaması",
      icon: "✅",
      description: "E-posta adresinizi doğrulayarak güvenliğinizi artırın ve 10 puan kazanın.",
      maxPoints: 10,
    },
    phone_verification: {
      title: "Telefon Doğrulaması",
      icon: "📱",
      description: "Telefon numaranızı doğrulayarak hesabınızın güvenliğini artırın ve 10 puan kazanın.",
      maxPoints: 10,
    },
    listings: {
      title: "Aktif İlanlar",
      icon: "📦",
      description: "Yayınladığınız aktif ilan sayısı arttıkça güven puanınız artar. 10'dan fazla ilanınız varsa bu kriterden maksimum puan alırsınız.",
      maxPoints: 15,
    },
    completed_trades: {
      title: "Başarılı İşlemler",
      icon: "🤝",
      description: "Tamamladığınız her başarılı işlem, güvenilirliğinizi kanıtlar. 20'den fazla başarılı işleminiz varsa bu kriterden maksimum puan alırsınız.",
      maxPoints: 20,
    },
    reviews: {
      title: "Kullanıcı Yorumları",
      icon: "⭐",
      description: "Olumlu kullanıcı yorumları güven puanınızı artırır. Yorum sayınız ve ortalama puanınız arttıkça bu kriterden daha fazla puan alırsınız.",
      maxPoints: 15,
    },
    response_time: {
      title: "Yanıt Süresi",
      icon: "⏱️",
      description: "Kullanıcılara hızlı yanıt vererek güven puanınızı artırabilirsiniz. Ortalama yanıt süreniz kısaldıkça bu kriterden daha fazla puan alırsınız.",
      maxPoints: 5,
    },
    account_age: {
      title: "Hesap Yaşı",
      icon: "📅",
      description: "Hesabınızın yaşı arttıkça güven puanınız da artar. Uzun süredir aktif olan kullanıcılar daha güvenilir kabul edilir.",
      maxPoints: 5,
    },
    social_links: {
      title: "Sosyal Medya",
      icon: "🔗",
      description: "Instagram, Twitter, LinkedIn, Facebook, YouTube ve Web Sitesi gibi sosyal medya hesaplarınızı ekleyerek şeffaflığınızı ve güven puanınızı artırabilirsiniz. Birden fazla sosyal medya hesabı ekledikçe bu kriterden daha fazla puan alırsınız.",
      maxPoints: 3,
    },
    premium_status: {
      title: "Premium Üyelik",
      icon: "👑",
      description: "Premium üyelik ile güven puanınız artar. Premium üyeyseniz bu kriterden maksimum puan alırsınız.",
      maxPoints: 2,
    },
  };

  const getProgressColors = (score) => {
    if (score >= 80) return ['#10B981', '#059669']; // Green
    if (score >= 60) return ['#F59E0B', '#D97706']; // Gold
    if (score >= 40) return ['#6B7280', '#4B5563']; // Silver
    return ['#EF4444', '#DC2626']; // Red
  };

  const handleRefresh = async () => {
    triggerHaptic();
    setIsRefreshing(true);
    
    try {
      await refreshTrustScore();
      console.log('Trust score refreshed');
    } catch (error) {
      console.error('Error refreshing trust score:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar2');
  };

  const renderCircularProgress = () => {
    if (!trustScoreData?.data) return null;

    const score = trustScoreData.data.totalScore;
    const progressPercentage = score / 100;
    const progressColors = getProgressColors(score);
    const size = 120;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progressPercentage * circumference);

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Background circle */}
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={progressColors[0]}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: progressColors[0] }}>
                {score}
              </div>
              <div className="text-sm text-gray-500">/100</div>
            </div>
          </div>
        </div>
        
        {/* Level badge */}
        <div className="mt-4 flex flex-col items-center">
          <div 
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ 
              backgroundColor: progressColors[0] + '20',
              color: progressColors[0]
            }}
          >
            {trustScoreData.data.level}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
            {getTrustLevelDescription(trustScoreData.data.level)}
          </p>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Güven puanınız hesaplanıyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <Info size={48} className="mx-auto mb-2" />
          <p className="text-lg font-semibold">Hata Oluştu</p>
          <p className="text-sm text-gray-600">Güven puanınız yüklenirken bir hata oluştu.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  // No data state
  if (!trustScoreData?.data) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <Info size={48} className="mx-auto mb-2" />
          <p className="text-lg font-semibold">Veri Bulunamadı</p>
          <p className="text-sm text-gray-600">Güven puanı verileriniz bulunamadı.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold">Güven Puanı</h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-lg transition-colors ${
            isRefreshing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <RefreshCw 
            size={20} 
            className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Description */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Güven puanınız, platformdaki diğer kullanıcılara ne kadar güvenilir olduğunuzu gösterir. Puanınızı artırmak için aşağıdaki adımları tamamlayabilirsiniz.
          </p>
        </div>

        {/* Trust Score System Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Güven Puanı Sistemi Nedir?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Güven puanı sistemi, platformdaki güvenliği artırmak ve güvenilir kullanıcıları ödüllendirmek için tasarlanmıştır. Yüksek güven puanına sahip kullanıcılar:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Daha fazla ilan görüntülenmesi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Öncelikli destek hizmeti</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Özel rozetler ve tanınırlık</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Daha güvenilir görünme</span>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Toplam Puanınız</h3>
          {renderCircularProgress()}
        </div>

        {/* Criteria List */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Her satırda soldaki sayı mevcut durumunuzu, sağdaki sayı ise bu kriterden güven puanınıza eklenebilecek maksimum puanı gösterir.
            </p>
          </div>
          
          {Object.entries(scoreCriteria).map(([key, criteria]) => {
            const currentScore = trustScoreData.data.breakdown[key] || 0;
            const isCompleted = criteria.maxPoints > 0 && currentScore >= criteria.maxPoints;
            
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border transition-all ${
                  isCompleted 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    isCompleted 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : criteria.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{criteria.title}</h4>
                      <span className={`text-sm font-semibold ${
                        isCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary'
                      }`}>
                        {currentScore} / {criteria.maxPoints}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {criteria.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default TrustScorePage; 