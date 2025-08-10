import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { Header, Card } from '../components';
import { useTrustScore, useTrustScoreActions } from '../hooks/queries/useTrustScore';
import { getTrustLevelColor, getTrustLevelDescription } from '../services/trustScoreService';
import { RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useMyProfile } from '../hooks/queries/useAuth';

const { width } = Dimensions.get('window');

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

const TrustScoreScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  
  const userId = route.params?.userId;
  const { data: trustScoreData, isLoading, error } = useTrustScore(userId);
  const { refreshTrustScore, isUpdating } = useTrustScoreActions();
  const { data: profile } = useMyProfile();

  const handleRefresh = async () => {
    try {
      await refreshTrustScore(userId);
      Alert.alert('Başarılı', 'Güven puanınız güncellendi!');
    } catch (error) {
      Alert.alert('Hata', 'Güven puanı güncellenirken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trustScoreData?.data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Güven puanı yüklenirken bir hata oluştu
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, { color: colors.white }]}>
              Tekrar Dene
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { totalScore, breakdown, level, progressToNextLevel } = trustScoreData.data;

  const getScore = (key: keyof typeof breakdown) => {
    return breakdown[key] || 0;
  };

  // Profil doluluk alanları
  const profileFields = [
    profile?.first_name,
    profile?.last_name,
    profile?.username,
    profile?.bio,
    profile?.avatar_url,
    profile?.province,
    profile?.district,
  ];
  const totalProfileFields = profileFields.length;
  const filledProfileFields = profileFields.filter(Boolean).length;
  // Puanı hesapla (ör: 3/7 ise 15 * 3/7)
  const profileCompletenessScore = Number(((filledProfileFields / totalProfileFields) * scoreCriteria.profile_completeness.maxPoints).toFixed(1));

  const renderCircularProgress = () => {
    const radius = 60;
    const strokeWidth = 8;
    const size = radius * 2;
    
    // Debug için
    console.log('TrustScore Debug:', { totalScore, level });
    
    // Gradient renk hesaplama
    const getProgressColors = (score: number) => {
      if (score <= 25) {
        return ['#FF6B6B', '#FF8E8E'] as const; // Kırmızı gradient
      } else if (score <= 50) {
        return ['#FFA726', '#FFB74D'] as const; // Turuncu gradient
      } else if (score <= 75) {
        return ['#FFD54F', '#FFE082'] as const; // Sarı gradient
      } else {
        return ['#4CAF50', '#66BB6A'] as const; // Yeşil gradient
      }
    };
    
    const progressColors = getProgressColors(totalScore);
    const progressPercentage = totalScore / 100;
    
    console.log('Progress Debug:', { progressPercentage, totalScore });
    
    return (
      <View style={styles.progressContainer}>
        {/* Üstte puan */}
        <Text style={[styles.scoreText, { color: colors.text, marginBottom: 8 }]}>{totalScore}</Text>
        <View style={styles.progressCircle}>
          {/* Arka plan daire */}
          <View
            style={[
              styles.progressBackground,
              {
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: '#E5E7EB',
              },
            ]}
          />
          {/* Progress daire */}
          <View
            style={[
              styles.progressFill,
              {
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderTopColor: progressPercentage > 0.125 ? progressColors[0] : 'transparent',
                borderRightColor: progressPercentage > 0.375 ? progressColors[0] : 'transparent',
                borderBottomColor: progressPercentage > 0.625 ? progressColors[0] : 'transparent',
                borderLeftColor: progressPercentage > 0.875 ? progressColors[0] : 'transparent',
                transform: [{ rotate: '-90deg' }],
              },
            ]}
          />
        </View>
        {/* Altta /100 */}
        <Text style={[styles.scoreMax, { color: colors.textSecondary, marginTop: 8 }]}>/100</Text>
        {/* Seviye bilgisi */}
        <View style={styles.levelInfo}>
          <View style={[
            styles.levelBadge,
            level.toLowerCase() === 'silver'
              ? { backgroundColor: '#C0C0C0' }
              : { backgroundColor: progressColors[0] + '20' }
          ]}>
            <Text style={[
              styles.levelText,
              level.toLowerCase() === 'silver'
                ? { color: '#757575' }
                : { color: progressColors[0] }
            ]}>
              {level.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.levelDescription, { color: colors.textSecondary }]}>
            {getTrustLevelDescription(level)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.customHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Güven Puanı</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isUpdating}
        >
          <RefreshCw 
            size={20} 
            color={colors.primary} 
            style={isUpdating ? styles.rotating : undefined}
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.mainCard}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Güven puanınız, platformdaki diğer kullanıcılara ne kadar güvenilir olduğunuzu gösterir. Puanınızı artırmak için aşağıdaki adımları tamamlayabilirsiniz.
          </Text>

          {/* Trust Score Sistemi Hakkında Bilgi */}
          <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Güven Puanı Sistemi Nedir?</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Güven puanı sistemi, platformdaki güvenliği artırmak ve güvenilir kullanıcıları ödüllendirmek için tasarlanmıştır. Yüksek güven puanına sahip kullanıcılar:
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text>
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Daha fazla ilan görüntülenmesi</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text>
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Öncelikli destek hizmeti</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text>
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Özel rozetler ve tanınırlık</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text>
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>Daha güvenilir görünme</Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreSection}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              Toplam Puanınız
            </Text>
            {renderCircularProgress()}
          </View>

          <View style={styles.criteriaContainer}>
            {/* Kriter puan açıklaması */}
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
              Her satırda soldaki sayı mevcut durumunuzu, sağdaki sayı ise bu kriterden güven puanınıza eklenebilecek maksimum puanı gösterir.
            </Text>
            {Object.entries(scoreCriteria).map(([key, criteria]) => {
              let currentScore = getScore(key as keyof typeof breakdown);
              let extraInfo = null;
              if (key === 'profile_completeness') {
                currentScore = profileCompletenessScore;
                extraInfo = (
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {filledProfileFields} / {totalProfileFields} alan dolu
                  </Text>
                );
              }
              if (key === 'email_verification') {
                currentScore = (breakdown[key as keyof typeof breakdown] && breakdown[key as keyof typeof breakdown] >= 1) ? criteria.maxPoints : 0;
              }
              if (key === 'phone_verification') {
                currentScore = (breakdown[key as keyof typeof breakdown] && breakdown[key as keyof typeof breakdown] >= 1) ? criteria.maxPoints : 0;
              }
              if ([
                'listings',
                'completed_trades',
                'reviews',
                'response_time',
                'account_age',
                'social_links',
                'premium_status',
              ].includes(key)) {
                currentScore = Number((((breakdown[key as keyof typeof breakdown] as number) / 100) * criteria.maxPoints).toFixed(2));
              }
              const isCompleted = criteria.maxPoints > 0 && currentScore >= criteria.maxPoints;
              
              return (
                <View 
                  key={key} 
                  style={[
                    styles.criteriaItem, 
                    { backgroundColor: colors.surface }
                  ]}
                >
                  <View style={styles.criteriaHeader}>
                    <View style={[
                      styles.criteriaIcon, 
                      { 
                        backgroundColor: isCompleted ? colors.success + '20' : colors.surface,
                        borderColor: colors.border
                      }
                    ]}>
                      <Text style={styles.criteriaIconText}>
                        {isCompleted ? '✓' : criteria.icon}
                      </Text>
                    </View>
                    <View style={styles.criteriaContent}>
                      <View style={styles.criteriaTitleRow}>
                        <Text style={[styles.criteriaTitle, { color: colors.text }]}>
                          {criteria.title}
                        </Text>
                        <Text style={[
                          styles.criteriaScore, 
                          { color: isCompleted ? colors.success : colors.primary }
                        ]}>
                          {currentScore} / {criteria.maxPoints}
                        </Text>
                      </View>
                      {extraInfo}
                      <Text style={[styles.criteriaDescription, { color: colors.textSecondary }]}>
                        {criteria.description}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
  },
  progressFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 1,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 16,
  },
  levelInfo: {
    alignItems: 'center',
    marginTop: 48,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelDescription: {
    fontSize: 12,
  },
  criteriaContainer: {
    gap: 12,
  },
  criteriaItem: {
    padding: 16,
    borderRadius: 12,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  criteriaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  criteriaIconText: {
    fontSize: 16,
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  criteriaScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  criteriaDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  refreshButton: {
    padding: 8,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
  },
});

export default TrustScoreScreen; 