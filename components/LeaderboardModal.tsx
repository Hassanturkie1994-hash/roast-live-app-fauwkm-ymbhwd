
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { leaderboardService, LeaderboardEntry } from '@/app/services/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
  creatorId: string;
  title?: string;
}

export default function LeaderboardModal({
  visible,
  onClose,
  streamId,
  creatorId,
  title = 'Top Supporters',
}: LeaderboardModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await leaderboardService.getStreamLeaderboard(streamId, creatorId, 10);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [streamId, creatorId]);

  useEffect(() => {
    if (visible) {
      loadLeaderboard();
      // Auto-refresh every 15 seconds
      const interval = setInterval(loadLeaderboard, 15000);
      return () => clearInterval(interval);
    }
  }, [visible, loadLeaderboard]);

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}.`;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Leaderboard List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A40028" />
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No supporters yet. Be the first to send a gift!
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
              {leaderboard.map((entry, index) => (
                <View
                  key={entry.user_id}
                  style={[
                    styles.leaderboardItem,
                    index < 3 && styles.topThreeItem,
                    { borderColor: colors.border },
                  ]}
                >
                  {/* Rank */}
                  <Text style={[styles.rank, { color: colors.text }]}>
                    {getMedalEmoji(index + 1)}
                  </Text>

                  {/* Avatar */}
                  {entry.avatar_url ? (
                    <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#A40028' }]}>
                      <Text style={styles.avatarText}>
                        {entry.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                        {entry.display_name || entry.username}
                      </Text>
                      {/* Badges */}
                      {entry.is_moderator && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>MOD</Text>
                        </View>
                      )}
                      {entry.is_vip && entry.vip_badge && (
                        <View style={[styles.badge, styles.vipBadge]}>
                          <Text style={styles.badgeText}>{entry.vip_badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.totalValue, { color: colors.textSecondary }]}>
                      {entry.total_value.toFixed(2)} SEK
                    </Text>
                  </View>

                  {/* Value Badge */}
                  {index < 3 && (
                    <LinearGradient
                      colors={['#A40028', '#E30052']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.valueBadge}
                    >
                      <Text style={styles.valueBadgeText}>
                        {entry.total_value.toFixed(0)} SEK
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topThreeItem: {
    paddingVertical: 16,
  },
  rank: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vipBadge: {
    backgroundColor: '#FFD700',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
  },
  valueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  valueBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
