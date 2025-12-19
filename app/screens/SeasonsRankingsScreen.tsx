
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedRoastIcon from '@/components/Icons/UnifiedRoastIcon';
import { leaderboardService } from '@/app/services/leaderboardService';
import { globalLeaderboardService } from '@/app/services/globalLeaderboardService';

interface SeasonData {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'ended';
}

interface RankingData {
  rank: number;
  username: string;
  display_name: string;
  total_roast_score: number;
  level: number;
}

export default function SeasonsRankingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'seasons' | 'rankings'>('seasons');
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [userRank, setUserRank] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'seasons') {
        // Load seasons data
        const seasonsData = await leaderboardService.getAllSeasons();
        setSeasons(seasonsData || []);
      } else {
        // Load rankings data
        const rankingsData = await globalLeaderboardService.getGlobalLeaderboard('all_time', 50);
        setRankings(rankingsData || []);
        
        if (user) {
          const userRankData = await globalLeaderboardService.getUserRank(user.id, 'all_time');
          setUserRank(userRankData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeasonStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'upcoming':
        return '#FF9800';
      case 'ended':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return colors.text;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <UnifiedRoastIcon name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Seasons & Rankings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'seasons' && { borderBottomColor: colors.brandPrimary }]}
          onPress={() => setActiveTab('seasons')}
        >
          <UnifiedRoastIcon
            name="crown"
            size={20}
            color={activeTab === 'seasons' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'seasons' ? colors.brandPrimary : colors.textSecondary }]}>
            SEASONS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'rankings' && { borderBottomColor: colors.brandPrimary }]}
          onPress={() => setActiveTab('rankings')}
        >
          <UnifiedRoastIcon
            name="roast-badge"
            size={20}
            color={activeTab === 'rankings' ? colors.brandPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'rankings' ? colors.brandPrimary : colors.textSecondary }]}>
            RANKINGS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'seasons' ? (
            <View style={styles.seasonsContainer}>
              {seasons.length === 0 ? (
                <View style={styles.emptyState}>
                  <UnifiedRoastIcon name="crown" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No seasons available</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Check back later for upcoming seasons
                  </Text>
                </View>
              ) : (
                seasons.map((season) => (
                  <View key={season.id} style={[styles.seasonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.seasonHeader}>
                      <Text style={[styles.seasonName, { color: colors.text }]}>{season.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getSeasonStatusColor(season.status) }]}>
                        <Text style={styles.statusText}>{season.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.seasonDates}>
                      <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.rankingsContainer}>
              {userRank && (
                <View style={[styles.userRankCard, { backgroundColor: colors.brandPrimary, borderColor: colors.border }]}>
                  <Text style={styles.userRankTitle}>Your Rank</Text>
                  <View style={styles.userRankContent}>
                    <Text style={styles.userRankNumber}>#{userRank.rank}</Text>
                    <View style={styles.userRankDetails}>
                      <Text style={styles.userRankName}>{userRank.display_name}</Text>
                      <Text style={styles.userRankScore}>{userRank.total_roast_score.toLocaleString()} points</Text>
                    </View>
                  </View>
                </View>
              )}

              {rankings.length === 0 ? (
                <View style={styles.emptyState}>
                  <UnifiedRoastIcon name="roast-badge" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No rankings available</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Start streaming to earn your rank
                  </Text>
                </View>
              ) : (
                rankings.map((ranking) => (
                  <View key={ranking.username} style={[styles.rankingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.backgroundAlt }]}>
                      <Text style={[styles.rankNumber, { color: getRankColor(ranking.rank) }]}>#{ranking.rank}</Text>
                    </View>
                    <View style={styles.rankingDetails}>
                      <Text style={[styles.rankingName, { color: colors.text }]}>{ranking.display_name}</Text>
                      <Text style={[styles.rankingUsername, { color: colors.textSecondary }]}>@{ranking.username}</Text>
                      <View style={styles.rankingStats}>
                        <UnifiedRoastIcon name="flame" size={14} color={colors.brandPrimary} />
                        <Text style={[styles.rankingScore, { color: colors.text }]}>
                          {ranking.total_roast_score.toLocaleString()} points
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.levelBadge, { backgroundColor: colors.brandPrimary }]}>
                      <Text style={styles.levelText}>LVL {ranking.level}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  seasonsContainer: {
    padding: 16,
    gap: 12,
  },
  seasonCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seasonName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  seasonDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rankingsContainer: {
    padding: 16,
    gap: 12,
  },
  userRankCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  userRankTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userRankNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userRankDetails: {
    flex: 1,
  },
  userRankName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userRankScore: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 16,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  rankingDetails: {
    flex: 1,
    gap: 4,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '700',
  },
  rankingUsername: {
    fontSize: 13,
    fontWeight: '500',
  },
  rankingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingScore: {
    fontSize: 13,
    fontWeight: '600',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
