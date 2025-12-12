
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { globalLeaderboardService } from '@/app/services/globalLeaderboardService';

type LeaderboardTab = 'creators' | 'fans' | 'trending';

export function GlobalLeaderboardTabs() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('creators');
  const [loading, setLoading] = useState(true);
  const [creatorsData, setCreatorsData] = useState<any[]>([]);
  const [fansData, setFansData] = useState<any[]>([]);
  const [trendingData, setTrendingData] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      const [creators, fans, trending] = await Promise.all([
        globalLeaderboardService.getTopCreators(50),
        globalLeaderboardService.getTopFans(50),
        globalLeaderboardService.getTrendingCreators(50),
      ]);

      setCreatorsData(creators);
      setFansData(fans);
      setTrendingData(trending);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardEntry = (entry: any, index: number) => {
    const user = entry.creator || entry.fan;
    if (!user) return null;

    const getRankColor = (rank: number) => {
      if (rank === 1) return '#FFD700'; // Gold
      if (rank === 2) return '#C0C0C0'; // Silver
      if (rank === 3) return '#CD7F32'; // Bronze
      return colors.textSecondary;
    };

    const getRankEmoji = (rank: number) => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return `${rank}`;
    };

    return (
      <View key={entry.id} style={styles.entryContainer}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
            {getRankEmoji(entry.rank)}
          </Text>
        </View>

        <Image
          source={{ uri: user.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user.display_name || user.username}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{user.username}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          {activeTab === 'creators' && (
            <>
              <Text style={styles.statValue}>{entry.total_streams}</Text>
              <Text style={styles.statLabel}>streams</Text>
            </>
          )}
          {activeTab === 'fans' && (
            <>
              <Text style={styles.statValue}>{entry.total_gift_spending_sek} kr</Text>
              <Text style={styles.statLabel}>spent</Text>
            </>
          )}
          {activeTab === 'trending' && (
            <>
              <Text style={styles.statValue}>
                {entry.follower_growth_percentage.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>growth</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'creators':
        return creatorsData;
      case 'fans':
        return fansData;
      case 'trending':
        return trendingData;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'creators' && styles.activeTab]}
          onPress={() => setActiveTab('creators')}
        >
          <Text style={[styles.tabText, activeTab === 'creators' && styles.activeTabText]}>
            👑 Top Creators
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'fans' && styles.activeTab]}
          onPress={() => setActiveTab('fans')}
        >
          <Text style={[styles.tabText, activeTab === 'fans' && styles.activeTabText]}>
            💎 Top Fans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
          onPress={() => setActiveTab('trending')}
        >
          <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
            🔥 Trending
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {getCurrentData().map((entry, index) => renderLeaderboardEntry(entry, index))}
          {getCurrentData().length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No data available yet</Text>
              <Text style={styles.emptySubtext}>
                Leaderboards are updated weekly on Sunday midnight
              </Text>
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
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});