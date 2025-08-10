import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { ArrowLeft, UserX } from 'lucide-react-native';
import { Avatar, Button } from '../components';
import { useBlockedUsers, useUnblockUser } from '../hooks/queries/useBlockedUsers';

interface BlockedUserData {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string;
}

interface BlockedUser {
  blocked_user_id: string;
  blocked_at: string;
  blocked_user: BlockedUserData[];
}

const BlockedUsersScreen = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUserMutation = useUnblockUser();

  const handleUnblock = async (blockedUserId: string) => {
    try {
      await unblockUserMutation.mutateAsync(blockedUserId);
      Alert.alert('Başarılı', 'Kullanıcının engellemesi kaldırıldı.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Hata', 'Kullanıcının engellemesi kaldırılırken bir hata oluştu.');
    }
  };

  const renderBlockedUser = (user: BlockedUser) => {
    const blockedUser = user.blocked_user[0]; // Get the first user from the array
    if (!blockedUser) return null;

    return (
      <View key={blockedUser.id} style={[styles.userCard, { backgroundColor: colors.surface }]}>
        <View style={styles.userInfo}>
          <Avatar
            source={blockedUser.avatar_url}
            name={blockedUser.name || blockedUser.username}
            size="lg"
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {blockedUser.name || blockedUser.username}
            </Text>
            <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
              @{blockedUser.username}
            </Text>
            <Text style={[styles.blockDate, { color: colors.textSecondary }]}>
              {new Date(user.blocked_at).toLocaleDateString('tr-TR')} tarihinde engellendi
            </Text>
          </View>
        </View>
        <Button
          title={unblockUserMutation.isPending ? "..." : "Engeli Kaldır"}
          onPress={() => handleUnblock(blockedUser.id)}
          disabled={unblockUserMutation.isPending}
          variant="secondary"
          style={styles.unblockButton}
        />
      </View>
    );
  };

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
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Engellenen Kullanıcılar
        </Text>

        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !blockedUsers || blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <UserX size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Engellenen Kullanıcı Yok
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Henüz hiçbir kullanıcıyı engellememiş görünüyorsunuz.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {blockedUsers.map(renderBlockedUser)}
        </ScrollView>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  blockDate: {
    fontSize: 12,
    marginTop: 4,
  },
  unblockButton: {
    marginTop: 8,
  },
});

export default BlockedUsersScreen; 