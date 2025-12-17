
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { privateMessagingService, MessageWithSender } from '@/app/services/privateMessagingService';
import { supabase } from '@/app/integrations/supabase/client';

export default function ChatScreen() {
  const { conversationId, otherUserId, otherUserName } = useLocalSearchParams<{
    conversationId?: string;
    otherUserId?: string;
    otherUserName?: string;
  }>();
  
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversationId);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!activeConversationId) return;

    try {
      const msgs = await privateMessagingService.getConversationMessages(activeConversationId);
      setMessages(msgs);
      
      if (user) {
        await privateMessagingService.markMessagesAsRead(activeConversationId, user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [activeConversationId, user]);

  const initializeConversation = useCallback(async () => {
    if (!user || !otherUserId || activeConversationId) return;

    try {
      const conversation = await privateMessagingService.getOrCreateConversation(user.id, otherUserId);
      if (conversation) {
        setActiveConversationId(conversation.id);
      }

      // Fetch other user's avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', otherUserId)
        .single();

      if (profile) {
        setOtherUserAvatar(profile.avatar_url);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  }, [user, otherUserId, activeConversationId]);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!activeConversationId && otherUserId) {
      initializeConversation();
    } else if (activeConversationId) {
      fetchMessages();
    }
  }, [user, activeConversationId, otherUserId]);

  useEffect(() => {
    if (!activeConversationId) return;

    const channel = privateMessagingService.subscribeToConversation(activeConversationId, (newMessage) => {
      // Fetch the full message with sender details
      fetchMessages();
      
      if (user && newMessage.sender_id !== user.id) {
        privateMessagingService.markMessagesAsRead(activeConversationId, user.id);
      }
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, user, fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !activeConversationId || sending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const message = await privateMessagingService.sendMessage(activeConversationId, user.id, messageContent);
      
      if (message) {
        // Refresh messages to get the full message with sender details
        await fetchMessages();
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageWithSender }) => {
    const isMyMessage = item.sender_id === user?.id;
    const isRead = item.read_at !== null;

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && item.sender.avatar_url && (
          <Image
            source={{ uri: item.sender.avatar_url }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            { backgroundColor: isMyMessage ? colors.brandPrimary : colors.card },
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text style={[styles.messageText, { color: isMyMessage ? '#FFFFFF' : colors.text }]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.placeholder }]}>
              {formatTime(item.created_at)}
            </Text>
            {isMyMessage && (
              <Text style={styles.messageStatus}>
                {isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          {otherUserAvatar && (
            <Image
              source={{ uri: otherUserAvatar }}
              style={styles.headerAvatar}
            />
          )}
          <Text style={styles.headerTitle}>
            {otherUserName || 'Chat'}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bubble.left.and.bubble.right"
              android_material_icon_name="chat"
              size={64}
              color={colors.placeholder}
            />
            <Text style={styles.emptyText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.brandPrimary : colors.border }]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol
              ios_icon_name="paperplane.fill"
              android_material_icon_name="send"
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    color: colors.placeholder,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '400',
  },
  messageStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: colors.background,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
