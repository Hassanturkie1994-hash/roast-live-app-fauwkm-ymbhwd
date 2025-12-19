
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface ManagePinnedMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
}

export default function ManagePinnedMessagesModal({
  visible,
  onClose,
  streamId,
}: ManagePinnedMessagesModalProps) {
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPinnedMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stream_pinned_comments')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true);

      if (error) throw error;
      setPinnedMessages(data || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    if (visible) {
      fetchPinnedMessages();
    }
  }, [visible, fetchPinnedMessages]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text style={styles.message}>{item.comment_text}</Text>
      <TouchableOpacity
        onPress={() => {
          console.log('Unpin message:', item.id);
        }}
      >
        <IconSymbol
          ios_icon_name="pin.slash.fill"
          android_material_icon_name="push_pin"
          size={20}
          color="#FF4444"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Pinned Messages</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          ) : (
            <FlatList
              data={pinnedMessages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
});
