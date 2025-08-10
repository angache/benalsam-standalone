import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Shield, Star, Users, CheckCircle, ArrowLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TrustScoreInfoScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  const benefits = [
    {
      icon: Shield,
      title: 'Güvenli Alışveriş',
      description: 'Yüksek güven puanına sahip kullanıcılarla güvenle takas yapın',
    },
    {
      icon: Star,
      title: 'Öncelikli Görünürlük',
      description: 'İlanlarınız daha fazla kullanıcı tarafından görülür',
    },
    {
      icon: Users,
      title: 'Güvenilir Profil',
      description: 'Diğer kullanıcılar size daha çok güvenir',
    },
    {
      icon: CheckCircle,
      title: 'Özel Rozetler',
      description: 'Seviyenize göre özel rozetler kazanın',
    },
  ];

  const howToImprove = [
    {
      title: 'Profilinizi Tamamlayın',
      description: 'İsim, bio, avatar ve konum bilgilerinizi ekleyin',
      points: '15 puan',
    },
    {
      title: 'Telefonunuzu Doğrulayın',
      description: 'Telefon numaranızı doğrulayarak ekstra güvenlik sağlayın',
      points: '10 puan',
    },
    {
      title: 'İlanlar Yayınlayın',
      description: 'Aktif ilanlarınızı artırın',
      points: '15 puan',
    },
    {
      title: 'Başarılı Takaslar Yapın',
      description: 'Takasları tamamlayarak güvenilirliğinizi kanıtlayın',
      points: '20 puan',
    },
    {
      title: 'Olumlu Yorumlar Alın',
      description: 'Diğer kullanıcılardan iyi yorumlar alın',
      points: '15 puan',
    },
    {
      title: 'Hızlı Yanıt Verin',
      description: 'Mesajlara hızlı yanıt verin',
      points: '5 puan',
    },
  ];

  const levels = [
    { name: 'BRONZE', range: '0-30', color: '#CD7F32', description: 'Yeni kullanıcı' },
    { name: 'SILVER', range: '31-60', color: '#C0C0C0', description: 'Güvenilir kullanıcı' },
    { name: 'GOLD', range: '61-85', color: '#FFD700', description: 'Çok güvenilir kullanıcı' },
    { name: 'PLATINUM', range: '86-100', color: '#E5E4E2', description: 'Premium güvenilir kullanıcı' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Güven Puanı Sistemi</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: colors.primary + '10' }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '20' }]}>
            <Award size={48} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Güven Puanı Sistemi
          </Text>
          <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
            Platformdaki güvenliği artırmak ve güvenilir kullanıcıları ödüllendirmek için tasarlanmıştır.
          </Text>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Avantajlar</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Yüksek güven puanına sahip olmanın faydaları:
          </Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <View key={index} style={[styles.benefitCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Icon size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                    {benefit.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* How to Improve Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Puanınızı Nasıl Artırırsınız?</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Güven puanınızı artırmak için yapabilecekleriniz:
          </Text>
          <View style={styles.improvementList}>
            {howToImprove.map((item, index) => (
              <View key={index} style={[styles.improvementItem, { backgroundColor: colors.surface }]}>
                <View style={styles.improvementContent}>
                  <Text style={[styles.improvementTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.improvementDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.pointsText, { color: colors.primary }]}>
                    {item.points}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Levels Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Seviyeler</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Güven puanınıza göre seviyeleriniz:
          </Text>
          <View style={styles.levelsList}>
            {levels.map((level, index) => (
              <View key={index} style={[styles.levelItem, { backgroundColor: colors.surface }]}>
                <View style={[styles.levelBadge, { backgroundColor: level.color + '20', borderColor: level.color }]}>
                  <Text style={[styles.levelName, { color: level.color }]}>
                    {level.name}
                  </Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={[styles.levelRange, { color: colors.text }]}>
                    {level.range} puan
                  </Text>
                  <Text style={[styles.levelDescription, { color: colors.textSecondary }]}>
                    {level.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('TrustScore', { userId: 'current' })}
          >
            <Text style={[styles.ctaButtonText, { color: colors.white }]}>
              Güven Puanımı Gör
            </Text>
            <ChevronRight size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  improvementList: {
    gap: 12,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  improvementContent: {
    flex: 1,
  },
  improvementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  improvementDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelsList: {
    gap: 12,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 16,
  },
  levelName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelInfo: {
    flex: 1,
  },
  levelRange: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  levelDescription: {
    fontSize: 14,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrustScoreInfoScreen; 