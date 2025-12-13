
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
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

type ChatMessage = Tables<'chat_messages'> & {
  users: Tables<'users'>;
};

interface ChatOverlayProps {
  streamId: string;
  isBroadcaster?: boolean;
  streamDelay?: number;
}

export default function ChatOverlay({ 
  streamId, 
  isBroadcaster = false,
  streamDelay = 0 
}: ChatOverlayProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);

  // Debug indicator
  const [debugVisible, setDebugVisible] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎨 ChatOverlay mounted for stream:', streamId);
    
    // Hide debug indicator after 3 seconds
    const debugTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setDebugVisible(false);
      }
    }, 3000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(debugTimer);
    };
  }, [streamId]);

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

    // Use broadcast channel for real-time chat (more scalable and reliable)
    const channel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('💬 New chat message received via broadcast:', payload);
        
        if (!isMountedRef.current) return;
        
        const newMessage = payload.payload as ChatMessage;
        
        // Apply stream delay for non-broadcasters
        if (!isBroadcaster && streamDelay > 0) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setMessages((prev) => [...prev, newMessage]);
              
              // Fade animation for new messages
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
          
          // Fade animation for new messages
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
    // Always fetch recent messages and subscribe when component mounts
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
    // Auto-scroll to bottom when new messages arrive
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
      
      // Insert message into database
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

      // Broadcast the message to all viewers
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

  const renderMessage = (msg: ChatMessage, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.chatMessage,
        index === messages.length - 1 && { opacity: fadeAnim },
      ]}
    >
      <Text style={styles.chatUsername}>{msg.users.display_name}:</Text>
      <Text style={styles.chatText}>{msg.message}</Text>
    </Animated.View>
  );

  if (isBroadcaster) {
    // Broadcaster view - compact chat on the left side
    return (
      <View style={styles.broadcasterChatContainer} pointerEvents="box-none">
        {/* Debug indicator */}
        {debugVisible && (
          <View style={styles.debugIndicator}>
            <Text style={styles.debugText}>
              💬 Chat {isSubscribed ? '✅' : '⏳'}
            </Text>
          </View>
        )}
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.broadcasterChatMessages}
          contentContainerStyle={styles.chatMessagesContent}
          showsVerticalScrollIndicator={false}
          pointerEvents="box-none"
        >
          {messages.slice(-10).map(renderMessage)}
        </ScrollView>
      </View>
    );
  }

  // Viewer view - expandable chat
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.viewerChatContainer, isExpanded && styles.viewerChatExpanded]}
      pointerEvents="box-none"
    >
      {/* Debug indicator */}
      {debugVisible && (
        <View style={styles.debugIndicator}>
          <Text style={styles.debugText}>
            💬 Chat {isSubscribed ? '✅' : '⏳'}
          </Text>
        </View>
      )}
      
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
    maxHeight: 250,
    zIndex: 100,
  },
  broadcasterChatMessages: {
    maxHeight: 250,
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
  chatText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
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
  debugIndicator: {
    position: 'absolute',
    top: -30,
    left: 0,
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
