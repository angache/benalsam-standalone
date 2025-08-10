import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { useAuthStore } from '../stores';
import { Header, Card, Badge, Button } from '../components';
import {
  getUserActivePlan,
  getUserMonthlyUsage,
  getPlanFeatures,
  createSubscription,
} from '../services/premiumService';

const { width } = Dimensions.get('window');

const PremiumScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  
  const [plans] = useState(getPlanFeatures());
  const [userPlan, setUserPlan] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [planData, usageData] = await Promise.all([
        getUserActivePlan(user!.id),
        getUserMonthlyUsage(user!.id)
      ]);
      setUserPlan(planData);
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planSlug: string) => {
    if (!user) return;
    
    setUpgrading(planSlug);
    
    Alert.alert(
      "🚧 Ödeme Sistemi Yakında!",
      "Premium üyelik sistemi geliştirme aşamasında. Çok yakında sizlerle! 🚀",
      [{ text: 'Tamam' }]
    );
    
    setUpgrading(null);
  };

  const getCurrentPlanSlug = () => {
    return userPlan?.plan_slug || 'basic';
  };

  const isCurrentPlan = (planSlug: string) => {
    return getCurrentPlanSlug() === planSlug;
  };

  const canUpgrade = (planSlug: string) => {
    const currentSlug = getCurrentPlanSlug();
    const planOrder = ['basic', 'advanced', 'corporate'];
    return planOrder.indexOf(planSlug) > planOrder.indexOf(currentSlug);
  };

  const getFeatureIcon = (featureName: string) => {
    if (featureName.includes('teklif') || featureName.includes('ilan')) return '📝';
    if (featureName.includes('resim') || featureName.includes('fotoğraf')) return '📷';
    if (featureName.includes('mesaj')) return '💬';
    if (featureName.includes('öne çıkar')) return '⭐';
    if (featureName.includes('vitrin') || featureName.includes('görüntüleme')) return '👁️';
    if (featureName.includes('dosya')) return '📎';
    if (featureName.includes('AI') || featureName.includes('Yapay')) return '🤖';
    if (featureName.includes('destek')) return '🛡️';
    if (featureName.includes('kurumsal') || featureName.includes('rozet')) return '👥';
    return '✅';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Daha fazla özellik ve sınırsız kullanım için Premium'a geçin
        </Text>

        {usage && (
          <Card style={styles.usageCard}>
            <Text style={[styles.usageTitle, { color: colors.text }]}>
              📊 Bu Ay Kullanımınız
            </Text>
            <View style={styles.usageGrid}>
              <View style={styles.usageItem}>
                <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Teklifler:</Text>
                <Text style={[styles.usageValue, { color: colors.text }]}>{usage.offers_count || 0}</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Mesajlar:</Text>
                <Text style={[styles.usageValue, { color: colors.text }]}>{usage.messages_count || 0}</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Öne Çıkan:</Text>
                <Text style={[styles.usageValue, { color: colors.text }]}>{usage.featured_offers_count || 0}</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Plan:</Text>
                <Text style={[styles.usageValue, { color: colors.text }]}>{userPlan?.plan_name || 'Temel Plan'}</Text>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.plansContainer}>
          {Object.entries(plans).map(([planSlug, plan]: [string, any]) => (
            <Card
              key={planSlug}
              style={{
                ...styles.planCard,
                ...(plan.popular && { borderColor: colors.primary, borderWidth: 2 }),
                ...(isCurrentPlan(planSlug) && { borderColor: colors.success, borderWidth: 2 })
              }}
            >
              {plan.popular && (
                <Badge
                  label="Önerilen"
                  variant="primary"
                  style={styles.popularBadge}
                />
              )}
              
              {isCurrentPlan(planSlug) && (
                <Badge
                  label="Mevcut Plan"
                  variant="success"
                  style={styles.currentBadge}
                />
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.text }]}>
                  {planSlug === 'corporate' && '👑 '}
                  {planSlug === 'advanced' && '⭐ '}
                  {planSlug === 'basic' && '🛡️ '}
                  {plan.name}
                </Text>
                
                <View style={styles.priceContainer}>
                  {plan.price === 0 ? (
                    <Text style={[styles.price, { color: colors.success }]}>Ücretsiz</Text>
                  ) : (
                    <>
                      <Text style={[styles.price, { color: colors.primary }]}>₺{plan.price}</Text>
                      <Text style={[styles.period, { color: colors.textSecondary }]}>/{plan.period}</Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>{getFeatureIcon(feature)}</Text>
                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.planActions}>
                {isCurrentPlan(planSlug) ? (
                  <Button
                    title="Mevcut Planınız"
                    variant="outline"
                    disabled
                    fullWidth
                    onPress={() => {}}
                  />
                ) : canUpgrade(planSlug) ? (
                  <Button
                    title={upgrading === planSlug ? 'Yükseltiliyor...' : 'Planı Seç'}
                    onPress={() => handleUpgrade(planSlug)}
                    loading={upgrading === planSlug}
                    fullWidth
                  />
                ) : (
                  <Button
                    title="Mevcut Planınızdan Düşük"
                    variant="outline"
                    disabled
                    fullWidth
                    onPress={() => {}}
                  />
                )}
              </View>
            </Card>
          ))}
        </View>

        <Card style={styles.campaignCard}>
          <Text style={[styles.campaignTitle, { color: colors.primary }]}>
            🎁 Özel Kampanyalar
          </Text>
          <View style={styles.campaignList}>
            <Text style={[styles.campaignItem, { color: colors.textSecondary }]}>• İlk ay %50 indirim</Text>
            <Text style={[styles.campaignItem, { color: colors.textSecondary }]}>• 3 ay premium al, 1 ay hediye</Text>
            <Text style={[styles.campaignItem, { color: colors.textSecondary }]}>• Yıllık üyelikte %20 indirim</Text>
            <Text style={[styles.campaignItem, { color: colors.textSecondary }]}>• İlk teklifin öne çıkarılması ücretsiz</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  usageCard: {
    marginBottom: 20,
    padding: 16,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageItem: {
    width: '48%',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 12,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    marginBottom: 16,
    padding: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 14,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  planActions: {
    marginTop: 'auto',
  },
  campaignCard: {
    padding: 16,
    marginBottom: 20,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  campaignList: {
    gap: 4,
  },
  campaignItem: {
    fontSize: 14,
  },
});

export default PremiumScreen; 