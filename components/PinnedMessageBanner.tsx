
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface PinnedMessageBannerProps {
  streamId: string;
}

export default function PinnedMessageBanner({ streamId }: PinnedMessageBannerProps) {
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPinnedMessage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stream_pinned_comments')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching pinned message:', error);
        return;
      }

      setPinnedMessage(data);
    } catch (error) {
      console.error('Error fetching pinned message:', error);
    }
  }, [streamId]);

  const subscribeToPinnedMessages = useCallback(() => {
    const channel = supabase
      .channel(`pinned_messages:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_pinned_comments',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        console.log('Pinned message update:', payload);
        fetchPinnedMessage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, fetchPinnedMessage]);

  useEffect(() => {
    fetchPinnedMessage();
    const unsubscribe = subscribeToPinnedMessages();
    return unsubscribe;
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

  if (!pinnedMessage) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <IconSymbol
        ios_icon_name="pin.fill"
        android_material_icon_name="push_pin"
        size={16}
        color={colors.brandPrimary}
      />
      <Text style={styles.message} numberOfLines={2}>
        {pinnedMessage.comment_text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
