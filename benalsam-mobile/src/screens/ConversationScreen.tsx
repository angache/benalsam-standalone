import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuthStore, useThemeColors } from '../stores';
import { useConversationDetails, useMessages, useConversationActions } from '../hooks/queries/useConversations';
import { Avatar } from '../components/Avatar';
import analyticsService from '../services/analyticsService';

const ConversationScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const conversationId = route.params?.conversationId;

  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, isLoading: loadingConversation } = useConversationDetails(conversationId);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(conversationId);
  const { sendMessage, markAsRead, isSending } = useConversationActions();

  // Karşı kullanıcıyı belirle
  const otherUser = user?.id === conversation?.user1?.id ? conversation?.user2 : conversation?.user1;

  useEffect(() => {
    if (!user || !conversationId) return;
    markAsRead(conversationId);
  }, [conversationId, user?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || isSending) return;
    const tempMessage = newMessage.trim();
    setNewMessage('');
    try {
      await sendMessage({
        conversationId,
        content: tempMessage,
        messageType: 'text'
      });
      
      // Track message sent event
      analyticsService.trackEvent('MESSAGE_SENT', {
        conversation_id: conversationId,
        message_type: 'text',
        message_length: tempMessage.length,
        recipient_id: otherUser?.id,
        recipient_name: otherUser?.name || otherUser?.username
      });
    } catch (e) {
      setNewMessage(tempMessage); // Geri yükle
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMyMessage = item.sender_id === user?.id;
    
    return (
      <View style={[
        styles.messageRow,
        { justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }
      ]}>
        {!isMyMessage && (
          <Avatar
            source={item.sender?.avatar_url}
            name={item.sender?.name}
            size="sm"
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageContainer, 
          {
            backgroundColor: isMyMessage ? colors.primary : '#E5E7EB',
            marginLeft: isMyMessage ? 8 : 8,
            marginRight: isMyMessage ? 8 : 8,
            borderTopLeftRadius: !isMyMessage ? 4 : 16,
            borderTopRightRadius: isMyMessage ? 4 : 16,
          }
        ]}>
          <Text style={{ 
            color: isMyMessage ? '#FFFFFF' : '#1F2937',
            fontSize: 16,
            lineHeight: 20
          }}>
            {item.content}
          </Text>
          <Text style={[
            styles.time, 
            { color: isMyMessage ? '#FFFFFF' : '#6B7280', opacity: 0.8 }
          ]}>
            {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isMyMessage && (
          <Avatar
            source={user?.avatar_url}
            name={user?.username || user?.email}
            size="sm"
            style={styles.messageAvatar}
          />
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text }}>Giriş yapmanız gerekiyor.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerUserInfo}>
              <Avatar
                source={otherUser?.avatar_url}
                name={otherUser?.name}
                size="md"
                style={{ marginRight: 12 }}
              />
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {otherUser?.name || 'Kullanıcı'}
                </Text>
                {conversation?.listing && (
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {conversation.listing.title}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
        {(loadingConversation || loadingMessages) ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id?.toString()}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface }}>
          <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Mesaj yaz..."
              placeholderTextColor={colors.textSecondary}
              editable={!isSending}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: newMessage.trim() ? colors.primary : colors.border,
                  opacity: isSending ? 0.6 : 1 
                }
              ]} 
              onPress={handleSend} 
              disabled={isSending || !newMessage.trim()}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size={16} color="#FFFFFF" />
              ) : (
                <Send size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  loading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  messagesContainer: { 
    padding: 16, 
    paddingBottom: 32 
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageContainer: { 
    padding: 12, 
    borderRadius: 16, 
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  time: { 
    fontSize: 11, 
    marginTop: 4, 
    alignSelf: 'flex-end',
    fontWeight: '500'
  },
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: 16, 
    borderTopWidth: 1,
    gap: 12,
  },
  input: { 
    flex: 1, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderWidth: 1,
    maxHeight: 100,
    minHeight: 44,
    fontSize: 16,
  },
  sendButton: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ConversationScreen; 