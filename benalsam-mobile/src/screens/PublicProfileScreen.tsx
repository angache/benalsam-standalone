import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { Avatar, ListingCard } from '../components';
import { useUserProfile } from '../hooks/queries/useAuth';
import { usePublicTrustScore } from '../hooks/queries/useTrustScore';
import { useUserListings } from '../hooks/queries/useListings';
import { getTrustLevelColor, getTrustLevelDescription } from '../services/trustScoreService';
import { formatDate } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  MessageCircle, 
  Star, 
  Award,
  ChevronRight,
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Globe, 
  Youtube,
  Calendar,
  Package,
  Users,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react-native';

const PublicProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const userId = route.params?.userId;

  const { data: profile, isLoading: loadingProfile } = useUserProfile(userId);
  const { data: trustScoreData, isLoading: loadingTrustScore } = usePublicTrustScore(userId);

  const { data: userListings = [], isLoading: loadingListings } = useUserListings(userId);

  if (!userId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Kullanıcı ID'si bulunamadı
        </Text>
      </SafeAreaView>
    );
  }

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    } else if (profile?.first_name) {
      return profile.first_name;
    } else if (profile?.name) {
      return profile.name;
    } else if (profile?.username) {
      return profile.username;
    } else {
      return 'Kullanıcı';
    }
  };

  const hasSocialLinks = profile?.social_links && 
    typeof profile.social_links === 'object' && 
    Object.values(profile.social_links).some((link: any) => link && typeof link === 'string' && link.trim() !== '');

  const getAccountAge = () => {
    if (!profile?.created_at) return null;
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays}G`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}A`;
    return `${Math.floor(diffDays / 365)}Y`;
  };



  const getVerificationStatus = () => {
    const verifications = [];
    if (profile?.email_verified) verifications.push('E-posta');
    if (profile?.phone_verified) verifications.push('Telefon');
    return verifications;
  };

  const renderListingItem = ({ item }: { item: any }) => (
    <View style={styles.listingItem}>
      <ListingCard 
        listing={item} 
        screenName="PublicProfileScreen"
        sectionName="User Listings"
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profil
          </Text>
        </View>

        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => {
            // Mesajlaşma ekranına git
            navigation.navigate('Conversation', { 
              conversationId: null, 
              otherUserId: userId,
              listingId: null 
            });
          }}
          activeOpacity={0.7}
        >
          <MessageCircle size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* DEBUG kodları kaldırıldı */}
        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Profil yükleniyor...
            </Text>
          </View>
        ) : profile ? (
          <>
            {/* Profil Kartı */}
            <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
              <View style={styles.profileHeader}>
                <Avatar 
                  size="xl" 
                  name={getDisplayName()} 
                  source={profile?.avatar_url}
                />
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {getDisplayName()}
                  </Text>
                  {profile?.bio ? (
                    <Text style={[styles.profileBio, { color: colors.textSecondary }]}>
                      {profile.bio}
                    </Text>
                  ) : null}
                  <View style={styles.locationContainer}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                      {profile?.province && profile?.district ? `${profile.province}, ${profile.district}` : 'Konum belirtilmemiş'}
                    </Text>
                  </View>
                  
                  {/* Hesap Bilgileri */}
                  <View style={styles.accountInfoContainer}>
                    <View style={styles.accountInfoRow}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={[styles.accountInfoText, { color: colors.textSecondary }]}>
                        {getAccountAge() ? `${getAccountAge()} üye` : 'Yeni üye'}
                      </Text>
                    </View>
                    {profile?.created_at && (
                      <View style={styles.accountInfoRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.accountInfoText, { color: colors.textSecondary }]}>
                          {formatDate(profile.created_at)}'den beri
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Doğrulama Durumu */}
                  {getVerificationStatus().length > 0 && (
                    <View style={styles.verificationContainer}>
                      <CheckCircle size={14} color="#10b981" />
                      <Text style={[styles.verificationText, { color: '#10b981' }]}>
                        {getVerificationStatus().join(', ')} doğrulandı
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Trust Score Badge */}
              <View style={[styles.trustScoreContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {loadingTrustScore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : trustScoreData?.totalScore !== undefined && trustScoreData?.level ? (
                  <View style={styles.trustScoreContent}>
                    <Text style={[styles.trustScoreLabel, { color: colors.textSecondary }]}>
                      Güven Puanı
                    </Text>
                    <View style={styles.trustScoreRow}>
                      <View style={[
                        styles.trustLevelBadge,
                        {
                          backgroundColor: getTrustLevelColor(trustScoreData.level) + '20',
                          borderColor: getTrustLevelColor(trustScoreData.level),
                        }
                      ]}>
                        <Award size={16} color={getTrustLevelColor(trustScoreData.level)} />
                        <Text style={[
                          styles.trustLevelText,
                          { color: getTrustLevelColor(trustScoreData.level) }
                        ]}>
                          {trustScoreData.level.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.trustScoreValue, { color: colors.text }]}>
                        {trustScoreData.totalScore} / 100
                      </Text>
                    </View>
                    <Text style={[styles.trustScoreDescription, { color: colors.textSecondary }]}>
                      {getTrustLevelDescription(trustScoreData.level)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.trustScoreDetailsButton}
                      onPress={() => {
                        navigation.navigate('TrustScore', { userId });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.trustScoreDetailsText, { color: colors.primary }]}>
                        Detayları Gör
                      </Text>
                      <ChevronRight size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.noTrustScoreText, { color: colors.textSecondary }]}>
                    Güven puanı hesaplanamadı
                  </Text>
                )}
              </View>

              {/* Social Links */}
              {hasSocialLinks && (
                <View style={styles.socialLinksContainer}>
                  <Text style={[styles.socialLinksTitle, { color: colors.textSecondary }]}>
                    Sosyal Medya
                  </Text>
                  <View style={styles.socialLinksRow}>
                    {profile.social_links.instagram && (
                      <TouchableOpacity style={styles.socialLinkButton}>
                        <Instagram size={24} color="#E4405F" />
                      </TouchableOpacity>
                    )}
                    {profile.social_links.twitter && (
                      <TouchableOpacity style={styles.socialLinkButton}>
                        <Twitter size={24} color="#1DA1F2" />
                      </TouchableOpacity>
                    )}
                    {profile.social_links.linkedin && (
                      <TouchableOpacity style={styles.socialLinkButton}>
                        <Linkedin size={24} color="#0077B5" />
                      </TouchableOpacity>
                    )}
                    {profile.social_links.facebook && (
                      <TouchableOpacity style={styles.socialLinkButton}>
                        <Facebook size={24} color="#1877F2" />
                      </TouchableOpacity>
                    )}
                    {profile.social_links.website && (
                      <TouchableOpacity style={styles.socialLinkButton}>
                        <Globe size={24} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {profile.social_links.youtube && (
                      <TouchableOpacity style={styles.socialLinkButton}>
                        <Youtube size={24} color="#FF0000" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* İstatistikler */}
            <View style={styles.statsContainer}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>
                İstatistikler
              </Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                  <Star size={32} color="#fbbf24" />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {trustScoreData?.breakdown?.reviews || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Değerlendirme</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                  <Award size={32} color="#8b5cf6" />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {trustScoreData?.breakdown?.completed_trades || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Başarılı İşlem</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                  <Package size={32} color="#3b82f6" />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {trustScoreData?.breakdown?.listings_count || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aktif İlan</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                  <Users size={32} color="#10b981" />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {getAccountAge() || 'Yeni'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Üyelik</Text>
                </View>
              </View>
            </View>

            {/* Aktif İlanlar Bölümü */}
            <View style={styles.listingsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Aktif İlanlar
                </Text>
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => {
                    navigation.navigate('UserListings', { userId });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    Tümünü Gör
                  </Text>
                  <ExternalLink size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {loadingListings ? (
                <View style={styles.listingsLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.listingsLoadingText, { color: colors.textSecondary }]}>
                    İlanlar yükleniyor...
                  </Text>
                </View>
              ) : userListings.length > 0 ? (
                <FlatList
                  data={userListings.slice(0, 3)} // Sadece ilk 3 ilanı göster
                  renderItem={renderListingItem}
                  keyExtractor={(item) => item.id}
                  horizontal={false}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listingsList}
                />
              ) : (
                <Text style={[styles.noListingsText, { color: colors.textSecondary }]}>
                  Bu kullanıcının aktif ilanı bulunmuyor
                </Text>
              )}
            </View>

            {/* Değerlendirmeler Bölümü */}
            <View style={styles.reviewsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Değerlendirmeler
                </Text>
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => {
                    navigation.navigate('UserReviews', { userId });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    Tümünü Gör
                  </Text>
                  <ExternalLink size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>
                Bu kullanıcı için henüz değerlendirme bulunmuyor
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              Profil bulunamadı
            </Text>
          </View>
        )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messageButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  accountInfoContainer: {
    marginBottom: 8,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  accountInfoText: {
    fontSize: 12,
    marginLeft: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  trustScoreContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  trustScoreContent: {
    alignItems: 'center',
  },
  trustScoreLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  trustScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  trustLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  trustLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  trustScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  trustScoreDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  trustScoreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustScoreDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  noTrustScoreText: {
    fontSize: 14,
    textAlign: 'center',
  },
  socialLinksContainer: {
    marginTop: 16,
  },
  socialLinksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  socialLinksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialLinkButton: {
    padding: 8,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  listingsContainer: {
    marginBottom: 20,
  },
  reviewsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listingsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  listingsLoadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  listingsList: {
    gap: 12,
  },
  listingItem: {
    marginBottom: 12,
  },
  noListingsText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  noReviewsText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default PublicProfileScreen; 