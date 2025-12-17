
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface PinnedMessage {
  id: string;
  comment_text: string;
  username: string;
  expires_at: string;
}

interface PinnedMessageBannerProps {
  streamId: string;
  canUnpin: boolean;
  onUnpin?: (messageId: string) => void;
}

export default function PinnedMessageBanner({
  streamId,
  canUnpin,
  onUnpin,
}: PinnedMessageBannerProps) {
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const channelRef = React.useRef<any>(null);

  const fetchPinnedMessage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stream_pinned_comments')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('pinned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching pinned message:', error);
        return;
      }

      setPinnedMessage(data);
    } catch (error) {
      console.error('Error in fetchPinnedMessage:', error);
    }
  }, [streamId]);

  const subscribeToPinnedMessages = useCallback(() => {
    const channel = supabase
      .channel(`stream:${streamId}:pinned`)
      .on('broadcast', { event: 'pinned_message_update' }, (payload) => {
        console.log('📌 Pinned message update:', payload);
        fetchPinnedMessage();
      })
      .subscribe();

    channelRef.current = channel;
  }, [streamId, fetchPinnedMessage]);

  useEffect(() => {
    fetchPinnedMessage();
    subscribeToPinnedMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchPinnedMessage, subscribeToPinnedMessages]);

  useEffect(() => {
    if (pinnedMessage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [pinnedMessage, fadeAnim]);

  const handleUnpin = async () => {
    if (!pinnedMessage || !onUnpin) return;

    try {
      const { error } = await supabase
        .from('stream_pinned_comments')
        .update({ is_active: false })
        .eq('id', pinnedMessage.id);

      if (error) {
        console.error('Error unpinning message:', error);
        return;
      }

      // Broadcast update
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'pinned_message_update',
          payload: { action: 'unpinned', messageId: pinnedMessage.id },
        });
      }

      onUnpin(pinnedMessage.id);
      setPinnedMessage(null);
    } catch (error) {
      console.error('Error in handleUnpin:', error);
    }
  };

  if (!pinnedMessage) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="pin.fill"
            android_material_icon_name="push_pin"
            size={16}
            color={colors.brandPrimary}
          />
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.username}>{pinnedMessage.username}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {pinnedMessage.comment_text}
          </Text>
        </View>
        {canUnpin && (
          <TouchableOpacity style={styles.unpinButton} onPress={handleUnpin}>
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={16}
              color={colors.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 0, 82, 0.95)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    flex: 1,
  },
  username: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  unpinButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
