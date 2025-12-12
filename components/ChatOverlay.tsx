
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
}

export default function ChatOverlay({ streamId, isBroadcaster = false }: ChatOverlayProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchRecentMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, users(*)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching chat messages:', error);
        return;
      }

      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error('Error in fetchRecentMessages:', error);
    }
  }, [streamId]);

  const subscribeToChat = useCallback(() => {
    // Use broadcast for real-time chat (more scalable than postgres_changes)
    const channel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('broadcast', { event: 'message' }, async (payload) => {
        console.log('New chat message:', payload);
        
        const newMessage = payload.payload as ChatMessage;
        
        setMessages((prev) => [...prev, newMessage]);
        
        // Fade in animation for new messages
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
      })
      .subscribe();

    channelRef.current = channel;
  }, [streamId, fadeAnim]);

  useEffect(() => {
    fetchRecentMessages();
    subscribeToChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
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
    if (!messageText.trim() || !user) return;

    try {
      // Insert message into database
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: messageText.trim(),
        })
        .select('*, users(*)')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Broadcast the message to all viewers
      if (channelRef.current && newMessage) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'message',
          payload: newMessage,
        });
      }

      setMessageText('');
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
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
      <View style={styles.broadcasterChatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.broadcasterChatMessages}
          contentContainerStyle={styles.chatMessagesContent}
          showsVerticalScrollIndicator={false}
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
    >
      <TouchableOpacity
        style={styles.chatToggle}
        onPress={() => setIsExpanded(!isExpanded)}
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
          >
            {messages.map(renderMessage)}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Send a message..."
              placeholderTextColor={colors.placeholder}
              value={messageText}
              onChangeText={setMessageText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
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
});