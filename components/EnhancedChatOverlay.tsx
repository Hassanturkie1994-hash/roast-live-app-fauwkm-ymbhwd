
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
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import UserActionModal from './UserActionModal';
import { moderationService } from '@/app/services/moderationService';

type ChatMessage = Tables<'chat_messages'> & {
  users: Tables<'users'>;
};

interface EnhancedChatOverlayProps {
  streamId: string;
  isBroadcaster?: boolean;
  streamDelay?: number;
  hostId?: string;
  hostName?: string;
  streamerId: string;
}

export default function EnhancedChatOverlay({ 
  streamId, 
  isBroadcaster = false,
  streamDelay = 0,
  hostId,
  hostName = 'Host',
  streamerId,
}: EnhancedChatOverlayProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState<ChatMessage | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);

  const checkModeratorStatus = useCallback(async () => {
    if (!user) return;
    const isMod = await moderationService.isModerator(streamerId, user.id);
    if (isMountedRef.current) {
      setIsModerator(isMod);
    }
  }, [user, streamerId]);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎨 EnhancedChatOverlay mounted for stream:', streamId);
    
    if (user) {
      checkModeratorStatus();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [streamId, user, checkModeratorStatus]);

  const fetchRecentMessages = useCallback(async () => {
    if (!streamId || !isMountedRef.current) return;

    try {
      console.log('📥 Fetching recent messages for stream:', streamId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, users(*)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching chat messages:', error);
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} recent messages`);
      
      if (isMountedRef.current) {
        setMessages(data as ChatMessage[]);
      }
    } catch (error) {
      console.error('❌ Error in fetchRecentMessages:', error);
    }
  }, [streamId]);

  const subscribeToChat = useCallback(() => {
    if (!streamId || !isMountedRef.current) {
      console.warn('⚠️ Cannot subscribe to chat: missing streamId or component unmounted');
      return;
    }

    console.log('🔌 Subscribing to chat channel:', `stream:${streamId}:chat`);

    const channel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('💬 New chat message received via broadcast:', payload);
        
        if (!isMountedRef.current) return;
        
        const newMessage = payload.payload as ChatMessage;
        
        if (!isBroadcaster && streamDelay > 0) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setMessages((prev) => [...prev, newMessage]);
              
              Animated.sequence([
                Animated.timing(fadeAnim, {
                  toValue: 0.5,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            }
          }, streamDelay * 1000);
        } else {
          setMessages((prev) => [...prev, newMessage]);
          
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      })
      .subscribe((status) => {
        console.log('📡 Chat channel subscription status:', status);
        if (status === 'SUBSCRIBED' && isMountedRef.current) {
          setIsSubscribed(true);
          console.log('✅ Successfully subscribed to chat channel');
        }
      });

    channelRef.current = channel;
  }, [streamId, isBroadcaster, streamDelay, fadeAnim]);

  useEffect(() => {
    fetchRecentMessages();
    subscribeToChat();

    return () => {
      console.log('🔌 Unsubscribing from chat channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (isMountedRef.current) {
        setIsSubscribed(false);
      }
    };
  }, [fetchRecentMessages, subscribeToChat]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !isMountedRef.current) return;

    const trimmedMessage = messageText.trim();
    
    try {
      console.log('📤 Sending message:', trimmedMessage);
      
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: trimmedMessage,
        })
        .select('*, users(*)')
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        return;
      }

      console.log('✅ Message saved to database');

      // Add message to local state immediately for broadcaster
      if (isBroadcaster && newMessage && isMountedRef.current) {
        setMessages((prev) => [...prev, newMessage]);
      }

      if (channelRef.current && newMessage && isMountedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMessage,
        });
        console.log('📡 Message broadcasted to all viewers');
      }

      if (isMountedRef.current) {
        setMessageText('');
      }
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
    }
  };

  const handleUsernamePress = (userId: string, username: string) => {
    if (!isBroadcaster && !isModerator) return;
    setSelectedUser({ id: userId, name: username });
  };

  const handlePinMessage = async (message: ChatMessage) => {
    if (!isBroadcaster && !isModerator) {
      Alert.alert('Permission Denied', 'Only moderators and the host can pin messages.');
      return;
    }

    if (!user) return;

    try {
      // Set expiration to 5 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      const { error } = await supabase
        .from('stream_pinned_comments')
        .insert({
          stream_id: streamId,
          comment_id: message.id,
          comment_text: message.message,
          user_id: message.user_id,
          username: message.users.display_name,
          pinned_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('Error pinning message:', error);
        Alert.alert('Error', 'Failed to pin message.');
        return;
      }

      // Broadcast pinned message update
      const channel = supabase.channel(`stream:${streamId}:pinned`);
      await channel.send({
        type: 'broadcast',
        event: 'pinned_message_update',
        payload: { action: 'pinned', messageId: message.id },
      });

      Alert.alert('Success', 'Message pinned successfully.');
      setLongPressedMessage(null);
    } catch (error) {
      console.error('Error in handlePinMessage:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isHost = msg.user_id === hostId;
    const canInteract = isBroadcaster || isModerator;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.chatMessage,
          index === messages.length - 1 && { opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity
          onPress={() => canInteract && handleUsernamePress(msg.user_id, msg.users.display_name)}
          onLongPress={() => canInteract && setLongPressedMessage(msg)}
          disabled={!canInteract}
        >
          <Text style={styles.chatUsername}>
            <Text style={isHost ? styles.hostUsername : undefined}>
              {msg.users.display_name}
            </Text>
            {isHost && <Text style={styles.hostLabel}> - Host</Text>}
            :
          </Text>
          <Text style={styles.chatText}>{msg.message}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isBroadcaster) {
    return (
      <>
        <View style={styles.broadcasterChatContainer} pointerEvents="box-none">
          <ScrollView
            ref={scrollViewRef}
            style={styles.broadcasterChatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
            pointerEvents="box-none"
          >
            {messages.slice(-10).map(renderMessage)}
          </ScrollView>

          {/* Host Chat Input */}
          <View style={styles.hostChatInputContainer}>
            <TextInput
              style={styles.hostChatInput}
              placeholder="Send a message..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={messageText}
              onChangeText={setMessageText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!!user}
            />
            <TouchableOpacity 
              style={styles.hostSendButton} 
              onPress={handleSendMessage}
              disabled={!user || !messageText.trim()}
            >
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Action Modal */}
        {selectedUser && user && (
          <UserActionModal
            visible={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            userId={selectedUser.id}
            username={selectedUser.name}
            streamId={streamId}
            streamerId={streamerId}
            currentUserId={user.id}
            isHost={user.id === hostId}
            isModerator={isModerator}
          />
        )}

        {/* Long Press Menu for Pinning */}
        {longPressedMessage && (
          <Modal
            visible={!!longPressedMessage}
            transparent
            animationType="fade"
            onRequestClose={() => setLongPressedMessage(null)}
          >
            <TouchableOpacity
              style={styles.longPressOverlay}
              activeOpacity={1}
              onPress={() => setLongPressedMessage(null)}
            >
              <View style={styles.longPressMenu}>
                <TouchableOpacity
                  style={styles.longPressMenuItem}
                  onPress={() => handlePinMessage(longPressedMessage)}
                >
                  <IconSymbol
                    ios_icon_name="pin.fill"
                    android_material_icon_name="push_pin"
                    size={20}
                    color={colors.brandPrimary}
                  />
                  <Text style={styles.longPressMenuText}>Pin Message</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.viewerChatContainer, isExpanded && styles.viewerChatExpanded]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.chatToggle}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <IconSymbol
          ios_icon_name="bubble.left.fill"
          android_material_icon_name="chat"
          size={20}
          color={colors.text}
        />
        <Text style={styles.chatToggleText}>
          {isExpanded ? 'Hide Chat' : 'Show Chat'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.viewerChatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
            pointerEvents="box-none"
          >
            {messages.map(renderMessage)}
          </ScrollView>

          <View style={styles.chatInputContainer} pointerEvents="box-none">
            <TextInput
              style={styles.chatInput}
              placeholder="Send a message..."
              placeholderTextColor={colors.placeholder}
              value={messageText}
              onChangeText={setMessageText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!!user}
            />
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={handleSendMessage}
              disabled={!user || !messageText.trim()}
            >
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  broadcasterChatContainer: {
    position: 'absolute',
    left: 16,
    bottom: 140,
    width: '55%',
    maxHeight: 300,
    zIndex: 100,
  },
  broadcasterChatMessages: {
    maxHeight: 200,
    marginBottom: 8,
  },
  chatMessagesContent: {
    paddingBottom: 8,
  },
  chatMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  chatUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gradientEnd,
    marginBottom: 2,
  },
  hostUsername: {
    color: '#FF0000',
    fontWeight: '800',
  },
  hostLabel: {
    color: '#FF0000',
    fontWeight: '800',
    fontSize: 11,
  },
  chatText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  hostChatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  hostChatInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  hostSendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerChatContainer: {
    position: 'absolute',
    left: 16,
    bottom: 120,
    width: '60%',
    maxHeight: 60,
    zIndex: 100,
  },
  viewerChatExpanded: {
    maxHeight: 350,
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 8,
  },
  chatToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  viewerChatMessages: {
    maxHeight: 250,
    marginBottom: 8,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 8,
  },
  longPressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  longPressMenu: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
  },
  longPressMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  longPressMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
