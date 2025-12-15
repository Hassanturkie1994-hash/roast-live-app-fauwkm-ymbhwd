
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { streamGuestService, GuestEvent } from '@/app/services/streamGuestService';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedChatOverlayProps {
  streamId: string;
  isBroadcaster: boolean;
  streamDelay?: number;
}

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  is_moderator?: boolean;
  is_pinned?: boolean;
  type: 'chat' | 'system';
}

export default function EnhancedChatOverlay({
  streamId,
  isBroadcaster,
  streamDelay = 0,
}: EnhancedChatOverlayProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);
  const guestChannelRef = useRef<any>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  // Debug indicator
  const [debugVisible, setDebugVisible] = useState(true);

  const loadRecentMessages = useCallback(async () => {
    if (!streamId || !isMountedRef.current) return;

    try {
      console.log('📥 Loading recent messages from chat_messages table');
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, users(id, display_name)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error loading messages:', error);
        return;
      }

      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        user_id: msg.user_id,
        username: msg.users?.display_name || 'Anonymous',
        message: msg.message,
        timestamp: msg.created_at,
        is_moderator: false,
        is_pinned: false,
        type: 'chat',
      })).reverse();

      console.log(`✅ Loaded ${formattedMessages.length} messages`);
      
      if (isMountedRef.current) {
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('❌ Error in loadRecentMessages:', error);
    }
  }, [streamId]);

  const subscribeToMessages = useCallback(() => {
    if (!streamId || !isMountedRef.current) return;

    console.log('🔌 Subscribing to enhanced chat channel:', `stream:${streamId}:chat_enhanced`);

    const channel = supabase
      .channel(`stream:${streamId}:chat_enhanced`)
      .on('broadcast', { event: 'new_message' }, async (payload) => {
        console.log('💬 New message received:', payload);
        
        if (!isMountedRef.current) return;
        
        const messageData = payload.payload;
        
        const newMessage: ChatMessage = {
          id: messageData.id,
          user_id: messageData.user_id,
          username: messageData.username || 'Anonymous',
          message: messageData.message,
          timestamp: messageData.created_at || new Date().toISOString(),
          is_moderator: messageData.is_moderator || false,
          is_pinned: messageData.is_pinned || false,
          type: 'chat',
        };

        // Apply stream delay for non-broadcasters
        if (!isBroadcaster && streamDelay > 0) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setMessages((prev) => [...prev, newMessage]);
            }
          }, streamDelay * 1000);
        } else {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe((status) => {
        console.log('📡 Enhanced chat channel subscription status:', status);
        if (status === 'SUBSCRIBED' && isMountedRef.current) {
          setIsSubscribed(true);
          console.log('✅ Successfully subscribed to enhanced chat channel');
        }
      });

    channelRef.current = channel;
  }, [streamId, isBroadcaster, streamDelay]);

  const subscribeToGuestEvents = useCallback(() => {
    if (!streamId || !isMountedRef.current) return;

    console.log('🔌 Subscribing to guest events channel');

    const channel = streamGuestService.subscribeToGuestEvents(streamId, (payload) => {
      console.log('👥 Guest event received:', payload);
      
      if (!isMountedRef.current) return;
      
      let systemMessage: ChatMessage | null = null;
      const timestamp = new Date().toISOString();

      if (payload.eventType === 'INSERT' && payload.new) {
        // Database insert event
        const event = payload.new as GuestEvent;
        systemMessage = createSystemMessage(event, timestamp);
      } else if (payload.event) {
        // Broadcast event
        const eventData = payload.payload || payload;
        systemMessage = createSystemMessageFromBroadcast(payload.event, eventData, timestamp);
      }

      if (systemMessage && isMountedRef.current) {
        setMessages((prev) => [...prev, systemMessage!]);
      }
    });

    guestChannelRef.current = channel;
  }, [streamId]);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎨 EnhancedChatOverlay mounted for stream:', streamId);
    
    // Hide debug indicator after 3 seconds
    const debugTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setDebugVisible(false);
      }
    }, 3000);

    loadRecentMessages();
    subscribeToMessages();
    subscribeToGuestEvents();

    return () => {
      isMountedRef.current = false;
      clearTimeout(debugTimer);
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (guestChannelRef.current) {
        supabase.removeChannel(guestChannelRef.current);
        guestChannelRef.current = null;
      }
    };
  }, [streamId, loadRecentMessages, subscribeToMessages, subscribeToGuestEvents]);

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [isExpanded, expandAnim]);

  const createSystemMessage = (event: GuestEvent, timestamp: string): ChatMessage => {
    let message = '';
    
    switch (event.event_type) {
      case 'joined_live':
        message = `${event.display_name} joined live`;
        break;
      case 'left_live':
        message = `${event.display_name} left live`;
        break;
      case 'host_removed':
        message = `${event.display_name} was removed`;
        break;
      case 'became_moderator':
        message = `${event.display_name} became moderator`;
        break;
      case 'removed_moderator':
        message = `${event.display_name} is no longer moderator`;
        break;
      case 'muted_mic':
        message = `${event.display_name} muted mic`;
        break;
      case 'unmuted_mic':
        message = `${event.display_name} unmuted mic`;
        break;
      case 'enabled_camera':
        message = `${event.display_name} enabled camera`;
        break;
      case 'disabled_camera':
        message = `${event.display_name} disabled camera`;
        break;
      case 'declined_invitation':
        message = event.metadata?.message || `${event.display_name} declined invitation`;
        break;
      default:
        message = `${event.display_name} ${event.event_type}`;
    }

    return {
      id: event.id,
      user_id: 'system',
      username: 'System',
      message,
      timestamp,
      type: 'system',
    };
  };

  const createSystemMessageFromBroadcast = (
    eventType: string,
    eventData: any,
    timestamp: string
  ): ChatMessage => {
    let message = '';
    const displayName = eventData.displayName || 'Guest';

    switch (eventType) {
      case 'guest_joined':
        message = `${displayName} joined live`;
        break;
      case 'guest_left':
        message = `${displayName} left live`;
        break;
      case 'guest_removed':
        message = `${displayName} was removed`;
        break;
      case 'invitation_declined':
        message = `${displayName} declined invitation`;
        break;
      case 'guest_mic_updated':
        message = `${displayName} ${eventData.micEnabled ? 'unmuted' : 'muted'} mic`;
        break;
      case 'guest_camera_updated':
        message = `${displayName} ${eventData.cameraEnabled ? 'enabled' : 'disabled'} camera`;
        break;
      case 'guest_moderator_updated':
        message = `${displayName} ${eventData.isModerator ? 'became moderator' : 'is no longer moderator'}`;
        break;
      case 'seats_lock_updated':
        message = `Host ${eventData.locked ? 'locked' : 'unlocked'} guest seats`;
        break;
      default:
        message = `Guest event: ${eventType}`;
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      user_id: 'system',
      username: 'System',
      message,
      timestamp,
      type: 'system',
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !isMountedRef.current) {
      return;
    }

    setIsSending(true);

    try {
      const trimmedMessage = inputText.trim();
      console.log('📤 Sending enhanced chat message:', trimmedMessage);

      // Insert message into database
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: trimmedMessage,
        })
        .select('*, users(id, display_name)')
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
        return;
      }

      console.log('✅ Message saved to database');

      // Broadcast the message to all viewers
      if (channelRef.current && newMessage && isMountedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: {
            id: newMessage.id,
            user_id: newMessage.user_id,
            username: newMessage.users?.display_name || 'Anonymous',
            message: newMessage.message,
            created_at: newMessage.created_at,
            is_moderator: false,
            is_pinned: false,
          },
        });
        console.log('📡 Message broadcasted to all viewers');
      }

      if (isMountedRef.current) {
        setInputText('');
      }
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      if (isMountedRef.current) {
        setIsSending(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={14}
              color={colors.gradientEnd}
            />
            <Text style={styles.systemMessageText}>{item.message}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, item.is_pinned && styles.pinnedMessage]}>
        {item.is_pinned && (
          <View style={styles.pinnedBadge}>
            <IconSymbol
              ios_icon_name="pin.fill"
              android_material_icon_name="push_pin"
              size={10}
              color={colors.text}
            />
          </View>
        )}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={[styles.username, item.is_moderator && styles.moderatorUsername]}>
              {item.username}
            </Text>
            {item.is_moderator && (
              <View style={styles.modBadge}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="shield"
                  size={10}
                  color={colors.text}
                />
                <Text style={styles.modBadgeText}>MOD</Text>
              </View>
            )}
          </View>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      </View>
    );
  };

  const chatHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 500],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.chatContainer, { height: chatHeight }]}>
        {/* Debug indicator */}
        {debugVisible && (
          <View style={styles.debugIndicator}>
            <Text style={styles.debugText}>
              💬 Enhanced Chat {isSubscribed ? '✅' : '⏳'}
            </Text>
          </View>
        )}
        
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Live Chat</Text>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <IconSymbol
              ios_icon_name={isExpanded ? 'chevron.down' : 'chevron.up'}
              android_material_icon_name={isExpanded ? 'expand_more' : 'expand_less'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {user && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Send a message..."
              placeholderTextColor={colors.placeholder}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!isSending}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (isSending || !inputText.trim()) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isSending || !inputText.trim()}
            >
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  chatContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  expandButton: {
    padding: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 12,
    gap: 8,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
  },
  pinnedMessage: {
    backgroundColor: 'rgba(164, 0, 40, 0.2)',
    borderColor: colors.gradientEnd,
    borderWidth: 1,
  },
  pinnedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.gradientEnd,
    borderRadius: 10,
    padding: 4,
  },
  messageContent: {
    gap: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  moderatorUsername: {
    color: colors.gradientEnd,
  },
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(164, 0, 40, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(164, 0, 40, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(164, 0, 40, 0.3)',
  },
  systemMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: colors.gradientEnd,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  debugIndicator: {
    position: 'absolute',
    top: -30,
    left: 16,
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1000,
  },
  debugText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
