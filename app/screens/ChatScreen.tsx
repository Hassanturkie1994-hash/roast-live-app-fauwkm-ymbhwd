
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
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { colors } = useTheme();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversationId);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [isRequester, setIsRequester] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [canAccess, setCanAccess] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

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

  const checkAccess = useCallback(async () => {
    if (!activeConversationId || !user) return;

    try {
      const access = await privateMessagingService.checkConversationAccess(activeConversationId, user.id);
      setCanAccess(access.canAccess);
      setIsPendingRequest(access.isPending);
      setIsRequester(access.isRequester);
    } catch (error) {
      console.error('Error checking conversation access:', error);
    }
  }, [activeConversationId, user]);

  const initializeConversation = useCallback(async () => {
    if (!user || !otherUserId || activeConversationId) return;

    try {
      const result = await privateMessagingService.getOrCreateConversation(user.id, otherUserId);
      if (result.conversation) {
        setActiveConversationId(result.conversation.id);
        setIsPendingRequest(result.needsRequest);
        setIsRequester(result.needsRequest);
        setRequestId(result.requestId);
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
      checkAccess();
      fetchMessages();
    }
  }, [user, activeConversationId, otherUserId]);

  // REALTIME: Subscribe to new messages
  useEffect(() => {
    if (!activeConversationId || !user) return;

    // Check if already subscribed
    if (channelRef.current?.state === 'subscribed') {
      console.log('Already subscribed to conversation');
      return;
    }

    console.log('🔌 Setting up realtime subscription for conversation:', activeConversationId);

    const channel = supabase
      .channel(`conversation:${activeConversationId}:messages`, {
        config: { private: true }
      })
      .on('broadcast', { event: 'message_created' }, (payload) => {
        console.log('💬 New message received:', payload);
        const newMessage = payload.payload as any;
        
        // Fetch the full message with sender details
        fetchMessages();
        
        // Mark as read if not from current user
        if (newMessage.sender_id !== user.id) {
          privateMessagingService.markMessagesAsRead(activeConversationId, user.id);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      })
      .subscribe(async (status) => {
        console.log('📡 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          await supabase.realtime.setAuth();
          console.log('✅ Realtime messaging active');
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [activeConversationId, user, fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !activeConversationId || sending) return;

    // Check if this is a pending request and user is not the requester
    if (isPendingRequest && !isRequester) {
      Alert.alert('Message Request', 'You need to accept this message request before you can reply.');
      return;
    }

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const message = await privateMessagingService.sendMessage(activeConversationId, user.id, messageContent);
      
      if (message) {
        // Message will be received via realtime subscription
        // But we can also add it optimistically
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId) return;

    try {
      const success = await privateMessagingService.acceptMessageRequest(requestId);
      if (success) {
        setIsPendingRequest(false);
        setCanAccess(true);
        Alert.alert('Success', 'Message request accepted!');
      } else {
        Alert.alert('Error', 'Failed to accept message request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept message request');
    }
  };

  const handleRejectRequest = async () => {
    if (!requestId) return;

    Alert.alert(
      'Reject Message Request',
      'Are you sure you want to reject this message request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await privateMessagingService.rejectMessageRequest(requestId);
              if (success) {
                router.back();
              } else {
                Alert.alert('Error', 'Failed to reject message request');
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject message request');
            }
          },
        },
      ]
    );
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
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {otherUserName || 'Chat'}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Message Request Banner */}
      {isPendingRequest && !isRequester && (
        <View style={[styles.requestBanner, { backgroundColor: colors.brandPrimary }]}>
          <View style={styles.requestBannerContent}>
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="mail"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.requestBannerText}>Message Request</Text>
          </View>
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.requestButton, styles.rejectButton]}
              onPress={handleRejectRequest}
            >
              <Text style={styles.requestButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestButton, styles.acceptButton]}
              onPress={handleAcceptRequest}
            >
              <Text style={styles.requestButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isPendingRequest && isRequester && (
        <View style={[styles.infoBanner, { backgroundColor: colors.backgroundAlt }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
            Message request sent. Waiting for {otherUserName} to accept.
          </Text>
        </View>
      )}

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
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder={isPendingRequest && !isRequester ? 'Accept request to reply...' : 'Type a message...'}
          placeholderTextColor={colors.placeholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!isPendingRequest || isRequester}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.brandPrimary : colors.border }]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending || (isPendingRequest && !isRequester)}
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
    borderBottomWidth: 1,
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
  },
  headerRight: {
    width: 40,
  },
  requestBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requestBannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
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
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
