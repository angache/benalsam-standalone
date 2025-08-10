import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores';
import { useThemeColors } from '../stores';
import { useNavigation } from '@react-navigation/native';
import { Avatar, Button, Card } from '../components';
import { useUserReviews } from '../hooks/queries/useReviews';
import { useUpdateProfile, useMyProfile } from '../hooks/queries/useAuth';
import { fetchMyListings } from '../services/listingService/fetchers';
import { useFavoriteListings } from '../hooks/queries/useFavorites';
import { useConversations } from '../hooks/queries/useConversations';
import { useCurrentUserTrustScore } from '../hooks/queries/useTrustScore';
import { getTrustLevelColor, getTrustLevelDescription } from '../services/trustScoreService';
import ListingCard from '../components/ListingCard';
import { ArrowLeft, ChevronRight, List, Heart, FileText, MessageCircle, Settings, MapPin, Users, Award, Eye, ShoppingBag, Upload, Camera, Image as IconImage, Instagram, Twitter, Linkedin, Facebook, Globe, Youtube } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase  } from '../services/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

const ProfileAvatar = ({ profile }: { profile: any }) => {
  const colors = useThemeColors();
  if (!profile) return null;

  // İsim soyisim oluştur
  const getDisplayName = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    } else if (profile.first_name) {
      return profile.first_name;
    } else if (profile.name) {
      return profile.name;
    } else if (profile.username) {
      return profile.username;
    } else {
      return 'Kullanıcı';
    }
  };

  // Social links'i kontrol et
  const hasSocialLinks = profile.social_links && 
    typeof profile.social_links === 'object' && 
    Object.values(profile.social_links).some((link: any) => link && typeof link === 'string' && link.trim() !== '');

  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <Avatar 
        size="xl" 
        name={getDisplayName()} 
        source={profile?.avatar_url}
      />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 16 }}>{getDisplayName()}</Text>
      {profile?.bio ? (
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 6, textAlign: 'center' }}>{profile.bio}</Text>
      ) : null}
      
      {/* Social Links */}
      {hasSocialLinks && (
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
          {profile.social_links.instagram && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Instagram size={24} color="#E4405F" />
            </TouchableOpacity>
          )}
          {profile.social_links.twitter && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Twitter size={24} color="#1DA1F2" />
            </TouchableOpacity>
          )}
          {profile.social_links.linkedin && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Linkedin size={24} color="#0077B5" />
            </TouchableOpacity>
          )}
          {profile.social_links.facebook && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Facebook size={24} color="#1877F2" />
            </TouchableOpacity>
          )}
          {profile.social_links.website && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Globe size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          {profile.social_links.youtube && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Youtube size={24} color="#FF0000" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const colors = useThemeColors();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'ilanlar' | 'yorumlar'>('ilanlar');
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // React Query hooks
  const { data: profile, isLoading: loadingProfile } = useMyProfile();
  const { data: reviews = [], isLoading: loadingReviews } = useUserReviews(user?.id);
  const { data: favorites = [], isLoading: loadingFavorites } = useFavoriteListings();
  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const { data: trustScoreData, isLoading: loadingTrustScore } = useCurrentUserTrustScore();

  // Debug log'ları
  console.log('ProfileScreen - loadingTrustScore:', loadingTrustScore);
  console.log('ProfileScreen - trustScoreData:', trustScoreData);
  console.log('ProfileScreen - user?.id:', user?.id);

  useEffect(() => {
    if (user?.id) {
      setLoadingListings(true);
      fetchMyListings(user.id)
        .then((response) => {
          if (response.error) {
            console.error('Error fetching listings:', response.error);
            setListings([]);
          } else {
            setListings(response.data || []);
          }
        })
        .catch((error) => {
          console.error('Error fetching listings:', error);
          setListings([]);
        })
        .finally(() => setLoadingListings(false));
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen);
  };

  const handleImageChange = async (images: any[]) => {
    if (!user) return;
    
    setUploadingPhoto(true);
    try {
      const image = images[0];
      if (!image) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
        await updateProfileMutation.mutateAsync({ avatar_url: null });
        return;
      }

      // Dosya adını kullanıcı ID'si ile oluştur
      const fileExt = image.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Base64'ü buffer'a çevir
      const base64 = image.uri.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');

      // Önce storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '0', // Cache'i devre dışı bırak
        });

      if (uploadError) throw uploadError;

      // Dosyanın herkese açık URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // CDN propagation için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Profil bilgisini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Cache'i güncelle ve profil verisini yeniden çek
      await updateProfileMutation.mutateAsync({ avatar_url: publicUrl });

      // Profil verisini zorla yenile
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile', user.id] });
      await queryClient.refetchQueries({ queryKey: ['auth', 'profile', user.id] });

    } catch (error: any) {
      Alert.alert('Hata', 'Profil fotoğrafı yüklenirken bir hata oluştu: ' + error.message);
      console.error('Upload error:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    profileInfo: {
      alignItems: 'center',
      padding: 20,
      marginBottom: 20,
    },
    username: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 5,
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    menuSection: {
      marginBottom: 20,
      marginTop: 20,
    },
    menuItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuText: {
      fontSize: 16,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      {/* Geri Butonu */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8 }}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Profil</Text>
      </View>
      <ScrollView style={styles.content}>
        {/* Profil Kartı */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, marginBottom: 24, alignItems: 'center', shadowColor: colors.black, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
          <ProfileAvatar 
            profile={profile}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={{ marginLeft: 4, color: colors.textSecondary }}>
              {profile?.province && profile?.district ? `${profile.province}, ${profile.district}` : 'Konum belirtilmemiş'}
            </Text>
          </View>
          {/* Trust Score Badge */}
          <View style={{ alignItems: 'center', marginTop: 18, padding: 12, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            {loadingTrustScore ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : trustScoreData?.data?.level ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>Güven Puanı</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    backgroundColor: getTrustLevelColor(trustScoreData.data.level) + '20',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderWidth: 2,
                    borderColor: getTrustLevelColor(trustScoreData.data.level),
                  }}>
                    <Text style={{
                      color: getTrustLevelColor(trustScoreData.data.level),
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}>{trustScoreData.data.level.toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{trustScoreData.data.totalScore} / 100</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>{getTrustLevelDescription(trustScoreData.data.level)}</Text>
                <TouchableOpacity 
                  style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  onPress={() => {
                    navigation.navigate('TrustScore', { userId: user?.id });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Detayları Gör
                  </Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* İstatistikler */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <List size={32} color="#f43f5e" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>{listings.length}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>İlan</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <Heart size={32} color="#ec4899" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>
              {loadingFavorites ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                favorites.length
              )}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Favori</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <FileText size={32} color="#8b5cf6" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>{reviews.length}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Yorum</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <MessageCircle size={32} color="#06b6d4" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>
              {loadingConversations ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                conversations.length
              )}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Mesajlaşma</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <Users size={32} color="#a78bfa" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>0</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Takipçi</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <Users size={32} color="#2dd4bf" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>0</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Takip Edilen</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <Award size={32} color="#fde047" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>0</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Puan</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', paddingVertical: 24, marginBottom: 12 }}>
            <Eye size={32} color="#4ade80" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 }}>0</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 2 }}>Görüntülenme</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen; 