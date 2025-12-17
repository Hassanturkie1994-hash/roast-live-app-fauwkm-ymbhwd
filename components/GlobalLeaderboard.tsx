
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { leaderboardService, LeaderboardEntry } from '@/app/services/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';

interface GlobalLeaderboardProps {
  creatorId: string;
  type: 'weekly' | 'alltime';
  limit?: number;
}

export default function GlobalLeaderboard({
  creatorId,
  type,
  limit = 10,
}: GlobalLeaderboardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data =
        type === 'weekly'
          ? await leaderboardService.getWeeklyLeaderboard(creatorId, limit)
          : await leaderboardService.getGlobalLeaderboard(creatorId, limit);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [creatorId, type, limit]);

  useEffect(() => {
    loadLeaderboard();
    // Auto-refresh every 20 seconds
    const interval = setInterval(loadLeaderboard, 20000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color="#A40028" />
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No supporters yet
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {type === 'weekly' ? 'Top Supporters This Week' : 'Top Supporters All Time'}
        </Text>
        <TouchableOpacity onPress={loadLeaderboard}>
          <Text style={[styles.refreshText, { color: '#A40028' }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={[styles.rank, { color: colors.text }]}>{getMedalEmoji(index + 1)}</Text>

            {/* Avatar */}
            {entry.avatar_url ? (
              <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#A40028' }]}>
                <Text style={styles.avatarText}>{entry.username.charAt(0).toUpperCase()}</Text>
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

            {/* Value Badge for Top 3 */}
            {index < 3 && (
              <LinearGradient
                colors={['#A40028', '#E30052']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.valueBadge}
              >
                <Text style={styles.valueBadgeText}>{entry.total_value.toFixed(0)} SEK</Text>
              </LinearGradient>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 20,
  },
  listContainer: {
    maxHeight: 400,
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
