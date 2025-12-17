
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedVIPClubService, VIPChatMessage } from '@/app/services/unifiedVIPClubService';
import UnifiedVIPClubBadge from '@/components/UnifiedVIPClubBadge';

export default function VIPClubChatScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ clubId: string; clubName: string; creatorId: string }>();
  const [messages, setMessages] = useState<VIPChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const loadMessages = useCallback(async () => {
    if (!params.clubId) return;

    try {
      const msgs = await unifiedVIPClubService.getVIPClubChatMessages(params.clubId);
      if (isMountedRef.current) {
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Error loading VIP club chat messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [params.clubId]);

  const subscribeToChat = useCallback(() => {
    if (!params.clubId) return;

    console.log('🔌 Subscribing to VIP club chat:', params.clubId);

    const channel = unifiedVIPClubService.subscribeToVIPClubChat(
      params.clubId,
      (message) => {
        if (isMountedRef.current) {
          setMessages((prev) => [...prev, message]);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );

    channelRef.current = channel;
  }, [params.clubId]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    loadMessages();
    subscribeToChat();

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        console.log('🔌 Unsubscribing from VIP club chat');
        import('@/app/integrations/supabase/client').then(({ supabase }) => {
          supabase.removeChannel(channelRef.current);
        });
        channelRef.current = null;
      }
    };
  }, [user, loadMessages, subscribeToChat]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !params.clubId || isSending) return;

    const trimmedMessage = messageText.trim();
    setIsSending(true);

    try {
      const result = await unifiedVIPClubService.sendVIPClubChatMessage(
        params.clubId,
        user.id,
        trimmedMessage
      );

      if (result.success && result.data) {
        // Broadcast to all members
        await unifiedVIPClubService.broadcastVIPClubChatMessage(params.clubId, result.data);
        
        if (isMountedRef.current) {
          setMessageText('');
        }
      }
    } catch (error) {
      console.error('Error sending VIP club chat message:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSending(false);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <View style={commonStyles.container}>
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
          <IconSymbol
            ios_icon_name="crown.fill"
            android_material_icon_name="workspace_premium"
            size={20}
            color="#FFD700"
          />
          <Text style={styles.headerTitle}>{params.clubName || 'VIP Club'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text style={styles.loadingText}>Loading VIP chat...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="bubble.left.and.bubble.right"
                    android_material_icon_name="chat"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start the conversation with your VIP members!
                  </Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isOwnMessage = msg.user_id === user?.id;
                  const isCreator = msg.user_id === params.creatorId;

                  return (
                    <View
                      key={`msg-${msg.id}-${index}`}
                      style={[
                        styles.messageRow,
                        isOwnMessage && styles.messageRowOwn,
                      ]}
                    >
                      {!isOwnMessage && (
                        <View style={styles.avatarContainer}>
                          {msg.profiles?.avatar_url ? (
                            <Image
                              source={{ uri: msg.profiles.avatar_url }}
                              style={styles.avatar}
                            />
                          ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                              <IconSymbol
                                ios_icon_name="person.fill"
                                android_material_icon_name="person"
                                size={16}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                        </View>
                      )}

                      <View
                        style={[
                          styles.messageBubble,
                          isOwnMessage && styles.messageBubbleOwn,
                        ]}
                      >
                        {!isOwnMessage && (
                          <View style={styles.messageHeader}>
                            <Text style={styles.senderName}>
                              {msg.profiles?.display_name || msg.profiles?.username || 'Unknown'}
                            </Text>
                            {isCreator && (
                              <View style={styles.creatorBadge}>
                                <IconSymbol
                                  ios_icon_name="crown.fill"
                                  android_material_icon_name="workspace_premium"
                                  size={10}
                                  color="#FFD700"
                                />
                                <Text style={styles.creatorBadgeText}>Creator</Text>
                              </View>
                            )}
                            {!isCreator && params.creatorId && (
                              <UnifiedVIPClubBadge
                                creatorId={params.creatorId}
                                userId={msg.user_id}
                                size="small"
                                showLevel={true}
                              />
                            )}
                          </View>
                        )}
                        <Text
                          style={[
                            styles.messageText,
                            isOwnMessage && styles.messageTextOwn,
                          ]}
                        >
                          {msg.message}
                        </Text>
                        <Text
                          style={[
                            styles.messageTime,
                            isOwnMessage && styles.messageTimeOwn,
                          ]}
                        >
                          {formatTime(msg.created_at)}
                        </Text>
                      </View>

                      {isOwnMessage && <View style={styles.avatarPlaceholder} />}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Send a message to VIP members..."
                placeholderTextColor={colors.placeholder}
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                multiline
                maxLength={500}
                editable={!isSending}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageText.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
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
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 36,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 4,
  },
  messageBubbleOwn: {
    backgroundColor: colors.brandPrimary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  creatorBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFD700',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
