
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import {
  leaderboardSnapshotService,
  LeaderboardSnapshot,
} from '@/app/services/leaderboardSnapshotService';

type PeriodType = 'daily' | 'weekly' | 'monthly';
type LeaderboardType = 'top_creators_gifts' | 'top_fans_gifts' | 'most_active_comments' | 'fastest_growing_followers';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('weekly');
  const [selectedType, setSelectedType] = useState<LeaderboardType>('top_creators_gifts');
  const [leaderboard, setLeaderboard] = useState<LeaderboardSnapshot[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; score: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await leaderboardSnapshotService.getLeaderboard(selectedPeriod, selectedType, 100);
      setLeaderboard(data);

      if (user) {
        const rank = await leaderboardSnapshotService.getUserRank(user.id, selectedPeriod, selectedType);
        setUserRank(rank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, selectedType, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getLeaderboardTitle = () => {
    switch (selectedType) {
      case 'top_creators_gifts':
        return 'Top Creators (Gifts Received)';
      case 'top_fans_gifts':
        return 'Top Fans (Gifts Sent)';
      case 'most_active_comments':
        return 'Most Active (Comments & Likes)';
      case 'fastest_growing_followers':
        return 'Fastest Growing (Followers)';
    }
  };

  const formatScore = (score: number, type: LeaderboardType) => {
    if (type === 'top_creators_gifts' || type === 'top_fans_gifts') {
      return `${score.toFixed(0)} SEK`;
    }
    return score.toFixed(0);
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="arrow.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboards</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeSelector}
        contentContainerStyle={styles.typeSelectorContent}
      >
        {([
          { key: 'top_creators_gifts', label: 'Top Creators', icon: 'star.fill' },
          { key: 'top_fans_gifts', label: 'Top Fans', icon: 'heart.fill' },
          { key: 'most_active_comments', label: 'Most Active', icon: 'bubble.left.fill' },
          { key: 'fastest_growing_followers', label: 'Fastest Growing', icon: 'arrow.up.right' },
        ] as { key: LeaderboardType; label: string; icon: string }[]).map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeButton,
              selectedType === type.key && styles.typeButtonActive,
            ]}
            onPress={() => setSelectedType(type.key)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name={type.icon}
              android_material_icon_name={type.icon.replace('.', '_')}
              size={20}
              color={selectedType === type.key ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                selectedType === type.key && styles.typeButtonTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Rank Card */}
      {userRank && (
        <View style={styles.userRankCard}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.userRankGradient}
          >
            <View style={styles.userRankContent}>
              <View style={styles.userRankLeft}>
                <Text style={styles.userRankLabel}>Your Rank</Text>
                <Text style={styles.userRankValue}>
                  #{userRank.rank} of {userRank.total}
                </Text>
              </View>
              <View style={styles.userRankRight}>
                <Text style={styles.userRankScore}>
                  {formatScore(userRank.score, selectedType)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.gradientStart} />
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="chart.bar"
              android_material_icon_name="bar_chart"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>
              Leaderboard will be updated daily
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.leaderboardTitle}>{getLeaderboardTitle()}</Text>
            {leaderboard.map((entry, index) => {
              const medal = getMedalEmoji(entry.rank);
              const isTop3 = entry.rank <= 3;

              return (
                <View
                  key={index}
                  style={[
                    styles.leaderboardItem,
                    isTop3 && styles.leaderboardItemTop3,
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.rankContainer}>
                    {medal ? (
                      <Text style={styles.medalEmoji}>{medal}</Text>
                    ) : (
                      <Text style={styles.rankText}>#{entry.rank}</Text>
                    )}
                  </View>

                  {/* Avatar */}
                  {entry.user?.avatar_url ? (
                    <Image
                      source={{ uri: entry.user.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>
                        {entry.user?.username?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.username} numberOfLines={1}>
                        {entry.user?.display_name || entry.user?.username || 'Unknown'}
                      </Text>
                      {entry.user?.premium_active && (
                        <LinearGradient
                          colors={[colors.gradientStart, colors.gradientEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.premiumBadge}
                        >
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </LinearGradient>
                      )}
                    </View>
                    <Text style={styles.scoreText}>
                      {formatScore(entry.score, selectedType)}
                    </Text>
                  </View>

                  {/* Badge for Top 10 */}
                  {entry.rank <= 10 && (
                    <View style={styles.badgeContainer}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.topBadge}
                      >
                        <Text style={styles.topBadgeText}>TOP {entry.rank}</Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.gradientStart,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.text,
  },
  typeSelector: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  typeSelectorContent: {
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: colors.gradientStart,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.text,
  },
  userRankCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  userRankGradient: {
    padding: 16,
  },
  userRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRankLeft: {
    gap: 4,
  },
  userRankLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.8,
  },
  userRankValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userRankRight: {
    alignItems: 'flex-end',
  },
  userRankScore: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  leaderboardItemTop3: {
    backgroundColor: colors.backgroundAlt,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 28,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gradientStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  topBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
});
