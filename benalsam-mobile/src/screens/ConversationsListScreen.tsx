import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MessageCircle, Search, Clock } from 'lucide-react-native';
import { useAuthStore } from '../stores';
import { useThemeColors } from '../stores';
import { Header, SearchBar, LoadingSpinner, Avatar, Card } from '../components';

// 🚀 React Query Hooks - YENİ!
import { useConversations, useUnreadMessageCounts } from '../hooks/queries/useConversations';

const ConversationsListScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🚀 React Query Hooks - YENİ VE GÜÇLÜ!
  const { 
    data: conversations = [], 
    isLoading: conversationsLoading, 
    error: conversationsError,
    refetch: refetchConversations 
  } = useConversations();
  
  const { 
    data: unreadCounts = {}, 
    isLoading: unreadLoading,
    refetch: refetchUnreadCounts 
  } = useUnreadMessageCounts();
  
  // Loading state - React Query'den geliyor artık! 🎉
  const loading = conversationsLoading || unreadLoading;
  
  // Refresh when screen focuses - React Query'nin power'ını kullanıyor!
  useFocusEffect(
    React.useCallback(() => {
      refetchConversations();
      refetchUnreadCounts();
    }, [refetchConversations, refetchUnreadCounts])
  );
  
  // 🔄 Pull-to-refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchConversations(),
        refetchUnreadCounts()
      ]);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.user1_id === user?.id ? conv.user2 : conv.user1;
    const listingTitle = conv.listing?.title || '';
    const lastMessageContent = conv.last_message?.content || '';
    return (
      ((otherUser as any)?.name || otherUser?.email)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '20' }]}>
        <MessageCircle size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Henüz Mesajınız Yok
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        İlan sahipleriyle iletişime geçmek için{'\n'}ilanları ziyaret edin
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => {
    const otherUser = item.user1_id === user?.id ? item.user2 : item.user1;
    const lastMessage = item.last_message;
    const unreadCount = unreadCounts[item.id] || 0;
    
    return (
      <Card style={styles.conversationCard}>
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
        >
          <View style={styles.conversationLeft}>
            <Avatar 
              source={otherUser?.avatar_url}
              name={(otherUser as any)?.name || otherUser?.email || 'Unknown'} 
              size="lg"
              style={styles.avatar}
            />
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.unreadText, { color: colors.background }]}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.conversationMiddle}>
            <View style={styles.conversationHeader}>
              <Text style={[
                styles.userName, 
                { 
                  color: unreadCount > 0 ? colors.primary : colors.text,
                  fontWeight: unreadCount > 0 ? '600' : '500'
                }
              ]} numberOfLines={1}>
                {(otherUser as any)?.name || otherUser?.email || 'Bilinmeyen Kullanıcı'}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {lastMessage?.created_at ? formatTime(lastMessage.created_at) : ''}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.listingTitle, { color: colors.textSecondary }]} numberOfLines={1}>
              📦 {item.listing?.title || 'İlan bilgisi yok'}
            </Text>
            
            <Text style={[
              styles.lastMessage, 
              { 
                color: unreadCount > 0 ? colors.text : colors.textSecondary,
                fontWeight: unreadCount > 0 ? '500' : 'normal'
              }
            ]} numberOfLines={2}>
              {lastMessage ? `${lastMessage.sender_id === user?.id ? 'Siz: ' : ''}${lastMessage.content}` : 'Sohbeti başlat...'}
            </Text>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Giriş yapmanız gerekiyor.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Konuşmalarda ara..."
            style={styles.searchBar}
          />
        </View>

        {loading ? (
          <LoadingSpinner text="Konuşmalar yükleniyor..." />
        ) : filteredConversations.length > 0 ? (
          <FlatList
            data={filteredConversations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                title="Yenileniyor..."
              />
            }
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
  },
  searchBar: {
    borderRadius: 8,
    padding: 16,
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationCard: {
    marginBottom: 12,
    padding: 16,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  conversationLeft: {
    position: 'relative',
  },
  conversationMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  listingTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ConversationsListScreen; 