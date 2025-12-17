
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { moderationService, ModerationHistoryEntry } from '@/app/services/moderationService';

interface ModerationHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  streamerId: string;
}

export default function ModerationHistoryModal({
  visible,
  onClose,
  streamerId,
}: ModerationHistoryModalProps) {
  const [history, setHistory] = useState<ModerationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await moderationService.getModerationHistory(streamerId, 100);
      setHistory(data);
    } catch (error) {
      console.error('Error loading moderation history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, loadHistory]);

  const getActionIcon = (actionType: string): { ios: string; android: string; color: string } => {
    switch (actionType) {
      case 'ban':
        return { ios: 'hand.raised.fill', android: 'block', color: '#FF4444' };
      case 'unban':
        return { ios: 'hand.raised.slash.fill', android: 'check_circle', color: '#00FF88' };
      case 'timeout':
        return { ios: 'clock.fill', android: 'schedule', color: '#FFB800' };
      case 'remove_timeout':
        return { ios: 'clock.arrow.circlepath', android: 'restore', color: '#00FF88' };
      case 'add_moderator':
        return { ios: 'shield.fill', android: 'shield', color: '#00AAFF' };
      case 'remove_moderator':
        return { ios: 'shield.slash.fill', android: 'shield', color: '#FF8800' };
      case 'remove_comment':
        return { ios: 'trash.fill', android: 'delete', color: '#FF4444' };
      case 'pin_comment':
        return { ios: 'pin.fill', android: 'push_pin', color: '#FFB800' };
      case 'unpin_comment':
        return { ios: 'pin.slash.fill', android: 'push_pin', color: colors.textSecondary };
      default:
        return { ios: 'info.circle.fill', android: 'info', color: colors.textSecondary };
    }
  };

  const formatActionType = (actionType: string): string => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDuration = (durationSec: number | null): string => {
    if (!durationSec) return '';
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Moderation History</Text>
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
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No moderation actions yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {history.map((entry) => {
                const actionConfig = getActionIcon(entry.action_type);
                return (
                  <View key={entry.id} style={styles.historyItem}>
                    <View style={[styles.iconContainer, { backgroundColor: `${actionConfig.color}20` }]}>
                      <IconSymbol
                        ios_icon_name={actionConfig.ios}
                        android_material_icon_name={actionConfig.android}
                        size={20}
                        color={actionConfig.color}
                      />
                    </View>
                    <View style={styles.historyDetails}>
                      <Text style={styles.actionType}>
                        {formatActionType(entry.action_type)}
                      </Text>
                      <Text style={styles.historyText}>
                        <Text style={styles.moderatorName}>
                          {entry.moderator?.display_name || 'Unknown'}
                        </Text>
                        {' → '}
                        <Text style={styles.targetName}>
                          {entry.target?.display_name || 'Unknown'}
                        </Text>
                      </Text>
                      {entry.reason && (
                        <Text style={styles.reason} numberOfLines={2}>
                          Reason: {entry.reason}
                        </Text>
                      )}
                      {entry.duration_sec && (
                        <Text style={styles.duration}>
                          Duration: {formatDuration(entry.duration_sec)}
                        </Text>
                      )}
                      <Text style={styles.timestamp}>
                        {formatTimestamp(entry.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDetails: {
    flex: 1,
    gap: 4,
  },
  actionType: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  historyText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  moderatorName: {
    fontWeight: '600',
    color: colors.text,
  },
  targetName: {
    fontWeight: '600',
    color: colors.gradientEnd,
  },
  reason: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  duration: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gradientEnd,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
});