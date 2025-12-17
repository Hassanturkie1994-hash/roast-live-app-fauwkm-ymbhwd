
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface PinnedMessage {
  id: string;
  comment_text: string;
  username: string;
  pinned_at: string;
  expires_at: string;
  is_active: boolean;
}

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
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPinnedMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stream_pinned_comments')
        .select('*')
        .eq('stream_id', streamId)
        .order('pinned_at', { ascending: false });

      if (error) {
        console.error('Error fetching pinned messages:', error);
        return;
      }

      setPinnedMessages(data || []);
    } catch (error) {
      console.error('Error in fetchPinnedMessages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    if (visible) {
      fetchPinnedMessages();
    }
  }, [visible, fetchPinnedMessages]);

  const handleUnpin = async (messageId: string, messageText: string) => {
    Alert.alert(
      'Unpin Message',
      `Are you sure you want to unpin this message?\n\n"${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpin',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('stream_pinned_comments')
                .update({ is_active: false })
                .eq('id', messageId);

              if (error) {
                console.error('Error unpinning message:', error);
                Alert.alert('Error', 'Failed to unpin message.');
                return;
              }

              // Broadcast update
              const channel = supabase.channel(`stream:${streamId}:pinned`);
              await channel.send({
                type: 'broadcast',
                event: 'pinned_message_update',
                payload: { action: 'unpinned', messageId },
              });

              Alert.alert('Success', 'Message unpinned successfully.');
              fetchPinnedMessages();
            } catch (error) {
              console.error('Error in handleUnpin:', error);
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Pinned Messages</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
              <ActivityIndicator size="large" color={colors.gradientEnd} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {pinnedMessages.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="pin.slash"
                    android_material_icon_name="push_pin"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>No pinned messages</Text>
                </View>
              ) : (
                pinnedMessages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageCard,
                      !message.is_active && styles.messageCardInactive,
                      isExpired(message.expires_at) && styles.messageCardExpired,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.messageHeaderLeft}>
                        <IconSymbol
                          ios_icon_name="pin.fill"
                          android_material_icon_name="push_pin"
                          size={16}
                          color={
                            message.is_active && !isExpired(message.expires_at)
                              ? colors.brandPrimary
                              : colors.textSecondary
                          }
                        />
                        <Text style={styles.username}>{message.username}</Text>
                      </View>
                      {message.is_active && !isExpired(message.expires_at) && (
                        <TouchableOpacity
                          style={styles.unpinButton}
                          onPress={() => handleUnpin(message.id, message.comment_text)}
                        >
                          <IconSymbol
                            ios_icon_name="xmark.circle.fill"
                            android_material_icon_name="cancel"
                            size={20}
                            color={colors.gradientEnd}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.messageText}>{message.comment_text}</Text>

                    <View style={styles.messageFooter}>
                      <Text style={styles.messageDate}>
                        Pinned: {formatDate(message.pinned_at)}
                      </Text>
                      {isExpired(message.expires_at) ? (
                        <View style={styles.expiredBadge}>
                          <Text style={styles.expiredBadgeText}>Expired</Text>
                        </View>
                      ) : !message.is_active ? (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>Unpinned</Text>
                        </View>
                      ) : (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  messageCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
  },
  messageCardInactive: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  messageCardExpired: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  unpinButton: {
    padding: 4,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  expiredBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9800',
  },
});
